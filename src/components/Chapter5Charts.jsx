import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import gazaBoundaries from '../GazaMap/GazaStrip_MunicipalBoundaries_new.json';
import incidentsData from '../Dataset/processed/Combined_Incidents_GeoChart.csv?raw';

const GeoChart = ({ isDark }) => {
    const svgRef = useRef();
    const wrapperRef = useRef();
    const [selectedType, setSelectedType] = useState('all');
    const [zoomLevel, setZoomLevel] = useState(1);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [viewMode, setViewMode] = useState('full'); // 'full' or 'daily'
    const [selectedDate, setSelectedDate] = useState(null);
    const [dateRange, setDateRange] = useState({ min: null, max: null });
    const [isPlaying, setIsPlaying] = useState(false);
    const [isCumulative, setIsCumulative] = useState(false); // New cumulative state
    const animationInterval = useRef(null);

    useEffect(() => {
        if (!svgRef.current || !wrapperRef.current || !gazaBoundaries) return;

        const width = wrapperRef.current.offsetWidth || 900;
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
            .attr('fill', isDark ? '#444' : '#e0e0e0')
            .attr('stroke', isDark ? '#666' : '#999')
            .attr('stroke-width', 1.5);

        // Color scale for incident types
        const colorScale = d3.scaleOrdinal()
            .domain(['Food System', 'Health Care'])
            .range(['#3b82f6', '#ef4444']);

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

        // Draw incident points
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
            .attr('fill', isDark ? '#D9D9D6' : '#25282A')
            .text(`Total incidents: ${incidents.length}`);

        // Cleanup
        return () => {
            d3.selectAll('.chart-tooltip').remove();
        };

    }, [isDark, selectedType, zoomLevel, panOffset, viewMode, selectedDate]);

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
        <div ref={wrapperRef} style={{ width: '100%', minHeight: '500px', position: 'relative' }}>
            {/* Filter Controls */}
            <div style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '6px',
                flexWrap: 'wrap',
                alignItems: 'flex-start'
            }}>
                {/* Category Filter */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>Category</label>
                    <select
                        value={selectedType}
                        onChange={e => setSelectedType(e.target.value)}
                        className="chapter2-controls-select"
                        style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            border: '1px solid var(--text-secondary)',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600'
                        }}
                    >
                        <option value="all">All Types</option>
                        <option value="Food System">Food System</option>
                        <option value="Health Care">Health Care</option>
                    </select>
                </div>

                {/* View Mode Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary)' }}>View</label>
                    <button
                        onClick={() => setViewMode('full')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '4px',
                            border: viewMode === 'full' ? '2px solid var(--color-link-hover)' : '1px solid var(--text-secondary)',
                            backgroundColor: viewMode === 'full' ? 'var(--color-link-hover)' : 'var(--bg-primary)',
                            color: viewMode === 'full' ? 'var(--bg-primary)' : 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Full Period
                    </button>
                    <button
                        onClick={() => setViewMode('daily')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '4px',
                            border: viewMode === 'daily' ? '2px solid var(--color-link-hover)' : '1px solid var(--text-secondary)',
                            backgroundColor: viewMode === 'daily' ? 'var(--color-link-hover)' : 'var(--bg-primary)',
                            color: viewMode === 'daily' ? 'var(--bg-primary)' : 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        Monthly
                    </button>
                    
                    {/* Cumulative Toggle - Centered with buttons */}
                    {viewMode === 'daily' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                            <input
                                type="checkbox"
                                id="cumulative-toggle"
                                checked={isCumulative}
                                onChange={e => setIsCumulative(e.target.checked)}
                                style={{
                                    cursor: 'pointer',
                                    width: '14px',
                                    height: '14px',
                                    accentColor: 'var(--color-link-hover)'
                                }}
                            />
                            <label
                                htmlFor="cumulative-toggle"
                                style={{
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}
                            >
                                Cumulative
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {/* Zoom Controls */}
            <div style={{ 
                position: 'absolute', 
                top: '10px', 
                right: '10px', 
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: '3px'
            }}>
                <button 
                    onClick={handleZoomIn}
                    style={{
                        padding: '5px 8px',
                        backgroundColor: isDark ? '#333' : '#fff',
                        color: isDark ? '#fff' : '#000',
                        border: `1px solid ${isDark ? '#666' : '#ccc'}`,
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold'
                    }}
                >
                    +
                </button>
                <button 
                    onClick={handleZoomOut}
                    style={{
                        padding: '5px 8px',
                        backgroundColor: isDark ? '#333' : '#fff',
                        color: isDark ? '#fff' : '#000',
                        border: `1px solid ${isDark ? '#666' : '#ccc'}`,
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold'
                    }}
                >
                    −
                </button>
                <button 
                    onClick={handleZoomReset}
                    style={{
                        padding: '5px 8px',
                        backgroundColor: isDark ? '#333' : '#fff',
                        color: isDark ? '#fff' : '#000',
                        border: `1px solid ${isDark ? '#666' : '#ccc'}`,
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 'bold'
                    }}
                >
                    Reset
                </button>
                <div style={{
                    padding: '5px',
                    backgroundColor: isDark ? '#333' : '#fff',
                    color: isDark ? '#fff' : '#000',
                    border: `1px solid ${isDark ? '#666' : '#ccc'}`,
                    borderRadius: '4px',
                    fontSize: '11px',
                    textAlign: 'center'
                }}>
                    {zoomLevel.toFixed(1)}x
                </div>
            </div>
            
            {/* Current Date Display - Prominent at top when in monthly view */}
            {viewMode === 'daily' && selectedDate && (
                <div style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                    padding: '8px 0',
                    textAlign: 'center',
                    marginBottom: '6px'
                }}>
                    {selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </div>
            )}
            
            <svg ref={svgRef} style={{ width: '100%', height: '400px' }} />

            {/* Timeline Controls - Below the map */}
            {viewMode === 'daily' && dateRange.min && dateRange.max && (
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
                    <span className="chapter2-year-label">Month</span>
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
    );
};

export default GeoChart;