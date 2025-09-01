#!/usr/bin/env python3
import sys, json, html
from pathlib import Path

def md_escape(s: str) -> str:
    # Basic unescape → strip extra whitespace
    return " ".join(html.unescape(s or "").split())

def bullet(label: str, value: str):
    if not value:
        return None
    return f"- **{label}:** {value}"

def club_to_md(item: dict) -> str:
    title = md_escape(item.get("title") or item.get("name") or "Untitled")
    desc  = md_escape(item.get("description") or "")

    lines = [f"# {title}", ""]
    if desc:
        lines.append(desc)

    return "\n".join(lines)

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 json_to_markdown.py <clubs.json> [out.md]", file=sys.stderr)
        sys.exit(1)

    in_path = Path(sys.argv[1])
    data = json.loads(in_path.read_text(encoding="utf-8"))

    if isinstance(data, dict) and "results" in data:
        data = data["results"]
    if not isinstance(data, list):
        print("Error: top-level JSON must be an array of club objects", file=sys.stderr)
        sys.exit(2)

    md_sections = []
    for obj in data:
        if not isinstance(obj, dict):
            continue
        md_sections.append(club_to_md(obj))

    md = "\n\n---\n\n".join(md_sections).rstrip() + "\n"

    # Optional second arg writes to file, otherwise print to stdout
    if len(sys.argv) >= 3:
        Path(sys.argv[2]).write_text(md, encoding="utf-8")
    else:
        sys.stdout.write(md)

if __name__ == "__main__":
    main()
