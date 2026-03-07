import requests
import pandas as pd
import yaml

CURRENT_URL = "https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-current.yaml"
SOCIAL_URL = "https://raw.githubusercontent.com/unitedstates/congress-legislators/main/legislators-social-media.yaml"

print("Downloading legislator data...")
members = yaml.safe_load(requests.get(CURRENT_URL).text)
socials = yaml.safe_load(requests.get(SOCIAL_URL).text)

# Create lookup table for social accounts
social_lookup = {}

for s in socials:
    bioguide = s["id"]["bioguide"]
    social_lookup[bioguide] = s.get("social", {})

rows = []

for m in members:

    name = f"{m['name']['first']} {m['name']['last']}"
    bioguide = m["id"]["bioguide"]

    term = m["terms"][-1]

    state = term["state"]
    district = term.get("district", "")
    role = "Senator" if term["type"] == "sen" else "Representative"
    party = term["party"]

    social = social_lookup.get(bioguide, {})

    rows.append({
        "name": name,
        "bioguide_id": bioguide,
        "state": state,
        "district": district,
        "party": party,
        "role": role,
        "twitter": social.get("twitter", ""),
        "facebook": social.get("facebook", ""),
        "youtube": social.get("youtube", ""),
        "instagram": social.get("instagram", ""),
        "website": term.get("url", "")
    })

df = pd.DataFrame(rows)

df.to_csv("poltracker_congress_dataset.csv", index=False)
df.to_json("poltracker_congress_dataset.json", orient="records", indent=2)

print("Dataset created")
print("Total members:", len(df))
