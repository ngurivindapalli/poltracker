import json
import requests
import time
import re

INPUT = "backend/data/senator_family_trees.json"
OUTPUT = "backend/data/senator_family_trees_enriched.json"

def fetch_wiki_content(name):
    """Fetch Wikipedia content - try multiple methods"""
    headers = {
        "User-Agent": "PolTracker/1.0 (https://github.com/your-repo)"
    }
    page_name = name.replace(" ", "_")
    
    # Try to get full page HTML
    try:
        html_url = f"https://en.wikipedia.org/wiki/{page_name}"
        r = requests.get(html_url, headers=headers)
        if r.status_code == 200:
            return r.text
    except:
        pass
    
    # Fallback to summary
    try:
        summary_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{page_name}"
        r = requests.get(summary_url, headers=headers)
        if r.status_code == 200:
            return r.json().get("extract_html", r.json().get("extract", ""))
    except:
        pass
    
    return ""

def extract_spouse(html_content):
    """Extract spouse from Wikipedia HTML - look for infobox or text patterns"""
    if not html_content:
        return None
    
    # Try to extract from infobox (common Wikipedia pattern)
    infobox_match = re.search(r'<th[^>]*>Spouse[^<]*</th>\s*<td[^>]*>([^<]+)</td>', html_content, re.IGNORECASE)
    if infobox_match:
        spouse_text = infobox_match.group(1).strip()
        # Clean HTML entities
        spouse_text = re.sub(r'&[^;]+;', '', spouse_text)
        # Extract name (usually first part before parentheses or <br>)
        name = re.split(r'[<\(]', spouse_text)[0].strip()
        if name and len(name) > 2:
            return name
    
    # Fallback: look for text patterns in the content
    text_content = re.sub(r'<[^>]+>', ' ', html_content)  # Remove HTML tags
    text_lower = text_content.lower()
    
    if "wife" in text_lower or "husband" in text_lower or "married" in text_lower:
        patterns = [
            r"married to ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
            r"wife\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
            r"husband\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
            r"spouse\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)"
        ]
        for pattern in patterns:
            match = re.search(pattern, text_content, re.IGNORECASE)
            if match:
                name = match.group(1).strip()
                if name and len(name) > 2 and name.lower() not in ["the", "a", "an", "his", "her"]:
                    return name
    return None

def extract_children(text):
    import re
    text_lower = text.lower()
    if "children" in text_lower or "child" in text_lower:
        # Look for patterns like "has [number] children: [names]" or "children include [names]"
        patterns = [
            r"children:\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+and\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)*)",
            r"children include\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+and\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)*)",
            r"has\s+\d+\s+children[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:\s+and\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)*)"
        ]
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                names = match.group(1).strip()
                # Split by "and" or comma
                name_list = re.split(r"\s+and\s+|,\s+", names)
                if name_list:
                    # Return first child name for now
                    first_name = name_list[0].strip()
                    if first_name and len(first_name) > 2:
                        return first_name
    return None

with open(INPUT) as f:
    data = json.load(f)

for senator in data:
    name = senator["name"]
    print("Checking:", name)

    family = senator["family"]

    needs_spouse = len(family["spouses"]) == 0
    needs_children = len(family["children"]) == 0

    if not needs_spouse and not needs_children:
        continue

    html_content = fetch_wiki_content(name)
    if not html_content:
        continue

    if needs_spouse:
        spouse_name = extract_spouse(html_content)
        if spouse_name:
            print(f"  Found spouse: {spouse_name}")
            family["spouses"].append({
                "name": spouse_name,
                "office": None,
                "source": "Wikipedia"
            })

    if needs_children:
        child_name = extract_children(html_content)
        if child_name:
            print(f"  Found child: {child_name}")
            family["children"].append({
                "name": child_name,
                "office": None,
                "source": "Wikipedia"
            })

    time.sleep(0.5)

with open(OUTPUT, "w") as f:
    json.dump(data, f, indent=2)

print("Wikipedia enrichment complete")
