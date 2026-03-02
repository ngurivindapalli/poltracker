import json
import re
import time
from typing import List, Optional, Dict, Any

import requests

INPUT = "backend/data/senator_family_trees.json"
OUTPUT = "backend/data/senator_family_trees_enriched.json"

API = "https://en.wikipedia.org/w/api.php"

HEADERS = {
    "User-Agent": "PolTracker/1.0 (family-enrichment; contact: example@example.com)"
}

# --- Helpers -------------------------------------------------

def fetch_wikitext(title: str) -> Optional[str]:
    """
    Fetch page wikitext using MediaWiki API.
    Returns wikitext string or None.
    """
    params = {
        "action": "query",
        "format": "json",
        "formatversion": 2,
        "prop": "revisions",
        "rvprop": "content",
        "rvslots": "main",
        "redirects": 1,
        "titles": title,
    }
    try:
        r = requests.get(API, params=params, headers=HEADERS, timeout=15)
        if r.status_code != 200:
            return None
        data = r.json()
        pages = data.get("query", {}).get("pages", [])
        if not pages:
            return None
        page = pages[0]
        if page.get("missing"):
            return None
        revs = page.get("revisions", [])
        if not revs:
            return None
        slots = revs[0].get("slots", {})
        main = slots.get("main", {})
        return main.get("content")
    except Exception:
        return None


def extract_infobox(wikitext: str) -> Optional[str]:
    """
    Extract the first Infobox template block: {{Infobox ... }}
    This is a heuristic, but works for most politician pages.
    """
    # Find start of an infobox
    start = wikitext.find("{{Infobox")
    if start == -1:
        start = wikitext.find("{{Infobox ")
    if start == -1:
        return None

    # Parse balanced braces from the start
    i = start
    depth = 0
    while i < len(wikitext) - 1:
        if wikitext[i:i+2] == "{{":
            depth += 1
            i += 2
            continue
        if wikitext[i:i+2] == "}}":
            depth -= 1
            i += 2
            if depth == 0:
                return wikitext[start:i]
            continue
        i += 1

    return None


def clean_value(v: str) -> str:
    """
    Clean common wiki markup into readable text.
    """
    v = v.strip()

    # remove refs
    v = re.sub(r"<ref[^>]*>.*?</ref>", "", v, flags=re.DOTALL)
    v = re.sub(r"<ref[^/>]*/\s*>", "", v)

    # replace links [[A|B]] -> B, [[A]] -> A
    v = re.sub(r"\[\[([^|\]]+)\|([^\]]+)\]\]", r"\2", v)
    v = re.sub(r"\[\[([^\]]+)\]\]", r"\1", v)

    # remove templates like {{marriage|...}} -> keep inner text best-effort
    v = re.sub(r"\{\{marriage\|([^}]*)\}\}", r"\1", v, flags=re.IGNORECASE)
    v = re.sub(r"\{\{([^}]*)\}\}", "", v)  # other templates

    # remove HTML comments
    v = re.sub(r"<!--.*?-->", "", v, flags=re.DOTALL)

    # remove formatting quotes
    v = v.replace("'''", "").replace("''", "")

    # collapse whitespace
    v = re.sub(r"\s+", " ", v).strip()

    # drop trailing punctuation artifacts
    v = v.strip(" ,;")

    return v


def parse_infobox_field(infobox: str, field_name: str) -> Optional[str]:
    """
    Extract a line like: | spouse = ...
    Handles multiline values until next '| key =' line.
    """
    # Match: | field_name = value (possibly multiline)
    pattern = re.compile(
        rf"^\|\s*{re.escape(field_name)}\s*=\s*(.*?)(?=^\|\s*[\w\-]+\s*=|\Z)",
        re.IGNORECASE | re.MULTILINE | re.DOTALL
    )
    m = pattern.search(infobox)
    if not m:
        return None
    value = m.group(1).strip()
    return value if value else None


def split_people(value: str) -> List[str]:
    """
    Split spouse/children values into list of names.
    Tries: bullet lists, <br>, commas, 'and'.
    """
    v = value

    # common separators
    v = v.replace("<br />", "\n").replace("<br/>", "\n").replace("<br>", "\n")
    v = v.replace("•", "\n")

    # remove parenthetical years etc but keep names
    # example: "Katherine Van Hollen (m. 1987)" -> "Katherine Van Hollen"
    v = re.sub(r"\(.*?\)", "", v)

    # split lines first
    parts = [p.strip() for p in re.split(r"[\n;]+", v) if p.strip()]
    if len(parts) > 1:
        return [clean_value(p) for p in parts if clean_value(p)]

    # fallback: commas / ' and '
    parts = [p.strip() for p in re.split(r",|\sand\s", v) if p.strip()]
    return [clean_value(p) for p in parts if clean_value(p)]


def enrich_person(sen: Dict[str, Any], spouse_names: List[str], child_names: List[str]) -> None:
    fam = sen.get("family", {})
    if not fam:
        return

    if (not fam.get("spouses")) and spouse_names:
        fam["spouses"] = [{"name": n, "office": None, "source": "Wikipedia"} for n in spouse_names]

    if (not fam.get("children")) and child_names:
        fam["children"] = [{"name": n, "office": None, "source": "Wikipedia"} for n in child_names]


# --- Main ----------------------------------------------------

with open(INPUT, "r", encoding="utf-8") as f:
    senators = json.load(f)

updated = 0
checked = 0

for sen in senators:
    checked += 1
    name = sen.get("name")
    fam = sen.get("family", {})
    if not name or not fam:
        continue

    needs_spouse = len(fam.get("spouses", [])) == 0
    needs_children = len(fam.get("children", [])) == 0

    if not (needs_spouse or needs_children):
        continue

    wikitext = fetch_wikitext(name)
    if not wikitext:
        # try with suffix "(politician)" if needed
        wikitext = fetch_wikitext(f"{name} (politician)")
    if not wikitext:
        continue

    infobox = extract_infobox(wikitext)
    if not infobox:
        continue

    spouse_names: List[str] = []
    child_names: List[str] = []

    if needs_spouse:
        raw_spouse = parse_infobox_field(infobox, "spouse")
        if raw_spouse:
            spouse_names = split_people(raw_spouse)

    if needs_children:
        raw_children = parse_infobox_field(infobox, "children")
        if raw_children:
            child_names = split_people(raw_children)

    before_spouse = len(fam.get("spouses", []))
    before_children = len(fam.get("children", []))

    enrich_person(sen, spouse_names, child_names)

    after_spouse = len(fam.get("spouses", []))
    after_children = len(fam.get("children", []))

    if (after_spouse > before_spouse) or (after_children > before_children):
        updated += 1
        print(f"Enriched: {name} (spouse +{after_spouse-before_spouse}, children +{after_children-before_children})")

    # be polite to Wikipedia
    time.sleep(0.35)

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(senators, f, indent=2, ensure_ascii=False)

print(f"Done. Checked {checked}. Updated {updated}. Output: {OUTPUT}")
