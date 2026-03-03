import json

INPUT = "senateTrades.json"
OUTPUT = "senateTrades_fixed.json"

with open(INPUT, "r", encoding="utf-8") as f:
    data = json.load(f)

fixed = []

for t in data:

    fixed.append({

        "senator": t.get("senator"),
        "office": t.get("office"),
        "reportTitle": t.get("reportTitle"),
        "reportDate": t.get("reportDate"),
        "reportUrl": t.get("reportUrl"),

        # Corrected fields
        "transactionDate": t.get("asset"),
        "owner": t.get("transactionDate"),

        "asset": t.get("type"),
        "assetType": t.get("amount"),

        # Unknown columns preserved
        "rawOwner": t.get("owner"),

    })

with open(OUTPUT, "w", encoding="utf-8") as f:
    json.dump(fixed, f, indent=2)

print("Saved", OUTPUT)
