#!/usr/bin/env python3
import os, sys, json, html
from pathlib import Path
from typing import List, Dict

from supabase import create_client, Client
from openai import OpenAI

EMBED_MODEL = "text-embedding-3-small"
EMBED_DIMS  = 1536
BATCH_SIZE  = 100

def squash(s: str | None) -> str:
    if not s:
        return ""
    return " ".join(html.unescape(s).split())

def build_embed_text(rec: Dict) -> str:
    parts = [
        f"Name: {squash(rec.get('name'))}",
        f"ShortName: {squash(rec.get('short_name'))}",
        f"Description: {squash(rec.get('description'))}",
        f"Summary: {squash(rec.get('summary'))}",
    ]
    # Socials/URL as weak signals (included; low harm, sometimes helpful)
    if rec.get("instagram"): parts.append(f"Instagram: {squash(rec.get('instagram'))}")
    if rec.get("discord"):   parts.append(f"Discord: {squash(rec.get('discord'))}")
    if rec.get("url"):       parts.append(f"URL: {squash(rec.get('url'))}")
    return "\n".join(p for p in parts if p.split(": ",1)[1])

def embed_batch(ai: OpenAI, texts: List[str]) -> List[List[float]]:
    resp = ai.embeddings.create(model=EMBED_MODEL, input=texts)
    vecs = [d.embedding for d in resp.data]
    # sanity check
    for v in vecs:
        if len(v) != EMBED_DIMS:
            raise RuntimeError(f"Embedding dim mismatch: {len(v)} != {EMBED_DIMS}")
    return vecs

def upsert_batch(sb: Client, rows: List[Dict]):
    # Upsert on URL to avoid duplicates
    sb.table("uw_clubs").upsert(rows, on_conflict="url").execute()

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 ingest_clubs.py clubs.json", file=sys.stderr)
        sys.exit(1)

    data = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    if isinstance(data, dict) and "results" in data:
        data = data["results"]
    if not isinstance(data, list):
        raise SystemExit("Top-level JSON must be an array of club objects.")

    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_ANON_KEY"])
    ai = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    payloads: List[Dict] = []
    texts: List[str] = []
    for rec in data:
        url = rec.get("url")
        if not url:
            # Skip rows without a canonical URL (required by schema)
            continue
        payloads.append({
            "name":        rec.get("name"),
            "short_name":  rec.get("short_name"),
            "description": rec.get("description"),
            "summary":     rec.get("summary"),
            "instagram":   rec.get("instagram"),
            "discord":     rec.get("discord"),
            "url":         url,
        })
        texts.append(build_embed_text(rec))

    # Batch embedding + upsert
    for i in range(0, len(payloads), BATCH_SIZE):
        batch_payloads = payloads[i:i+BATCH_SIZE]
        batch_texts    = texts[i:i+BATCH_SIZE]
        vecs = embed_batch(ai, batch_texts)
        for j, v in enumerate(vecs):
            batch_payloads[j]["embedding"] = v
        upsert_batch(sb, batch_payloads)

    print(f"Ingested {len(payloads)} rows.")

if __name__ == "__main__":
    main()
