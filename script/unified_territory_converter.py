#!/usr/bin/env python3
"""
Unified Territory Map Converter
Converts Israel (GPKG) and Palestine (GDB) boundaries to unified GeoJSON
with country/territory identifiers and proper coordinate reference system handling.
"""

import geopandas as gpd
import pandas as pd
import json
import os
from pathlib import Path

# Set up paths
PROJECT_ROOT = Path(__file__).parent.parent
GEOMAP_DIR = PROJECT_ROOT / 'src' / 'GazaMap' / 'GeoMap'
OUTPUT_DIR = PROJECT_ROOT / 'src' / 'GazaMap'

# Input files
ISRAEL_GPKG = GEOMAP_DIR / 'Israel.gpkg'
PALESTINE_GDB = GEOMAP_DIR / 'Palestine.gdb'

# Output files
OUTPUT_UNIFIED_GEOJSON = OUTPUT_DIR / 'unified_territories.geojson'
OUTPUT_DEBUG_INFO = OUTPUT_DIR / 'territory_converter_debug.txt'


def read_israel_data():
    """Read Israel boundaries from GPKG file."""
    print("=" * 60)
    print("Reading Israel boundaries from GPKG...")
    print("=" * 60)
    
    try:
        gdf = gpd.read_file(ISRAEL_GPKG)
        print(f"✓ Successfully read Israel GPKG file")
        print(f"  - Number of features: {len(gdf)}")
        print(f"  - Columns: {gdf.columns.tolist()}")
        print(f"  - CRS: {gdf.crs}")
        print(f"  - Geometry types: {gdf.geometry.type.unique().tolist()}")
        
        return gdf
    except Exception as e:
        print(f"✗ Error reading Israel GPKG: {e}")
        raise


def read_palestine_data():
    """Read Palestine boundaries from GDB file."""
    print("\n" + "=" * 60)
    print("Reading Palestine boundaries from GDB...")
    print("=" * 60)
    
    try:
        # Read all layers from the GDB and explore them
        layers = gpd.read_file(PALESTINE_GDB, layer=None)
        print(f"✓ Available layers in GDB: {layers}")
        
        # Try to read the main layer (usually the first or a specific one)
        # GDB files typically contain a main geometry layer
        gdf = gpd.read_file(PALESTINE_GDB)
        print(f"✓ Successfully read Palestine GDB file")
        print(f"  - Number of features: {len(gdf)}")
        print(f"  - Columns: {gdf.columns.tolist()}")
        print(f"  - CRS: {gdf.crs}")
        print(f"  - Geometry types: {gdf.geometry.type.unique().tolist()}")
        
        return gdf
    except Exception as e:
        print(f"✗ Error reading Palestine GDB: {e}")
        raise


def standardize_geom_columns(gdf, country_name):
    """
    Standardize and select relevant columns.
    Keep only essential columns for mapping.
    """
    # Create new GeoDataFrame with standardized columns
    essential_cols = {'geometry'}
    
    # Add relevant attribute columns if they exist
    for col in gdf.columns:
        if col != 'geometry' and gdf[col].dtype != 'object':
            essential_cols.add(col)
    
    # Keep geometry and string/numeric columns
    keep_cols = [col for col in gdf.columns if col in essential_cols or gdf[col].dtype in ['object', 'float64', 'int64']]
    keep_cols = [col for col in keep_cols if col in gdf.columns]
    
    if 'geometry' not in keep_cols:
        keep_cols.append('geometry')
    
    gdf_std = gdf[keep_cols].copy()
    
    # Add country identifier
    gdf_std['country'] = country_name
    gdf_std['territory'] = country_name
    
    return gdf_std


def convert_to_wgs84(gdf, name):
    """Convert GeoDataFrame to WGS84 (EPSG:4326)."""
    if gdf.crs is None:
        print(f"\n⚠ Warning: {name} has no CRS defined, assuming WGS84")
        gdf = gdf.set_crs('EPSG:4326')
    elif gdf.crs.to_epsg() != 4326:
        print(f"\nConverting {name} from {gdf.crs} to WGS84 (EPSG:4326)")
        gdf = gdf.to_crs(epsg=4326)
    else:
        print(f"\n{name} already in WGS84")
    
    return gdf


def merge_geospatial_data(israel_gdf, palestine_gdf):
    """
    Merge Israel and Palestine GeoDataFrames.
    Ensure both are in WGS84 and have compatible schemas.
    """
    print("\n" + "=" * 60)
    print("Merging geospatial data...")
    print("=" * 60)
    
    # Standardize columns
    israel_gdf = standardize_geom_columns(israel_gdf, "Israel")
    palestine_gdf = standardize_geom_columns(palestine_gdf, "Palestine")
    
    # Print column info
    print(f"\nIsrael columns after standardization: {israel_gdf.columns.tolist()}")
    print(f"Palestine columns after standardization: {palestine_gdf.columns.tolist()}")
    
    # Concatenate
    merged = gpd.GeoDataFrame(
        pd.concat([israel_gdf, palestine_gdf], ignore_index=True),
        crs=israel_gdf.crs
    )
    
    print(f"\n✓ Merged data:")
    print(f"  - Total features: {len(merged)}")
    print(f"  - Countries: {merged['country'].unique().tolist()}")
    
    return merged


def create_geojson_with_properties(gdf):
    """
    Convert GeoDataFrame to GeoJSON with enhanced properties.
    """
    print("\nCreating GeoJSON...")
    
    from shapely.geometry import mapping
    
    features = []
    for idx, row in gdf.iterrows():
        feature = {
            "type": "Feature",
            "id": idx,
            "properties": {
                "country": row['country'],
                "territory": row['territory'],
            },
            "geometry": mapping(row.geometry)
        }
        
        # Add other relevant properties
        for col in row.index:
            if col not in ['geometry', 'country', 'territory']:
                value = row[col]
                # Handle non-serializable types
                if value is not None and not pd.isna(value):
                    try:
                        json.dumps(value)
                        feature['properties'][col] = value
                    except (TypeError, ValueError):
                        feature['properties'][col] = str(value)
        
        features.append(feature)
    
    geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    
    return geojson


def calculate_bounds(geojson):
    """Calculate bounding box for the entire map."""
    min_lon, min_lat = float('inf'), float('inf')
    max_lon, max_lat = float('-inf'), float('-inf')
    
    for feature in geojson['features']:
        if feature['geometry']['type'] == 'Polygon':
            for ring in feature['geometry']['coordinates']:
                for coord in ring:
                    lon, lat = coord[0], coord[1]
                    min_lon = min(min_lon, lon)
                    min_lat = min(min_lat, lat)
                    max_lon = max(max_lon, lon)
                    max_lat = max(max_lat, lat)
        elif feature['geometry']['type'] == 'MultiPolygon':
            for polygon in feature['geometry']['coordinates']:
                for ring in polygon:
                    for coord in ring:
                        lon, lat = coord[0], coord[1]
                        min_lon = min(min_lon, lon)
                        min_lat = min(min_lat, lat)
                        max_lon = max(max_lon, lon)
                        max_lat = max(max_lat, lat)
    
    return {
        "type": "bounds",
        "coordinates": [min_lon, min_lat, max_lon, max_lat],
        "center": [(min_lon + max_lon) / 2, (min_lat + max_lat) / 2]
    }


def save_geojson(geojson, output_path):
    """Save GeoJSON to file."""
    print(f"\nSaving GeoJSON to: {output_path}")
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(geojson, f, indent=2, ensure_ascii=False)
    
    print(f"✓ GeoJSON saved successfully")
    print(f"  - Total features: {len(geojson['features'])}")
    print(f"  - File size: {os.path.getsize(output_path) / 1024:.2f} KB")


def save_debug_info(israel_gdf, palestine_gdf, bounds, output_path):
    """Save debug information about the conversion."""
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write("TERRITORY CONVERTER DEBUG INFO\n")
        f.write("=" * 60 + "\n\n")
        
        f.write("ISRAEL DATA\n")
        f.write("-" * 60 + "\n")
        f.write(f"Features: {len(israel_gdf)}\n")
        f.write(f"CRS: {israel_gdf.crs}\n")
        f.write(f"Geometry types: {israel_gdf.geometry.type.unique().tolist()}\n")
        f.write(f"Columns: {israel_gdf.columns.tolist()}\n")
        f.write(f"Info:\n{israel_gdf.info()}\n\n")
        
        f.write("PALESTINE DATA\n")
        f.write("-" * 60 + "\n")
        f.write(f"Features: {len(palestine_gdf)}\n")
        f.write(f"CRS: {palestine_gdf.crs}\n")
        f.write(f"Geometry types: {palestine_gdf.geometry.type.unique().tolist()}\n")
        f.write(f"Columns: {palestine_gdf.columns.tolist()}\n")
        f.write(f"Info:\n{palestine_gdf.info()}\n\n")
        
        f.write("BOUNDS\n")
        f.write("-" * 60 + "\n")
        f.write(f"Min/Max Lon: {bounds['coordinates'][0]}, {bounds['coordinates'][2]}\n")
        f.write(f"Min/Max Lat: {bounds['coordinates'][1]}, {bounds['coordinates'][3]}\n")
        f.write(f"Center: {bounds['center']}\n")
    
    print(f"\n✓ Debug info saved to: {output_path}")


def main():
    """Main conversion process."""
    print("\n")
    print("╔" + "═" * 58 + "╗")
    print("║  UNIFIED TERRITORY MAP CONVERTER - ISRAEL & PALESTINE     ║")
    print("╚" + "═" * 58 + "╝")
    
    try:
        # Import pandas here to avoid issues if not used above
        import pandas as pd
        
        # Check if input files exist
        if not ISRAEL_GPKG.exists():
            raise FileNotFoundError(f"Israel GPKG file not found: {ISRAEL_GPKG}")
        if not PALESTINE_GDB.exists():
            raise FileNotFoundError(f"Palestine GDB file not found: {PALESTINE_GDB}")
        
        # Read data
        israel_gdf = read_israel_data()
        palestine_gdf = read_palestine_data()
        
        # Convert to WGS84
        israel_gdf = convert_to_wgs84(israel_gdf, "Israel")
        palestine_gdf = convert_to_wgs84(palestine_gdf, "Palestine")
        
        # Merge
        merged_gdf = merge_geospatial_data(israel_gdf, palestine_gdf)
        
        # Create GeoJSON
        geojson = create_geojson_with_properties(merged_gdf)
        
        # Calculate bounds
        bounds = calculate_bounds(geojson)
        
        # Save GeoJSON
        save_geojson(geojson, OUTPUT_UNIFIED_GEOJSON)
        
        # Save debug info
        save_debug_info(israel_gdf, palestine_gdf, bounds, OUTPUT_DEBUG_INFO)
        
        # Print summary
        print("\n" + "=" * 60)
        print("CONVERSION COMPLETED SUCCESSFULLY")
        print("=" * 60)
        print(f"\nOutput files created:")
        print(f"  ✓ {OUTPUT_UNIFIED_GEOJSON}")
        print(f"  ✓ {OUTPUT_DEBUG_INFO}")
        print(f"\nMap bounds:")
        print(f"  Longitude: {bounds['coordinates'][0]:.4f} to {bounds['coordinates'][2]:.4f}")
        print(f"  Latitude: {bounds['coordinates'][1]:.4f} to {bounds['coordinates'][3]:.4f}")
        print(f"  Center: {bounds['center']}")
        print(f"\nReady to integrate into your visualization!")
        
    except Exception as e:
        print(f"\n✗ CONVERSION FAILED: {e}")
        import traceback
        traceback.print_exc()
        raise


if __name__ == "__main__":
    main()
