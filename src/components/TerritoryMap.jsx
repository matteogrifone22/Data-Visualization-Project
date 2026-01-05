import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import geojsonUrl from '../GazaMap/unified_territories.geojson?url';

export default function TerritoryMap({ isDark }) {
  const svgRef = useRef(null);
  const geojsonDataRef = useRef(null);
  const projectionRef = useRef(null);
  const isFirstRenderRef = useRef(true);
  const elementsRenderedRef = useRef(false);

  const readCssColor = (variable, fallback) => {
    if (typeof window === "undefined") return fallback;
    const value = window.getComputedStyle(document.documentElement).getPropertyValue(variable);
    return value ? value.trim() : fallback;
  };

  // Initial render: load GeoJSON and create map structure (runs once)
  useEffect(() => {
    if (!svgRef.current) return;

    const loadAndRenderMap = async () => {
      try {
        // Load GeoJSON data from imported URL
        const response = await fetch(geojsonUrl);
        const geojsonData = await response.json();
        geojsonDataRef.current = geojsonData;

        const width = 1100;
        const height = 700;

        // Set up the SVG
        const svg = d3.select(svgRef.current)
          .attr('width', width)
          .attr('height', height)
          .attr('viewBox', `0 0 ${width} ${height}`)
          .attr('preserveAspectRatio', 'xMidYMid meet');

        // Create projection - centered on the region
        const projection = d3.geoMercator()
          .center([35.056898, 31.3945])
          .scale(8500)
          .translate([width / 2, height / 2]);
        projectionRef.current = projection;

        const path = d3.geoPath().projection(projection);

        // Get theme colors upfront
        const israelColor = readCssColor('--color-Israel', isDark ? '#1F62FF' : '#0038B8');
        const palestineColor = readCssColor('--color-Palestine', isDark ? '#00A352' : '#007A3D');
        const neutralFill = readCssColor('--bg-secondary', isDark ? '#2d3036' : '#f4f4f4');

        const colorScale = d3.scaleOrdinal()
          .domain(['Israel', 'Palestine'])
          .range([israelColor, palestineColor]);

        // Create a group for the map features
        const g = svg.append('g');

        // Bind data and create paths WITH colors immediately
        g.selectAll('path')
          .data(geojsonData.features)
          .enter()
          .append('path')
          .attr('d', path)
          .attr('fill', 'transparent')
          .attr('stroke', d => colorScale(d.properties.country))
          .attr('stroke-width', 2)
          .attr('class', 'territory')
          .attr('data-country', d => d.properties.country);

        // Manually placed labels for key territories
        const labelSpecs = [
          { name: 'GazaStrip', coords: [33.8, 31.52], country: 'Palestine' },
          { name: 'West Bank', coords: [36.10, 31.90], country: 'Palestine' },
          { name: 'Israel', coords: [34.85, 33.30], country: 'Israel' }
        ];

        const labelGroup = g.append('g').attr('class', 'territory-labels');

        labelSpecs.forEach(label => {
          const projected = projection(label.coords);
          if (!projected) return;
          labelGroup.append('text')
            .attr('x', projected[0])
            .attr('y', projected[1])
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .style('font-size', '30px')
            .style('font-weight', '700')
            .style('fill', colorScale(label.country))
            .style('paint-order', 'stroke')
            .style('stroke', neutralFill)
            .style('stroke-width', '0px')
            .text(label.name)
            .attr('data-country', label.country);
        });

        // Mark elements as rendered
        elementsRenderedRef.current = true;

      } catch (error) {
        console.error('Error rendering map:', error);
      }
    };

    loadAndRenderMap();
  }, []); // Empty dependency: only runs once on mount

  // Helper function to apply colors
  const applyColors = (duration) => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    const israelColor = readCssColor('--color-Israel', isDark ? '#1F62FF' : '#0038B8');
    const palestineColor = readCssColor('--color-Palestine', isDark ? '#00A352' : '#007A3D');
    const neutralFill = readCssColor('--bg-secondary', isDark ? '#2d3036' : '#f4f4f4');

    const colorScale = d3.scaleOrdinal()
      .domain(['Israel', 'Palestine'])
      .range([israelColor, palestineColor]);

    // Update path colors
    svg.selectAll('path.territory')
      .transition()
      .duration(duration)
      .attr('stroke', function() {
        const country = d3.select(this).attr('data-country');
        return colorScale(country);
      });

    // Update text colors and stroke
    svg.selectAll('text')
      .transition()
      .duration(duration)
      .style('fill', function() {
        const country = d3.select(this).attr('data-country');
        return colorScale(country);
      })
      .style('stroke', neutralFill);
  };

  // Update colors on theme change (fast)
  useEffect(() => {
    applyColors(200); // Smooth transition on theme change
  }, [isDark]);

  return (
    <>
      <svg ref={svgRef} className="territory-map-svg"></svg>
    </>
  );
}
