#!/usr/bin/env python3
"""
Generate area polygons from damage site points using ~100m clustering.

Inputs:
  --input  Path to input GeoJSON with Point features
  --output Path to output GeoJSON (MultiPolygon as single Feature)
  --eps    Clustering distance in meters (default: 100)
  --max-points Optional cap to sample points for speed (default: 500000)

Algorithm:
  - Convert lon/lat to Web Mercator meters for distance checks
  - Grid-based neighbor search + union-find for clustering (O(n))
  - Build convex hull for each cluster (monotone chain) on lon/lat
  - For clusters with <3 points, create small squares (~25m) to retain area
  - Output single Feature with MultiPolygon of all cluster hulls
"""

import json
import math
import argparse
from collections import defaultdict


R = 6378137.0  # Web Mercator radius


def lonlat_to_merc(lon, lat):
    lon_rad = math.radians(lon)
    lat_rad = math.radians(lat)
    x = R * lon_rad
    y = R * math.log(math.tan(math.pi / 4.0 + lat_rad / 2.0))
    return x, y

def merc_to_lonlat(x, y):
    lon = (x / R) * 180.0 / math.pi
    lat = (2.0 * math.atan(math.exp(y / R)) - math.pi / 2.0) * 180.0 / math.pi
    return lon, lat


def deg_offsets_for_meters(lat, dx_m, dy_m):
    # Approximate degree offsets for given meters at latitude
    deg_per_meter_lat = 1.0 / 110540.0
    deg_per_meter_lon = 1.0 / (111320.0 * max(0.0001, math.cos(math.radians(lat))))
    return dx_m * deg_per_meter_lon, dy_m * deg_per_meter_lat


def convex_hull(points):
    # Monotone chain convex hull on planar coords (Mercator meters)
    pts = sorted(set(points))
    if len(pts) <= 1:
        return pts

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower = []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)

    upper = []
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)

    # Concatenate lower and upper to form full hull; remove last point of each as it's duplicated
    return lower[:-1] + upper[:-1]


def cluster_points(points_ll, eps_m):
    """Cluster by fixed radius around each seed point (non-transitive) using a grid index.
    This avoids chain merging and runs near-linear time.
    """
    pts_merc = [lonlat_to_merc(lon, lat) for lon, lat in points_ll]
    n = len(points_ll)
    assigned = [False] * n
    clusters = []

    cell = eps_m  # cell size roughly eps
    grid = {}
    for idx, (x, y) in enumerate(pts_merc):
        cx = int(x // cell)
        cy = int(y // cell)
        grid.setdefault((cx, cy), []).append(idx)

    eps2 = eps_m * eps_m

    def neighbor_indices(i):
        x, y = pts_merc[i]
        cx = int(x // cell)
        cy = int(y // cell)
        for nx in (cx - 1, cx, cx + 1):
            for ny in (cy - 1, cy, cy + 1):
                for j in grid.get((nx, ny), []):
                    yield j

    for i in range(n):
        if assigned[i]:
            continue
        seedx, seedy = pts_merc[i]
        cluster = [i]
        assigned[i] = True
        for j in neighbor_indices(i):
            if assigned[j] or j == i:
                continue
            dx = pts_merc[j][0] - seedx
            dy = pts_merc[j][1] - seedy
            if dx * dx + dy * dy <= eps2:
                cluster.append(j)
                assigned[j] = True
        clusters.append(cluster)

    return clusters


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--input', required=True)
    ap.add_argument('--output', required=True)
    ap.add_argument('--eps', type=float, default=100.0, help='Clustering distance in meters')
    ap.add_argument('--max-points', type=int, default=500000)
    args = ap.parse_args()

    with open(args.input, 'r', encoding='utf-8') as f:
        gj = json.load(f)

    # Collect points
    points_ll = []
    for feat in gj.get('features', []):
        geom = feat.get('geometry')
        if not geom:
            continue
        if geom.get('type') == 'Point':
            lon, lat = geom['coordinates'][:2]
            points_ll.append((float(lon), float(lat)))

    if not points_ll:
        raise SystemExit('No Point features found in input.')

    # Optional sampling for very large inputs
    if len(points_ll) > args.max_points:
        step = math.ceil(len(points_ll) / args.max_points)
        points_ll = points_ll[::step]

    # Cluster
    clusters = cluster_points(points_ll, args.eps)

    # Build hulls (lon/lat)
    polygons = []  # list of polygon rings in lon/lat
    # Precompute mercator points
    pts_merc = [lonlat_to_merc(lon, lat) for lon, lat in points_ll]
    for idxs in clusters:
        if len(idxs) >= 3:
            # Build hull in mercator meters
            hullm = convex_hull([pts_merc[i] for i in idxs])
            if len(hullm) >= 3:
                ring_ll = [list(merc_to_lonlat(x, y)) for (x, y) in hullm]
                ring_ll.append(ring_ll[0][:])
                polygons.append(ring_ll)
        else:
            # Create ~25m squares in mercator and convert back
            half = 25.0
            for i in idxs:
                x, y = pts_merc[i]
                square = [
                    (x - half, y - half),
                    (x + half, y - half),
                    (x + half, y + half),
                    (x - half, y + half),
                    (x - half, y - half),
                ]
                ring_ll = [list(merc_to_lonlat(px, py)) for (px, py) in square]
                polygons.append(ring_ll)

    # Output as a single MultiPolygon feature
    out = {
        'type': 'FeatureCollection',
        'features': [
            {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'MultiPolygon',
                    'coordinates': [[ring] for ring in polygons]  # each polygon has one ring
                }
            }
        ]
    }

    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(out, f, separators=(',', ':'))

    print(f"[areas] clusters={len(clusters)} polygons={len(polygons)} -> {args.output}")


if __name__ == '__main__':
    main()
