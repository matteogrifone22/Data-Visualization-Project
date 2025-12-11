#!/usr/bin/env python3
"""
Extract GeoJSON data from Kontur Israel topology boundaries GeoPackage.
Downloads the file, converts to GeoJSON, and extracts specific regions.
"""

import os
import gzip
import shutil
import urllib.request
import geopandas as gpd
from pathlib import Path

# Configuration
DOWNLOAD_URL = "https://geodata-eu-central-1-kontur-public.s3.amazonaws.com/kontur_datasets/kontur_topology_boundaries_IL_20230628.gpkg.gz"
PROJECT_DIR = Path(__file__).parent
JSON_DIR = PROJECT_DIR / "src" / "json"
TEMP_DIR = PROJECT_DIR / "temp_geo"
OUTPUT_FILE = JSON_DIR / "israel_boundaries.geojson"

# Create directories
JSON_DIR.mkdir(parents=True, exist_ok=True)
TEMP_DIR.mkdir(parents=True, exist_ok=True)

print("Starting GeoJSON extraction process...")
print(f"Project directory: {PROJECT_DIR}")

# Step 1: Download the file
gz_file = TEMP_DIR / "kontur_topology_boundaries_IL_20230628.gpkg.gz"
gpkg_file = TEMP_DIR / "kontur_topology_boundaries_IL_20230628.gpkg"

if not gpkg_file.exists():
    print(f"\n📥 Downloading GeoPackage file... (this may take a minute)")
    try:
        urllib.request.urlretrieve(DOWNLOAD_URL, gz_file)
        print(f"✓ Downloaded to {gz_file}")
        
        # Step 2: Extract gzip
        print(f"\n📦 Extracting gzip file...")
        with gzip.open(gz_file, 'rb') as f_in:
            with open(gpkg_file, 'wb') as f_out:
                shutil.copyfileobj(f_in, f_out)
        print(f"✓ Extracted to {gpkg_file}")
        
        # Clean up gzip file
        gz_file.unlink()
    except Exception as e:
        print(f"❌ Error downloading or extracting: {e}")
        exit(1)
else:
    print(f"✓ GeoPackage file already exists at {gpkg_file}")

# Step 3: Read the GeoPackage
try:
    print(f"\n📖 Reading GeoPackage file...")
    gdf = gpd.read_file(gpkg_file)
    print(f"✓ Loaded {len(gdf)} features")
    
    # Display available columns and first few rows for inspection
    print(f"\n📋 Available columns: {list(gdf.columns)}")
    print(f"\n🔍 First few rows:")
    print(gdf.head())
    
    # Step 4: Convert to GeoJSON
    print(f"\n💾 Converting to GeoJSON...")
    gdf.to_file(OUTPUT_FILE, driver='GeoJSON')
    print(f"✓ GeoJSON saved to {OUTPUT_FILE}")
    
    # Display file size
    file_size = OUTPUT_FILE.stat().st_size / (1024 * 1024)  # MB
    print(f"📊 File size: {file_size:.2f} MB")
    
    # Step 5: Extract summary statistics
    print(f"\n📊 Data Summary:")
    print(f"  - Total features: {len(gdf)}")
    if 'name' in gdf.columns:
        print(f"  - Unique names: {gdf['name'].nunique()}")
        print(f"  - Sample names: {gdf['name'].unique()[:5]}")
    print(f"  - Geometry types: {gdf.geometry.type.unique()}")
    print(f"  - CRS: {gdf.crs}")
    
    # Step 6: Clean up temporary files
    print(f"\n🧹 Cleaning up temporary files...")
    shutil.rmtree(TEMP_DIR)
    print(f"✓ Temporary files cleaned")
    
    print(f"\n✅ All done! GeoJSON file is ready at:")
    print(f"   {OUTPUT_FILE}")
    
except Exception as e:
    print(f"❌ Error processing GeoPackage: {e}")
    import traceback
    traceback.print_exc()
    exit(1)
