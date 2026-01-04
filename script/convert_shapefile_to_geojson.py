import geopandas as gpd
import json
import os

# Paths
shapefile_folder = os.path.join(os.path.dirname(__file__), '..', 'src', 'GazaMap', 'gazastrip_municipalboundaries')
shapefile_path = os.path.join(shapefile_folder, 'GazaStrip_MunicipalBoundaries.shp')
output_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'GazaMap', 'GazaStrip_MunicipalBoundaries_new.json')

print(f"Reading shapefile from: {shapefile_path}")

# Read the shapefile
gdf = gpd.read_file(shapefile_path)

print(f"Found {len(gdf)} features")
print(f"Columns: {gdf.columns.tolist()}")
print(f"CRS: {gdf.crs}")
print(f"\nFirst feature properties:")
print(gdf.iloc[0])

# Convert to WGS84 (EPSG:4326) if not already
if gdf.crs and gdf.crs.to_epsg() != 4326:
    print(f"\nConverting from {gdf.crs} to WGS84 (EPSG:4326)")
    gdf = gdf.to_crs(epsg=4326)
else:
    print("\nAlready in WGS84")

# Convert to GeoJSON
geojson = json.loads(gdf.to_json())

# Save to file
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(geojson, f, indent=2, ensure_ascii=False)

print(f"\n✓ GeoJSON saved to: {output_path}")
print(f"✓ Total features: {len(geojson['features'])}")
print(f"✓ Feature type: {geojson['features'][0]['geometry']['type']}")

# Print bounds
lons = []
lats = []
for feature in geojson['features']:
    if feature['geometry']['type'] == 'Polygon':
        for ring in feature['geometry']['coordinates']:
            for coord in ring:
                lons.append(coord[0])
                lats.append(coord[1])
    elif feature['geometry']['type'] == 'MultiPolygon':
        for polygon in feature['geometry']['coordinates']:
            for ring in polygon:
                for coord in ring:
                    lons.append(coord[0])
                    lats.append(coord[1])

print(f"\n✓ Bounds: ")
print(f"  Longitude: {min(lons):.6f} to {max(lons):.6f}")
print(f"  Latitude: {min(lats):.6f} to {max(lats):.6f}")
