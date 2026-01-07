#!/usr/bin/env python3
"""
Cluster damage sites with iterative overlap resolution and shape generation.

Features:
- Clusters points within epsilon radius
- Iteratively merges overlapping clusters until stable
- Generates polygon shapes based on actual point distributions
- Each shape is a convex hull of its points with buffer based on sqrt(count) * 50m

Usage:
  python damage_sites_to_shapes.py --input input.geojson --output output.geojson --eps 500
"""

import json
import math
import argparse
from collections import defaultdict

R = 6378137.0  # Web Mercator radius
BUILDING_SIZE = 50.0  # meters per point

def lonlat_to_merc(lon, lat):
    """Convert lon/lat to Web Mercator (x, y) in meters."""
    lon_rad = math.radians(lon)
    lat_rad = math.radians(lat)
    x = R * lon_rad
    y = R * math.log(math.tan(math.pi / 4.0 + lat_rad / 2.0))
    return x, y

def merc_to_lonlat(x, y):
    """Convert Web Mercator (x, y) to lon/lat degrees."""
    lon = (x / R) * 180.0 / math.pi
    lat = (2.0 * math.atan(math.exp(y / R)) - math.pi / 2.0) * 180.0 / math.pi
    return lon, lat

def distance_merc(p1, p2):
    """Euclidean distance between two Mercator points."""
    dx = p1[0] - p2[0]
    dy = p1[1] - p2[1]
    return math.sqrt(dx * dx + dy * dy)

def convex_hull(points):
    """Compute convex hull using Graham scan. Points are (x, y) tuples."""
    if len(points) <= 2:
        return points
    
    points = sorted(set(points))
    if len(points) <= 2:
        return points
    
    # Build lower hull
    lower = []
    for p in points:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    
    # Build upper hull
    upper = []
    for p in reversed(points):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    
    return lower[:-1] + upper[:-1]

def cross(o, a, b):
    """Cross product of vectors OA and OB."""
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

def buffer_polygon(polygon, distance):
    """Simple buffer by expanding polygon outward. Approximation for visualization."""
    if len(polygon) < 3:
        # For 1-2 points, return a circle approximation
        if len(polygon) == 1:
            return circle_points(polygon[0][0], polygon[0][1], distance, 16)
        else:
            # For 2 points, create capsule
            cx = (polygon[0][0] + polygon[1][0]) / 2
            cy = (polygon[0][1] + polygon[1][1]) / 2
            return circle_points(cx, cy, distance, 16)
    
    # For 3+ points, expand from centroid
    cx = sum(p[0] for p in polygon) / len(polygon)
    cy = sum(p[1] for p in polygon) / len(polygon)
    
    buffered = []
    for px, py in polygon:
        dx = px - cx
        dy = py - cy
        length = math.sqrt(dx * dx + dy * dy)
        if length > 0:
            buffered.append((px + dx / length * distance, py + dy / length * distance))
        else:
            buffered.append((px, py))
    
    return buffered

def circle_points(cx, cy, radius, num_points=16):
    """Generate points around a circle."""
    points = []
    for i in range(num_points):
        angle = 2 * math.pi * i / num_points
        x = cx + radius * math.cos(angle)
        y = cy + radius * math.sin(angle)
        points.append((x, y))
    return points

class Cluster:
    def __init__(self, point_indices, points_merc, points_ll):
        self.indices = point_indices
        self.points_merc = [points_merc[i] for i in point_indices]
        self.points_ll = [points_ll[i] for i in point_indices]
        self.count = len(point_indices)
        
        # Calculate centroid in Mercator
        self.cx = sum(p[0] for p in self.points_merc) / self.count
        self.cy = sum(p[1] for p in self.points_merc) / self.count
        
        # Calculate radius based on sqrt(count) * 50m
        self.radius = math.sqrt(self.count) * BUILDING_SIZE
        
    def overlaps(self, other):
        """Check if this cluster overlaps with another (with threshold to avoid over-merging)."""
        dist = distance_merc((self.cx, self.cy), (other.cx, other.cy))
        # Only merge if centers are closer than 50% of combined radii (strict overlap)
        return dist < (self.radius + other.radius) * 0.5
    
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
    
    def to_polygon_geojson(self):
        """Convert cluster to GeoJSON Polygon based on convex hull of points."""
        if self.count == 1:
            # Single point: create small circle
            lon, lat = self.points_ll[0]
            x, y = lonlat_to_merc(lon, lat)
            circle = circle_points(x, y, self.radius, 16)
            coords = [[merc_to_lonlat(px, py) for px, py in circle]]
            coords[0].append(coords[0][0])  # Close the ring
        else:
            # Multiple points: convex hull + buffer
            hull = convex_hull(self.points_merc)
            buffered = buffer_polygon(hull, self.radius * 0.5)  # 50% of radius as buffer
            coords = [[merc_to_lonlat(px, py) for px, py in buffered]]
            coords[0].append(coords[0][0])  # Close the ring
        
        return {
            'type': 'Feature',
            'properties': {
                'count': self.count,
                'radius': round(self.radius, 2)
            },
            'geometry': {
                'type': 'Polygon',
                'coordinates': coords
            }
        }

def initial_clustering(points_ll, points_merc, eps_m):
    """Initial clustering using grid-based method."""
    n = len(points_ll)
    assigned = [False] * n
    
    # Grid index
    cell = eps_m
    grid = {}
    for idx, (x, y) in enumerate(points_merc):
        cx = int(x // cell)
        cy = int(y // cell)
        grid.setdefault((cx, cy), []).append(idx)
    
    eps2 = eps_m * eps_m
    clusters = []
    
    def neighbor_indices(i):
        x, y = points_merc[i]
        cx = int(x // cell)
        cy = int(y // cell)
        for nx in (cx - 1, cx, cx + 1):
            for ny in (cy - 1, cy, cy + 1):
                for j in grid.get((nx, ny), []):
                    yield j
    
    for i in range(n):
        if assigned[i]:
            continue
        seedx, seedy = points_merc[i]
        cluster_indices = [i]
        assigned[i] = True
        
        for j in neighbor_indices(i):
            if assigned[j] or j == i:
                continue
            dx = points_merc[j][0] - seedx
            dy = points_merc[j][1] - seedy
            if dx * dx + dy * dy <= eps2:
                cluster_indices.append(j)
                assigned[j] = True
        
        clusters.append(Cluster(cluster_indices, points_merc, points_ll))
    
    return clusters

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
    ap = argparse.ArgumentParser(description='Cluster damage sites with shape generation')
    ap.add_argument('--input', required=True, help='Input GeoJSON file')
    ap.add_argument('--output', required=True, help='Output GeoJSON file')
    ap.add_argument('--eps', type=float, default=500.0, help='Initial clustering distance in meters')
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
    
    # Convert to Mercator
    points_merc = [lonlat_to_merc(lon, lat) for lon, lat in points_ll]
    
    # Initial clustering
    print(f"Initial clustering with eps={args.eps}m...")
    clusters = initial_clustering(points_ll, points_merc, args.eps)
    print(f"  Created {len(clusters)} initial clusters")
    
    # Merge overlapping clusters
    print("Merging overlapping clusters...")
    clusters = merge_overlapping_clusters(clusters)
    print(f"Final: {len(clusters)} non-overlapping clusters")
    
    # Generate output GeoJSON
    features = [cluster.to_polygon_geojson() for cluster in clusters]
    
    out = {
        'type': 'FeatureCollection',
        'features': features
    }
    
    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(out, f, separators=(',', ':'))
    
    print(f"Saved {len(clusters)} polygon shapes -> {args.output}")

if __name__ == '__main__':
    main()
