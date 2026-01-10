import json

input_path = "src/GazaMap/Damage_Sites_GazaStrip_20251011.geojson"  # or your full file path

with open(input_path, "r", encoding="utf-8") as f:
    gj = json.load(f)

for i, feat in enumerate(gj.get("features", [])):
    print(f"Feature {i} property keys:", list(feat.get("properties", {}).keys()))
    if i >= 1:  # print first 10 features only
        break