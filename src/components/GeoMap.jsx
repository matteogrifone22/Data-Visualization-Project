import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import gazaBoundaries from '../GazaMap/GazaStrip_MunicipalBoundaries_new.json';
import incidentsData from '../Dataset/processed/Combined_Incidents_GeoChart.csv?raw';
// Clustered damage sites (500m radius)
const damageSitesUrl = new URL('../GazaMap/Damage_Sites_clusters_500m.geojson', import.meta.url).href;

const GeoChart = ({ isDark, isMonochromacy = false }) => {
    const svgRef = useRef();
    const wrapperRef = useRef();
    const mapContainerRef = useRef();
    const [selectedType, setSelectedType] = useState('all');
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [viewMode, setViewMode] = useState('full'); // 'full' or 'daily'
    const [selectedDate, setSelectedDate] = useState(null);
    const [dateRange, setDateRange] = useState({ min: null, max: null });
    const [isPlaying, setIsPlaying] = useState(false);
    const [isCumulative, setIsCumulative] = useState(false); // New cumulative state
    const [damageSitesData, setDamageSitesData] = useState(null);
    const [datasetMode, setDatasetMode] = useState('incidents'); // 'incidents' or 'damage'
    const animationInterval = useRef(null);

    useEffect(() => {
        if (!svgRef.current || !mapContainerRef.current || !gazaBoundaries) return;
        
        // Re-read theme color on every render to ensure it's current
        const readCssColor = (variable, fallback) => {
            if (typeof window === "undefined") return fallback;
            const value = window.getComputedStyle(document.documentElement).getPropertyValue(variable);
            return value ? value.trim() : fallback;
        };
        const themeColor = readCssColor('--color-details', '#FF6B6B');

        const width = mapContainerRef.current.offsetWidth || 900;
        const height = 400;
        const margin = { top: 10, right: 10, bottom: 10, left: 10 };

        const svg = d3.select(svgRef.current)
            .attr('width', width)
            .attr('height', height);

        svg.selectAll('*').remove();

        // Calculate bounds and center
        // Calculate bounds for filtering
        const bounds = d3.geoBounds(gazaBoundaries);
        const minLon = bounds[0][0];
        const maxLon = bounds[1][0];
        const minLat = bounds[0][1];
        const maxLat = bounds[1][1];
        const centerLon = (minLon + maxLon) / 2;
        const centerLat = (minLat + maxLat) / 2;

        // Start with fitExtent to show full map, then apply zoom
        const baseProjection = d3.geoMercator()
            .fitExtent(
                [[margin.left, margin.top], [width - margin.right, height - margin.bottom]],
                gazaBoundaries
            );
        
        const baseScale = baseProjection.scale();
        const baseTranslate = baseProjection.translate();
        
        // Apply zoom level and pan offset
        const projection = d3.geoMercator()
            .center([centerLon, centerLat])
            .scale(baseScale * zoomLevel)
            .translate([width / 2 + panOffset.x, height / 2 + panOffset.y]);

        const pathGenerator = d3.geoPath().projection(projection);

        // Create main group for map content
        const mapGroup = svg.append('g')
            .attr('class', 'map-group');

        // Add drag behavior to the map group
        const drag = d3.drag()
            .on('start', function(event) {
                d3.select(this).style('cursor', 'grabbing');
            })
            .on('drag', function(event) {
                setPanOffset(prev => ({
                    x: prev.x + event.dx,
                    y: prev.y + event.dy
                }));
            })
            .on('end', function(event) {
                d3.select(this).style('cursor', 'grab');
            });

        mapGroup.call(drag).style('cursor', 'grab');

        // Draw map boundaries
        const boundaryPaths = mapGroup.append('g')
            .attr('class', 'boundaries')
            .selectAll('path')
            .data(gazaBoundaries.features)
            .join('path')
            .attr('d', pathGenerator)
            .attr('fill', 'var(--bg-secondary)')
            .attr('stroke', 'var(--text-primary)')
            .attr('stroke-width', 1.5);

        // Color scale for incident types
        const colorScale = d3.scaleOrdinal()
            .domain(['Food System', 'Health Care'])
            .range([themeColor, themeColor]);  // Both categories use the same theme color

        // Create tooltip
        const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'chart-tooltip')
            .style('position', 'absolute')
            .style('visibility', 'hidden')
            .style('opacity', '0')
            .style('pointer-events', 'none')
            .style('z-index', '1000')
            .style('max-width', '400px')
            .style('word-wrap', 'break-word')
            .style('white-space', 'normal');

        // Parse incidents with date
        const allIncidents = d3.csvParse(incidentsData, d => ({
            ...d,
            latitude: +d.latitude,
            longitude: +d.longitude,
            date: new Date(d.date)
        })).filter(d => !isNaN(d.latitude) && !isNaN(d.longitude) && !isNaN(d.date.getTime()) && 
                        d.longitude >= minLon && d.longitude <= maxLon && 
                        d.latitude >= minLat && d.latitude <= maxLat);

        // Set date range if not set
        if (!dateRange.min || !dateRange.max) {
            const dates = allIncidents.map(d => d.date);
            const minDate = d3.min(dates);
            const maxDate = d3.max(dates);
            setDateRange({ min: minDate, max: maxDate });
            if (!selectedDate) setSelectedDate(minDate);
        }

        // Filter by category
        let incidents = selectedType === 'all' 
            ? allIncidents 
            : allIncidents.filter(d => d.type === selectedType);

        // Filter by date if in daily mode (monthly increments)
        if (viewMode === 'daily' && selectedDate) {
            const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
            const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);
            
            if (isCumulative) {
                // Show all incidents from start date to current month
                const cumulativeStart = new Date(dateRange.min.getFullYear(), dateRange.min.getMonth(), 1);
                incidents = incidents.filter(d => d.date >= cumulativeStart && d.date <= monthEnd);
            } else {
                // Show only current month
                incidents = incidents.filter(d => d.date >= monthStart && d.date <= monthEnd);
            }
        }

        // Draw incident points (only show when incidents mode is selected)
        if (datasetMode === 'incidents') {
            const points = mapGroup.append('g')
                .attr('class', 'incidents')
                .selectAll('circle')
                .data(incidents)
                .join('circle')
                .attr('cx', d => {
                    const coords = projection([d.longitude, d.latitude]);
                    return coords ? coords[0] : null;
                })
                .attr('cy', d => {
                    const coords = projection([d.longitude, d.latitude]);
                    return coords ? coords[1] : null;
                })
                .attr('r', 4)
                .attr('fill', d => colorScale(d.type))
                .attr('fill-opacity', 0.6)
                .style('cursor', 'pointer')
                .on('mouseover', function(event, d) {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr('r', 6)
                        .attr('fill-opacity', 1);

                    tooltip
                        .style('visibility', 'visible')
                        .style('opacity', '1')
                        .html(`
                            <strong>${d.type}</strong><br/>
                            <strong>Date:</strong> ${d.date}<br/>
                            <strong>Location:</strong> ${d.latitude.toFixed(4)}, ${d.longitude.toFixed(4)}<br/>
                            ${d.perpetrator ? `<strong>Perpetrator:</strong> ${d.perpetrator}<br/>` : ''}
                            ${d.weapon ? `<strong>Weapon:</strong> ${d.weapon}<br/>` : ''}
                            ${d.description ? `<div style="margin-top:6px;font-size:12px;">${d.description.slice(0, 150)}${d.description.length > 150 ? '...' : ''}</div>` : ''}
                        `);
                })
                .on('mousemove', event => {
                    tooltip
                        .style('top', (event.pageY - 10) + 'px')
                        .style('left', (event.pageX + 10) + 'px');
                })
                .on('mouseout', function() {
                    d3.select(this)
                        .transition()
                        .duration(200)
                        .attr('r', 4)
                        .attr('fill-opacity', 0.6);

                    tooltip
                        .style('visibility', 'hidden')
                        .style('opacity', '0');
                });

            // Add point count display in bottom-left
            mapGroup.append('text')
                .attr('x', 10)
                .attr('y', height - 10)
                .attr('font-size', '12px')
                .attr('font-weight', '600')
                .attr('fill', 'var(--text-primary)')
                .text(`Total incidents: ${incidents.length}`);
        }

        // Overlay clustered damage sites as circles (only show when damage mode is selected)
        if (datasetMode === 'damage') {
            if (!damageSitesData) {
                fetch(damageSitesUrl)
                    .then(r => r.json())
                    .then(json => setDamageSitesData(json))
                    .catch(() => {/* ignore */});
            }

            if (damageSitesData && damageSitesData.features) {
                // Helper to convert geographic radius to pixel radius
                const getPixelRadius = (lon, lat, radiusMeters) => {
                    // Convert meters to approximate degrees at this latitude
                    // At Gaza's latitude (~31.5°), 1 degree longitude ≈ 95km
                    const metersPerDegreeLon = 111000 * Math.cos(lat * Math.PI / 180);
                    const radiusDegreesLon = radiusMeters / metersPerDegreeLon;
                    
                    // Project center and offset point
                    const center = projection([lon, lat]);
                    const offset = projection([lon + radiusDegreesLon, lat]);
                    
                    if (!center || !offset) return 3;
                    
                    // Calculate pixel distance
                    return Math.max(2, offset[0] - center[0]);
                };

                // Render damage sites as circles with proper radius
                mapGroup.append('g')
                    .attr('class', 'damage-sites')
                    .selectAll('circle')
                    .data(damageSitesData.features)
                    .join('circle')
                    .attr('cx', d => {
                        const coords = projection(d.geometry.coordinates);
                        return coords ? coords[0] : null;
                    })
                    .attr('cy', d => {
                        const coords = projection(d.geometry.coordinates);
                        return coords ? coords[1] : null;
                    })
                    .attr('r', d => {
                        // Radius = sqrt(count) * 10m - matches Python script, scales proportionally
                        const radiusMeters = Math.sqrt(d.properties.count) * 10;
                        return getPixelRadius(
                            d.geometry.coordinates[0],
                            d.geometry.coordinates[1],
                            radiusMeters
                        );
                    })
                    .attr('fill', themeColor)
                    .attr('fill-opacity', 0.6)
                    .attr('stroke', themeColor)
                    .attr('stroke-width', 1.5)
                    .attr('stroke-opacity', 0.9)
                    .style('cursor', 'pointer')
                    .on('mouseover', function(event, d) {
                        d3.select(this)
                            .attr('fill-opacity', 0.85)
                            .attr('stroke-width', 2);
                        const radiusMeters = Math.sqrt(d.properties.count) * 10;
                        tooltip
                            .style('visibility', 'visible')
                            .style('opacity', '1')
                            .html(`<strong>Damage area</strong><br/>Buildings: ${d.properties.count}<br/>Area radius: ${Math.round(radiusMeters)}m`);
                    })
                    .on('mousemove', event => {
                        tooltip
                            .style('top', (event.pageY - 10) + 'px')
                            .style('left', (event.pageX + 10) + 'px');
                    })
                    .on('mouseout', function() {
                        d3.select(this)
                            .attr('fill-opacity', 0.6)
                            .attr('stroke-width', 1.5);
                        tooltip.style('visibility', 'hidden');
                    });

                // Add total destroyed buildings counter in bottom-left
                const totalBuildings = damageSitesData.features.reduce((sum, f) => sum + f.properties.count, 0);
                mapGroup.append('text')
                    .attr('x', 10)
                    .attr('y', height - 10)
                    .attr('font-size', '12px')
                    .attr('font-weight', '600')
                    .attr('fill', 'var(--text-primary)')
                    .text(`Total destroyed buildings: ${totalBuildings.toLocaleString()}`);
            }
        }

        // Cleanup
        return () => {
            d3.selectAll('.chart-tooltip').remove();
        };

        // Add resize observer
        const resizeObserver = new ResizeObserver(() => {
            if (mapContainerRef.current) {
                // Re-trigger render
                const event = new Event('resize');
                window.dispatchEvent(event);
            }
        });
        if (mapContainerRef.current) {
            resizeObserver.observe(mapContainerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };

    }, [isDark, isMonochromacy, selectedType, zoomLevel, panOffset, viewMode, selectedDate, damageSitesData, datasetMode]);

    // Animation effect
    useEffect(() => {
        if (isPlaying && viewMode === 'daily' && dateRange.min && dateRange.max) {
            animationInterval.current = setInterval(() => {
                setSelectedDate(prevDate => {
                    if (!prevDate) return dateRange.min;
                    
                    // Move to next month
                    const nextMonth = new Date(prevDate);
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    
                    // If we've reached the end, loop back to start
                    if (nextMonth > dateRange.max) {
                        return new Date(dateRange.min);
                    }
                    return nextMonth;
                });
            }, 1000); // Change month every second
        } else {
            if (animationInterval.current) {
                clearInterval(animationInterval.current);
                animationInterval.current = null;
            }
        }

        return () => {
            if (animationInterval.current) {
                clearInterval(animationInterval.current);
            }
        };
    }, [isPlaying, viewMode, dateRange, isCumulative]);

    const handleZoomIn = () => setZoomLevel(prev => Math.min(prev * 1.5, 20));
    const handleZoomOut = () => setZoomLevel(prev => Math.max(prev / 1.5, 0.5));
    const handleZoomReset = () => {
        setZoomLevel(1);
        setPanOffset({ x: 0, y: 0 });
    };

    return (
        <div ref={wrapperRef} style={{ width: '100%', minHeight: '500px', position: 'relative', display: 'flex', gap: '12px' }}>
            {/* Controls on the left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '120px' }}>
                {/* Dataset Selector */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Dataset</label>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '6px' }}>
                        <button
                            onClick={() => setDatasetMode('incidents')}
                            className={`selection-button ${datasetMode === 'incidents' ? 'active' : ''}`}
                        >
                            Incidents
                        </button>
                        <button
                            onClick={() => setDatasetMode('damage')}
                            className={`selection-button ${datasetMode === 'damage' ? 'active' : ''}`}
                        >
                            Damage Sites
                        </button>
                    </div>
                </div>

                {/* Category Filter with View Mode Toggle Below - Only show for Incidents */}
                {datasetMode === 'incidents' && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>Category</label>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '6px' }}>
                    {['all', 'Food System', 'Health Care'].map(option => (
                        <button
                            key={option}
                            onClick={() => setSelectedType(option)}
                            className={`selection-button ${selectedType === option ? 'active' : ''}`}
                        >
                            {option === 'all' ? 'All Types' : option}
                        </button>
                    ))}
                    </div>

                    {/* View Mode Toggle - Under Category */}
                    <div style={{ marginTop: '12px' }}>
                        <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>View</label>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: '6px', marginTop: '6px' }}>
                        <button
                            onClick={() => setViewMode('full')}
                            className={`selection-button ${viewMode === 'full' ? 'active' : ''}`}
                        >
                            Full Period
                        </button>
                        <button
                            onClick={() => { setViewMode('daily'); setIsCumulative(false); }}
                            className={`selection-button ${viewMode === 'daily' && !isCumulative ? 'active' : ''}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => { setViewMode('daily'); setIsCumulative(true); }}
                            className={`selection-button ${viewMode === 'daily' && isCumulative ? 'active' : ''}`}
                        >
                            Cumulative
                        </button>
                        </div>
                    </div>
                </div>
                )}
            </div>

            {/* Map area on the right - starts at same height as category buttons */}
            <div style={{ width: '80%', display: 'flex', flexDirection: 'column', position: 'relative' }}>


            {/* Zoom Controls */}
            <div style={{ 
                position: 'absolute', 
                top: '0px', 
                right: '10px', 
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                alignItems: 'center'
            }}>
                <button 
                    onClick={handleZoomIn}
                    className="control-button"
                    style={{ width: '50px', fontSize: '16px' }}
                >
                    +
                </button>
                <button 
                    onClick={handleZoomOut}
                    className="control-button"
                    style={{ width: '50px', fontSize: '16px' }}
                >
                    −
                </button>
                <button 
                    onClick={handleZoomReset}
                    className="control-button"
                    style={{ width: '50px' }}
                >
                    Reset
                </button>
                <div style={{
                    padding: '10px 16px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--text-secondary)',
                    borderRadius: '4px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    minWidth: '80px'
                }}>
                    Zoom: {zoomLevel.toFixed(1)}x
                </div>
            </div>
            
            {/* Date Display and Map Container - Fixed height to prevent shifting */}
            <div ref={mapContainerRef} style={{ minHeight: '430px' }}>
                {/* Current Date Display - Prominent at top when in monthly view */}
                <div style={{ height: '30px', marginBottom: '6px' }}>
                    {viewMode === 'daily' && selectedDate && (
                        <div style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            color: 'var(--text-primary)',
                            padding: '8px 0',
                            textAlign: 'center'
                        }}>
                            {selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                        </div>
                    )}
                </div>
                
                <svg ref={svgRef} style={{ width: '100%', height: '400px' }} />

                {/* Timeline Controls - Below the map (show only for incidents) */}
                {datasetMode === 'incidents' && viewMode === 'daily' && dateRange.min && dateRange.max && (
                    <div className="chapter2-controls">
                        <button
                            className="chapter2-icon-button"
                            onClick={() => setIsPlaying(!isPlaying)}
                            aria-label={isPlaying ? 'Pause autoplay' : 'Play autoplay'}
                        >
                            {isPlaying ? '⏸' : '▶'}
                        </button>
                        <button
                            className="chapter2-icon-button"
                            onClick={() => setSelectedDate(dateRange.min)}
                            aria-label="Reset to start"
                        >
                            ⏮
                        </button>
                        <input
                            className="chapter2-range"
                            type="range"
                            min="0"
                            max={(() => {
                                const start = new Date(dateRange.min.getFullYear(), dateRange.min.getMonth(), 1);
                                const end = new Date(dateRange.max.getFullYear(), dateRange.max.getMonth(), 1);
                                return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                            })()}
                            value={selectedDate ? (() => {
                                const start = new Date(dateRange.min.getFullYear(), dateRange.min.getMonth(), 1);
                                const current = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
                                return (current.getFullYear() - start.getFullYear()) * 12 + (current.getMonth() - start.getMonth());
                            })() : 0}
                            onChange={e => {
                                const months = parseInt(e.target.value);
                                const newDate = new Date(dateRange.min);
                                newDate.setMonth(newDate.getMonth() + months);
                                setSelectedDate(newDate);
                                setIsPlaying(false);
                            }}
                            style={{
                                '--range-progress': selectedDate ? (() => {
                                    const start = new Date(dateRange.min.getFullYear(), dateRange.min.getMonth(), 1);
                                    const end = new Date(dateRange.max.getFullYear(), dateRange.max.getMonth(), 1);
                                    const current = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
                                    const totalMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
                                    const currentMonths = (current.getFullYear() - start.getFullYear()) * 12 + (current.getMonth() - start.getMonth());
                                    return `${(currentMonths / totalMonths) * 100}%`;
                                })() : '0%'
                            }}
                        />
                    </div>
                )}
            </div>
            </div>
        </div>
    );
};

export default GeoChart