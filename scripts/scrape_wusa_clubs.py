"""
Scrape club information from University of Waterloo WUSA Clubs site.

Target listing pages:
  https://clubs.wusa.ca/club_listings?page=1  ... up to page=16

Target club detail pages:
  https://clubs.wusa.ca/clubs/<numeric_id>

This script mirrors the JSON shape used by the UCalgary scraper
in `scrape_clubs.py` so downstream consumers can reuse the same
logic. It outputs a list of dicts with:

  - name: str
  - short_name: Optional[str]
  - description: Optional[str]
  - summary: Optional[str]
  - instagram: Optional[str]
  - discord: Optional[str]
  - url: str (absolute club URL)

Usage:
  python scrape_wusa_clubs.py            # scrape pages 1..16
  python scrape_wusa_clubs.py 3 8        # scrape pages 3..8

Notes:
  - No authentication is required for public club pages.
  - Selectors are written to be resilient to common Drupal markup,
    but may need updates if WUSA changes their DOM structure.
"""

from __future__ import annotations

import re
import sys
import time
from dataclasses import dataclass, asdict
from typing import Dict, Iterable, List, Optional, Set, Tuple
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup


BASE_URL = "https://clubs.wusa.ca"
LISTING_PATH = "/club_listings"


@dataclass
class Club:
    name: str
    short_name: Optional[str]
    description: Optional[str]
    summary: Optional[str]
    instagram: Optional[str]
    discord: Optional[str]
    url: str

    def to_dict(self) -> Dict[str, Optional[str]]:
        return asdict(self)


def _ua_headers() -> Dict[str, str]:
    return {
        "User-Agent": (
            "Mozilla/5.0 (X11; Linux x86_64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/115.0.0.0 Safari/537.36"
        )
    }


def fetch(url: str, session: requests.Session, timeout: int = 20) -> Optional[str]:
    try:
        r = session.get(url, headers=_ua_headers(), timeout=timeout)
        if r.status_code == 200:
            return r.text
        sys.stderr.write(f"Warning: got HTTP {r.status_code} for {url}\n")
        return None
    except requests.RequestException as e:
        sys.stderr.write(f"Error fetching {url}: {e}\n")
        return None


def parse_listing_for_club_links(html: str) -> List[str]:
    """Return unique relative links like '/clubs/1234' in page order."""
    soup = BeautifulSoup(html, "html.parser")
    links: List[str] = []
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        # Normalize absolute URLs back to relative for dedupe simplicity
        if href.startswith(BASE_URL):
            href = href[len(BASE_URL) :]
        if re.fullmatch(r"/clubs/\d+", href):
            links.append(href)
    seen: Set[str] = set()
    uniq: List[str] = []
    for h in links:
        if h not in seen:
            seen.add(h)
            uniq.append(h)
    return uniq


def _text_or_none(el) -> Optional[str]:
    if not el:
        return None
    return el.get_text(separator=" ", strip=True) or None


def _extract_short_name_from_title(name: Optional[str]) -> Optional[str]:
    """Heuristic: if title contains '(ABC)', treat ABC as short name."""
    if not name:
        return None
    m = re.search(r"\(([^)]+)\)", name)
    if not m:
        return None
    cand = m.group(1).strip()
    # Avoid capturing long phrases; prefer acronym-like strings
    if 2 <= len(cand) <= 12 and re.fullmatch(r"[A-Za-z0-9&.'-]+", cand):
        return cand
    return None


def _extract_summary(description: Optional[str]) -> Optional[str]:
    if not description:
        return None
    # Simple first-sentence or trimmed preview
    first_sentence = re.split(r"(?<=[.!?])\s+", description.strip(), maxsplit=1)[0]
    return first_sentence[:280]


def _first_or_none(values: Iterable[Optional[str]]) -> Optional[str]:
    for v in values:
        if v:
            return v
    return None


def parse_club_detail(html: str) -> Dict[str, Optional[str]]:
    """Extract fields from a WUSA club detail page HTML.

    Strategy:
      - name: first <h1> text.
      - description: prefer common Drupal body fields; fallback to main article text.
      - instagram/discord: any <a> href matching respective domains.
      - summary: short preview of description.
      - short_name: acronym in parentheses in title, if present.
    """
    soup = BeautifulSoup(html, "html.parser")

    # Name: prefer WUSA header, then fallback to <h1>
    name = _text_or_none(soup.select_one("h5.club-name-header")) or _text_or_none(
        soup.find("h1")
    )

    # Description: prioritize the hidden full text container if present
    description: Optional[str] = None
    full_text = soup.select_one("#full-text")
    if full_text:
        description = _text_or_none(full_text)
    else:
        # Fallback to common containers if #full-text is absent
        body_candidates: List[str] = []
        for selector in [
            "div.field--name-body",
            "div.field--name-field-club-description",
            "article .node__content",
            "main .node__content",
            "div.region-content",
            "article",
            "main",
        ]:
            el = soup.select_one(selector)
            if el:
                text = _text_or_none(el)
                if text:
                    body_candidates.append(text)
        description = _first_or_none(body_candidates)

    # Social links: prefer explicit URLs listed in a plain div (no id/class)
    # Example structure: a <div><p>https://instagram...<br>https://discord...<br>...</p></div>
    instagram = None
    discord = None
    summary_urls: List[str] = []

    # Find divs without id/class that contain raw URLs
    url_pattern = re.compile(r"https?://[^\s<>\"]+")
    for div in soup.find_all("div"):
        if div.has_attr("id") or div.has_attr("class"):
            continue
        text = div.get_text(separator="\n", strip=True)
        if "http" not in text:
            continue
        urls = url_pattern.findall(text)
        if not urls:
            continue
        # Assign instagram/discord if present; keep the rest for summary
        remaining: List[str] = []
        for u in urls:
            lu = u.lower()
            if ("instagram.com" in lu) and instagram is None:
                instagram = u
            elif ("discord.gg" in lu or "discord.com" in lu) and discord is None:
                discord = u
            else:
                remaining.append(u)
        summary_urls.extend(remaining)
        # Do not break; there could be multiple such blocks, but this keeps first matches for IG/Discord

    # Also inspect the dashboard icon area for social links (e.g., Instagram, YouTube)
    icon_container = soup.select_one(".dashboard-icon-container")
    if icon_container:
        for a in icon_container.find_all("a", href=True):
            href = a["href"].strip()
            lower = href.lower()
            if "instagram.com" in lower and instagram is None:
                instagram = href
            elif ("discord.gg" in lower or "discord.com" in lower) and discord is None:
                discord = href
            else:
                summary_urls.append(href)

    # Fallback: scan anchors anywhere for instagram/discord if not found yet
    if instagram is None or discord is None:
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            lower = href.lower()
            if instagram is None and "instagram.com" in lower:
                instagram = href
            if discord is None and ("discord.gg" in lower or "discord.com" in lower):
                discord = href

    # Summary/short name
    short_name = _extract_short_name_from_title(name)
    # If we collected extra URLs, dedupe while preserving order; otherwise, use text summary
    if summary_urls:
        seen_sum: Set[str] = set()
        ordered: List[str] = []
        for u in summary_urls:
            if u not in seen_sum:
                seen_sum.add(u)
                ordered.append(u)
        summary = "\n".join(ordered)
    else:
        summary = _extract_summary(description)

    return {
        "name": name,
        "short_name": short_name,
        "description": description,
        "summary": summary,
        "instagram": instagram,
        "discord": discord,
    }


def scrape_wusa(start_page: int = 1, end_page: int = 16, delay_sec: float = 0.6) -> List[Club]:
    """Scrape WUSA club listings from start_page..end_page inclusive."""
    sess = requests.Session()
    clubs: List[Club] = []
    seen_urls: Set[str] = set()

    for page in range(start_page, end_page + 1):
        list_url = f"{BASE_URL}{LISTING_PATH}?page={page}"
        html = fetch(list_url, sess)
        if html is None:
            continue
        rel_links = parse_listing_for_club_links(html)
        for rel in rel_links:
            abs_url = urljoin(BASE_URL, rel)
            if abs_url in seen_urls:
                continue
            seen_urls.add(abs_url)
            detail_html = fetch(abs_url, sess)
            if detail_html is None:
                continue
            data = parse_club_detail(detail_html)
            club = Club(
                name=data.get("name") or "",
                short_name=data.get("short_name"),
                description=data.get("description"),
                summary=data.get("summary"),
                instagram=data.get("instagram"),
                discord=data.get("discord"),
                url=abs_url,
            )
            clubs.append(club)
            # Be polite to the site
            if delay_sec > 0:
                time.sleep(delay_sec)
        # Small delay between listing pages as well
        if delay_sec > 0:
            time.sleep(delay_sec)

    return clubs


def main() -> None:
    # Optional CLI args: start_page [end_page]
    if len(sys.argv) == 1:
        start, end = 1, 16
    elif len(sys.argv) == 2:
        start = int(sys.argv[1])
        end = start
    else:
        start = int(sys.argv[1])
        end = int(sys.argv[2])

    clubs = scrape_wusa(start, end)
    import json

    print(json.dumps([c.to_dict() for c in clubs], indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
