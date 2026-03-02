import json
from collections import defaultdict

INPUT = "backend/data/wikidata_family.json"
OUTPUT = "backend/data/senator_family_trees.json"

with open(INPUT) as f:
    raw = json.load(f)


senators = defaultdict(lambda: {

    "name": "",

    "image": None,

    "wikipedia": None,

    "family": {

        "spouses": [],
        "children": [],
        "parents": [],
        "siblings": []

    },

    "government_connections": False

})

# Handle both SPARQL format and flat array format
if isinstance(raw, dict) and "results" in raw and "bindings" in raw["results"]:
    rows = raw["results"]["bindings"]
    def get_value(row, key):
        if key in row:
            if isinstance(row[key], dict) and "value" in row[key]:
                return row[key]["value"]
            return row[key]
        return None
else:
    # Flat array format
    rows = raw if isinstance(raw, list) else []
    def get_value(row, key):
        return row.get(key) if key in row else None


for row in rows:

    name = get_value(row, "senatorLabel")
    if not name:
        continue

    senators[name]["name"] = name


    image = get_value(row, "senatorImage")
    if image:
        senators[name]["image"] = image


    wikipedia = get_value(row, "senatorArticle")
    if wikipedia:
        senators[name]["wikipedia"] = wikipedia


    def add(field, target):
        value = get_value(row, field)
        if value:
            # Get corresponding office field (e.g., spouseLabel -> spouseOfficeLabel)
            office_field = field.replace("Label", "OfficeLabel")
            office = get_value(row, office_field)
            
            person_data = {
                "name": value
            }
            if office:
                person_data["office"] = office
            
            senators[name]["family"][target].append(person_data)


    add("spouseLabel", "spouses")
    add("childLabel", "children")
    add("fatherLabel", "parents")
    add("motherLabel", "parents")
    add("siblingLabel", "siblings")


    govFields = [

        "spouseOfficeLabel",
        "childOfficeLabel",
        "fatherOfficeLabel",
        "motherOfficeLabel",
        "siblingOfficeLabel"

    ]

    for f in govFields:
        if get_value(row, f):
            senators[name]["government_connections"] = True



for s in senators:

    for group in senators[s]["family"]:

        unique = {}

        for p in senators[s]["family"][group]:

            unique[p["name"]] = p

        senators[s]["family"][group]=list(unique.values())



with open(OUTPUT,"w") as f:

    json.dump(list(senators.values()),f,indent=2)



print("Family trees built:",len(senators))
