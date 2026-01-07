#!/usr/bin/env python3
"""
Cluster damage sites within 500m and iteratively merge overlapping clusters.
Output cluster centroids as Points with proper radii.

Usage:
  python damage_sites_to_clusters.py --input input.geojson --output output.geojson --eps 500
"""

import json
import math
import argparse
from collections import defaultdict

R = 6378137.0  # Web Mercator radius
BUILDING_SIZE = 10.0  # meters per point (small to allow proper scaling)

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

def cluster_points(points_ll, eps_m):
    """Cluster points within eps_m radius using fixed-seed grid method.
    Returns list of Cluster objects.
    """
    pts_merc = [lonlat_to_merc(lon, lat) for lon, lat in points_ll]
    n = len(points_ll)
    assigned = [False] * n

    cell = eps_m
    grid = {}
    for idx, (x, y) in enumerate(pts_merc):
        cx = int(x // cell)
        cy = int(y // cell)
        grid.setdefault((cx, cy), []).append(idx)

    eps2 = eps_m * eps_m
    clusters = []

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
        cluster_indices = [i]
        assigned[i] = True
        
        for j in neighbor_indices(i):
            if assigned[j] or j == i:
                continue
            dx = pts_merc[j][0] - seedx
            dy = pts_merc[j][1] - seedy
            if dx * dx + dy * dy <= eps2:
                cluster_indices.append(j)
                assigned[j] = True

        clusters.append(Cluster(cluster_indices, pts_merc, points_ll))

    return clusters

class Cluster:
    def __init__(self, point_indices, points_merc, points_ll):
        self.indices = point_indices
        self.points_merc = [points_merc[i] for i in point_indices]
        self.points_ll = [points_ll[i] for i in point_indices]
        self.count = len(point_indices)
        
        # Calculate centroid in Mercator
        self.cx = sum(p[0] for p in self.points_merc) / self.count
        self.cy = sum(p[1] for p in self.points_merc) / self.count
        
        # Calculate radius based on sqrt(count) * 10m (no cap for proper proportions)
        self.radius = math.sqrt(self.count) * BUILDING_SIZE
    
    def overlaps(self, other):
        """Check if this cluster's circle overlaps with another."""
        dx = self.cx - other.cx
        dy = self.cy - other.cy
        dist = math.sqrt(dx * dx + dy * dy)
        return dist < (self.radius + other.radius)
    
    def merge(self, other):
        """Merge another cluster into this one."""
        self.indices.extend(other.indices)
        self.points_merc.extend(other.points_merc)
        self.points_ll.extend(other.points_ll)
        self.count = len(self.indices)
        
        # Recalculate centroid
        self.cx = sum(p[0] for p in self.points_merc) / self.count
        self.cy = sum(p[1] for p in self.points_merc) / self.count
        
        # Recalculate radius
        self.radius = math.sqrt(self.count) * BUILDING_SIZE
    
    def to_geojson_feature(self):
        """Convert to GeoJSON Point feature."""
        clon, clat = merc_to_lonlat(self.cx, self.cy)
        return {
            'type': 'Feature',
            'properties': {
                'count': self.count,
                'radius': round(self.radius, 2)
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [clon, clat]
            }
        }

def merge_overlapping_clusters(clusters):
    """Iteratively merge overlapping clusters until no more overlaps exist."""
    iteration = 0
    while True:
        iteration += 1
        merged_any = False
        new_clusters = []
        merged_mask = [False] * len(clusters)
        
        for i in range(len(clusters)):
            if merged_mask[i]:
                continue
            
            current = clusters[i]
            # Check for overlaps with remaining clusters
            for j in range(i + 1, len(clusters)):
                if merged_mask[j]:
                    continue
                if current.overlaps(clusters[j]):
                    current.merge(clusters[j])
                    merged_mask[j] = True
                    merged_any = True
            
            new_clusters.append(current)
        
        print(f"  Iteration {iteration}: {len(clusters)} -> {len(new_clusters)} clusters")
        
        if not merged_any:
            break
        
        clusters = new_clusters
        
        # Safety limit
        if iteration > 100:
            print("  Warning: Max iterations reached")
            break
    
    return clusters

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--input', required=True)
    ap.add_argument('--output', required=True)
    ap.add_argument('--eps', type=float, default=500.0, help='Clustering distance in meters')
    args = ap.parse_args()

    print(f"Loading {args.input}...")
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

    print(f"Found {len(points_ll)} points")

    # Initial clustering
    print(f"Initial clustering with eps={args.eps}m...")
    clusters = cluster_points(points_ll, args.eps)
    print(f"  Created {len(clusters)} initial clusters")

    # Merge overlapping clusters
    print("Merging overlapping clusters (based on sqrt(count)*50m radii)...")
    clusters = merge_overlapping_clusters(clusters)
    print(f"Final: {len(clusters)} non-overlapping clusters")

    # Output as FeatureCollection of Points
    features = [cluster.to_geojson_feature() for cluster in clusters]

    out = {
        'type': 'FeatureCollection',
        'features': features
    }

    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(out, f, separators=(',', ':'))

    print(f"Saved {len(clusters)} non-overlapping cluster centroids -> {args.output}")

if __name__ == '__main__':
    main()
