"""
Scrape club information from SUUOFC Campus Labs HTML pages.

This script is designed to take an HTML document containing a list of
organizations (clubs) hosted on the SUUOFC campus labs site and extract
meaningful metadata for each club.  Each entry in the index page
contains a link pointing to a detailed club page under the
`/engage/organization/` path.  The detailed page typically exposes
the following fields of interest:

* **Title** – the club name displayed in an `<h1>` tag.
* **Description** – free text contained within a `<div>` using the
  `bodyText-large userSupplied` classes.
* **Email** – the contact email for the club, usually located near a
  `<span>` with the `sr-only` class labelled “Contact Email”.  A
  generic email regex is used as a fallback to locate the first
  available email address.
* **Instagram/Discord/Website** – contact links presented as icons
  beneath the contact information.  Each link includes an
  `aria-label` specifying the service (e.g. “Visit our instagram”).
  Discord links may appear either as one of these icons or embedded
  within the description text.

The script accepts a single command‑line argument pointing to the
index HTML file.  It reads the file, extracts all unique club
relative URLs, retrieves each club page over the network, and
parses the required fields.  Results are printed to stdout as a
list of dictionaries.  See the `main()` function for usage.

Note: Accessing pages on `suuofc.campuslabs.ca` may require
authentication.  When run in an environment without credentials,
requests may be redirected or denied.  The script is still
designed to illustrate the parsing logic for the provided HTML
structure.
"""

import re
import sys
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup


@dataclass
class Club:
    """Represents a single club with extracted metadata."""

    name: str
    short_name: Optional[str]
    description: Optional[str]
    summary: Optional[str]
    instagram: Optional[str]
    discord: Optional[str]
    url: str

    def to_dict(self) -> Dict[str, Optional[str]]:
        """Return the club data as a dictionary."""
        return asdict(self)


def parse_clubs_index(html: str) -> List[str]:
    """Parse the index page and return a list of unique relative club URLs.

    The index HTML contains anchor tags linking to club detail pages.  Only
    `href` attributes beginning with `/engage/organization/` are considered.

    Args:
        html: Raw HTML content of the index page.

    Returns:
        A list of unique relative URLs (strings) for each club.
    """
    soup = BeautifulSoup(html, "html.parser")
    links: List[str] = []
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        if href.startswith("/engage/organization/"):
            links.append(href)
    # Preserve order while removing duplicates
    unique_links: List[str] = []
    seen = set()
    for link in links:
        if link not in seen:
            unique_links.append(link)
            seen.add(link)
    return unique_links


def extract_email(text: str) -> Optional[str]:
    """Extract the first email address from the given text.

    A simple regex is used to locate an email pattern.  Returns
    `None` if no email is found.

    Args:
        text: Arbitrary text potentially containing an email.

    Returns:
        The first matched email address, or `None` if absent.
    """
    # Basic email pattern: user@domain.tld
    pattern = r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"  # allow longer TLDs
    match = re.search(pattern, text)
    return match.group(0) if match else None


def _extract_initial_app_state_json(html: str) -> Optional[Dict]:
    """Extract and parse the window.initialAppState JSON from a script tag.

    This handles client-side rendered pages by reading the bootstrapped state
    embedded as `window.initialAppState = {...};`.
    """
    soup = BeautifulSoup(html, "html.parser")
    for script in soup.find_all("script"):
        content = script.string or script.get_text() or ""
        if "window.initialAppState" not in content:
            continue
        try:
            # Find the JSON object by matching balanced braces after the '='
            eq_idx = content.find("=")
            if eq_idx == -1:
                continue
            after_eq = content[eq_idx + 1 :]
            # Locate first opening brace
            try:
                start = after_eq.index("{")
            except ValueError:
                continue
            brace_count = 0
            end_idx = None
            for i, ch in enumerate(after_eq[start:]):
                if ch == "{":
                    brace_count += 1
                elif ch == "}":
                    brace_count -= 1
                    if brace_count == 0:
                        end_idx = start + i + 1
                        break
            if end_idx is None:
                continue
            json_blob = after_eq[start:end_idx]
            import json

            return json.loads(json_blob)
        except Exception:
            # Fall through to try other script tags
            continue
    return None


def _clean_html_to_text(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    # Convert HTML to plain text while preserving basic spacing
    return BeautifulSoup(value, "html.parser").get_text(separator=" ", strip=True)


def parse_club_page(html: str) -> Dict[str, Optional[str]]:
    """Parse an individual club page and extract relevant fields.

    Prefer extracting from `window.initialAppState` JSON if present; otherwise
    fall back to best-effort HTML parsing.
    """
    # 1) Try client-side state JSON first
    state = _extract_initial_app_state_json(html)
    if state:
        org = (
            state.get("preFetchedData", {})
            .get("organization")
            or {}
        )
        social = org.get("socialMedia", {}) or {}
        name = org.get("name")
        short_name = org.get("shortName")
        description_text = _clean_html_to_text(org.get("description"))
        summary = org.get("summary")
        instagram = social.get("instagramUrl")
        # Some deployments may not have a dedicated discord field; check common keys
        discord = (
            social.get("discordUrl")
            or social.get("discord")
        )
        # Fallback: search for discord link in description HTML
        if not discord and org.get("description"):
            disc_match = re.search(
                r"https?://(?:www\.)?(?:discord\.gg|discord\.com)/\S+",
                org.get("description") or "",
            )
            if disc_match:
                discord = disc_match.group(0)
        return {
            "name": name,
            "short_name": short_name,
            "description": description_text,
            "summary": summary,
            "instagram": instagram,
            "discord": discord,
        }

    # 2) Fallback to server-rendered HTML parsing (older logic)
    soup = BeautifulSoup(html, "html.parser")

    # Title: prefer the first <h1>, fall back to the first image alt
    name = None
    h1 = soup.find("h1")
    if h1 and h1.get_text(strip=True):
        name = h1.get_text(separator=" ", strip=True)
    else:
        img = soup.find("img", alt=True)
        if img:
            name = (img.get("alt", "") or "").strip() or None

    # Description: contained in <div class="bodyText-large userSupplied">
    description = None
    desc_div = soup.find("div", class_="bodyText-large userSupplied")
    if desc_div:
        description = desc_div.get_text(separator=" ", strip=True)

    # Contact links from icons (Instagram, Discord)
    instagram = None
    discord = None

    for a in soup.find_all("a", href=True):
        aria = a.get("aria-label")
        if not aria:
            continue
        href = a["href"].strip()
        lower_aria = aria.lower()
        if "instagram" in lower_aria:
            instagram = href
        elif "discord" in lower_aria:
            discord = href

    # Check for Discord link embedded in the description text if not already found
    if not discord and description:
        disc_match = re.search(
            r"https?://(?:www\.)?(?:discord\.gg|discord\.com)/\S+",
            description,
        )
        if disc_match:
            discord = disc_match.group(0)

    return {
        "name": name,
        "short_name": None,
        "description": description,
        "summary": None,
        "instagram": instagram,
        "discord": discord,
    }


def fetch_club_page(url: str, session: requests.Session, timeout: int = 15) -> Optional[str]:
    """Retrieve the HTML of a club detail page.

    Uses a provided requests session to persist headers and cookies.  A
    User‑Agent is set to mimic a web browser.  Returns `None` on
    network errors or non‑200 status codes.

    Args:
        url: Absolute URL of the club page.
        session: A requests.Session object for connection reuse.
        timeout: Timeout in seconds for the HTTP request.

    Returns:
        The raw HTML text if the request is successful, otherwise
        `None`.
    """
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (X11; Linux x86_64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/115.0.0.0 Safari/537.36"
        )
    }
    try:
        response = session.get(url, headers=headers, timeout=timeout)
        if response.status_code == 200:
            return response.text
        else:
            sys.stderr.write(f"Warning: received status {response.status_code} for {url}\n")
            return None
    except requests.RequestException as e:
        sys.stderr.write(f"Error fetching {url}: {e}\n")
        return None


def scrape_clubs(index_html_path: str, base_url: str = "https://suuofc.campuslabs.ca") -> List[Club]:
    """Scrape all clubs listed in the provided index HTML file.

    Args:
        index_html_path: Path to the local HTML file containing the list of clubs.
        base_url: Base URL used to resolve relative club links (defaults to
            `https://suuofc.campuslabs.ca`).

    Returns:
        A list of Club objects with populated fields from each club page.
    """
    with open(index_html_path, "r", encoding="utf-8") as f:
        index_html = f.read()

    relative_links = parse_clubs_index(index_html)
    session = requests.Session()
    clubs: List[Club] = []
    for rel in relative_links:
        absolute_url = urljoin(base_url, rel)
        html = fetch_club_page(absolute_url, session)
        if html is None:
            continue
        parsed = parse_club_page(html)
        club = Club(
            name=parsed.get("name") or "",
            short_name=parsed.get("short_name"),
            description=parsed.get("description"),
            summary=parsed.get("summary"),
            instagram=parsed.get("instagram"),
            discord=parsed.get("discord"),
            url=absolute_url,
        )
        clubs.append(club)
    return clubs


def main() -> None:
    if len(sys.argv) < 2:
        sys.stderr.write("Usage: python scrape_clubs.py <index_html_file>\n")
        sys.exit(1)
    index_path = sys.argv[1]
    clubs = scrape_clubs(index_path)
    # Print results in a simple JSON‑like form
    import json
    print(json.dumps([club.to_dict() for club in clubs], indent=2))


if __name__ == "__main__":
    main()
