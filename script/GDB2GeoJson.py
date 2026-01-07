"""
GDB2GeoJson: Convert ESRI File Geodatabase (.gdb) layers to GeoJSON

Features:
- Lists available layers in a .gdb
- Converts all or selected layers to individual .geojson files
- Optional reprojection to WGS84 (EPSG:4326) for web maps
- Uses Fiona/GeoPandas when available; falls back to ogr2ogr if needed

Usage examples:
  python script/GDB2GeoJson.py --gdb-path src/GazaMap/UNOSAT_GazaStrip_CDA_11October2025.gdb --out-dir src/GazaMap/GeoMap
  python script/GDB2GeoJson.py --gdb-path src/GazaMap/UNOSAT_GazaStrip_CDA_11October2025.gdb --out-dir src/GazaMap/GeoMap --layers LayerA,LayerB
  python script/GDB2GeoJson.py --gdb-path src/GazaMap/UNOSAT_GazaStrip_CDA_11October2025.gdb --out-dir src/GazaMap/GeoMap --reproject 4326

Notes:
- Requires either: (a) GeoPandas/Fiona (preferred), or (b) GDAL/ogr2ogr installed.
- On Windows, install with: pip install geopandas fiona pyproj shapely
  If ogr2ogr is available, it will be used automatically as fallback.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import List, Optional


def _print(msg: str) -> None:
	print(f"[GDB2GeoJson] {msg}")


def list_layers_fiona(gdb_path: Path) -> Optional[List[str]]:
	try:
		import fiona
	except Exception:
		return None

	try:
		# Fiona with GDAL >= 2 should support FileGDB via OpenFileGDB driver
		layers = fiona.listlayers(str(gdb_path))
		# Filter to spatial layers (those with geometry)
		spatial_layers: List[str] = []
		for lyr in layers or []:
			try:
				with fiona.open(str(gdb_path), layer=lyr) as src:
					geom_type = src.schema.get("geometry")
					if geom_type and geom_type != "None":
						spatial_layers.append(lyr)
			except Exception:
				# If layer can't be opened, skip it
				pass
		return spatial_layers
	except Exception as e:
		_print(f"Fiona failed to list layers: {e}")
		return None


def list_layers_ogr(gdb_path: Path) -> Optional[List[str]]:
	# Try ogrinfo to list layers
	try:
		cmd = ["ogrinfo", "-so", str(gdb_path)]
		res = subprocess.run(cmd, capture_output=True, text=True, check=False)
		if res.returncode != 0:
			return None
		layers: List[str] = []
		for line in res.stdout.splitlines():
			line = line.strip()
			# Lines often like: "1: LayerName (Polygon)"
			if ":" in line and "(" in line and ")" in line:
				name = line.split(":", 1)[1].split("(")[0].strip()
				if name:
					layers.append(name)
		return layers
	except FileNotFoundError:
		return None
	except Exception:
		return None


def convert_layer_geopandas(gdb_path: Path, layer: str, out_path: Path, epsg: Optional[int]) -> bool:
	try:
		import geopandas as gpd
	except Exception as e:
		_print(f"GeoPandas not available: {e}")
		return False
	try:
		gdf = gpd.read_file(str(gdb_path), layer=layer)
		# Ensure this is a GeoDataFrame with geometry
		if not hasattr(gdf, "geometry") or gdf.geometry is None:
			_print(f"Layer '{layer}' is non-spatial; skipping.")
			return False
		if gdf.empty:
			_print(f"Layer '{layer}' has no features; skipping.")
			return False
		# Ensure CRS, reproject if requested
		if epsg:
			try:
				if gdf.crs is None:
					# If missing, assume WGS84 only if requested; otherwise leave as-is
					gdf = gdf.set_crs(epsg)
				else:
					gdf = gdf.to_crs(epsg)
			except Exception as e:
				_print(f"Reprojection to EPSG:{epsg} failed for '{layer}': {e}")
		out_path.parent.mkdir(parents=True, exist_ok=True)
		gdf.to_file(out_path, driver="GeoJSON")
		return True
	except Exception as e:
		_print(f"GeoPandas conversion failed for '{layer}': {e}")
		return False


def convert_layer_ogr(gdb_path: Path, layer: str, out_path: Path, epsg: Optional[int]) -> bool:
	# Requires ogr2ogr on PATH
	try:
		out_path.parent.mkdir(parents=True, exist_ok=True)
		cmd = [
			"ogr2ogr",
			"-f",
			"GeoJSON",
			str(out_path),
			str(gdb_path),
			layer,
		]
		if epsg:
			cmd.extend(["-t_srs", f"EPSG:{epsg}"])
		res = subprocess.run(cmd, capture_output=True, text=True)
		if res.returncode != 0:
			_print(f"ogr2ogr failed for '{layer}': {res.stderr.strip()}\nCommand: {' '.join(cmd)}")
			return False
		return True
	except FileNotFoundError:
		_print("ogr2ogr not found on PATH.")
		return False
	except Exception as e:
		_print(f"ogr2ogr exception for '{layer}': {e}")
		return False


def main() -> int:
	parser = argparse.ArgumentParser(description="Convert ESRI FileGDB (.gdb) to GeoJSON")
	parser.add_argument("--gdb-path", required=True, help="Path to .gdb folder")
	parser.add_argument("--out-dir", required=True, help="Output directory for .geojson files")
	parser.add_argument("--layers", help="Comma-separated layer names to convert (default: all layers)")
	parser.add_argument("--reproject", type=int, default=4326, help="Target EPSG (default: 4326 for WGS84). Use 0 to skip reproject.")
	parser.add_argument("--list", action="store_true", help="Only list layers without converting")
	args = parser.parse_args()

	gdb_path = Path(args.gdb_path)
	out_dir = Path(args.out_dir)
	epsg = args.reproject if args.reproject and args.reproject > 0 else None

	if not gdb_path.exists() or not gdb_path.is_dir() or gdb_path.suffix.lower() != ".gdb":
		_print(f"Invalid GDB path: {gdb_path}")
		return 1

	# Discover layers
	layers = list_layers_fiona(gdb_path)
	if layers is None:
		layers = list_layers_ogr(gdb_path)

	if layers is None:
		_print("Could not list layers. Ensure Fiona or GDAL/ogr are installed.")
		return 1

	_print(f"Found {len(layers)} layer(s): {', '.join(layers)}")

	if args.list:
		return 0

	selected_layers: List[str]
	if args.layers:
		wanted = [l.strip() for l in args.layers.split(",") if l.strip()]
		selected_layers = [l for l in layers if l in wanted]
		missing = [l for l in wanted if l not in layers]
		if missing:
			_print(f"Warning: requested layer(s) not found: {', '.join(missing)}")
	else:
		selected_layers = layers

	if not selected_layers:
		_print("No layers selected for conversion.")
		return 1

	# Convert each layer
	all_ok = True
	for layer in selected_layers:
		out_path = out_dir / f"{layer}.geojson"
		_print(f"Converting layer '{layer}' -> {out_path}")
		ok = convert_layer_geopandas(gdb_path, layer, out_path, epsg)
		if not ok:
			_print(f"Falling back to ogr2ogr for layer '{layer}'")
			ok = convert_layer_ogr(gdb_path, layer, out_path, epsg)
		all_ok = all_ok and ok

	if all_ok:
		_print("Conversion completed successfully.")
		return 0
	else:
		_print("Conversion completed with errors.")
		return 2


if __name__ == "__main__":
	sys.exit(main())

