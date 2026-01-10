import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import NearMeIcon from '@mui/icons-material/NearMe';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';

export function RidgeChart({ isDark = true, guideActive = false }) {
        // Track if any original country was 'Gaza' for legend/tooltip display
        const originalCountryRef = useRef({ hasGaza: false });
    const svgRef = useRef(null);
    const wrapperRef = useRef(null);
    const dataRef = useRef([]);
    const animationPlayedRef = useRef(false);
    const [selectedEventTypes, setSelectedEventTypes] = useState(new Set());
    const [availableEventTypes, setAvailableEventTypes] = useState([]);

    useEffect(() => {
        let isMounted = true;

        // Fetch data - CSV with columns: WEEK, country, event_type, events
        const fetchData = async () => {
            try {
                const url = new URL('../Dataset/events_per_week.csv', import.meta.url).href;
                const response = await fetch(url);
                const text = await response.text();

                const rows = text.trim().split('\n').slice(1);
                const parsed = rows.map((row) => {
                    const [week, country, event_type, events] = row.split(',');
                    return {
                        week: week?.trim(),
                        country: country?.trim(),
                        event_type: event_type?.trim(),
                        events: +events || 0,
                    };
                });

                if (isMounted) {
                    dataRef.current = parsed;

                    // Extract unique event types
                    const eventTypes = Array.from(new Set(parsed.map(d => d.event_type))).sort();
                    setAvailableEventTypes(eventTypes);

                    // Set all event types as selected by default
                    setSelectedEventTypes(new Set(eventTypes));
                }
            } catch (error) {
                console.warn('Ridge plot data not loaded yet:', error.message);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        if (availableEventTypes.length === 0) return;

        // Reset animation when event types change
        animationPlayedRef.current = false;

        const render = () => {
            const data = dataRef.current;
            if (!svgRef.current || !wrapperRef.current || data.length === 0) return;

            // Filter data by selected event types
            const filteredData = data.filter(d => selectedEventTypes.has(d.event_type));

            const parseDate = d3.timeParse('%Y-%m-%d');

            const containerWidth = wrapperRef.current.getBoundingClientRect().width || 800;
            const width = Math.max(Math.min(containerWidth, 1100), 360);
            const height = 400;
            const margin = { top: 40, right: 40, bottom: 60, left: 60 };

            const svg = d3
                .select(svgRef.current)
                .attr('viewBox', `0 0 ${width} ${height}`)
                .attr('preserveAspectRatio', 'xMidYMid meet');

            svg.selectAll('*').remove();

            const innerWidth = width - margin.left - margin.right;
            const innerHeight = height - margin.top - margin.bottom;
            if (innerWidth <= 0 || innerHeight <= 0) return;

            // Parse dates and aggregate by country and week
            const aggregatedByCountry = d3.rollup(
                filteredData,
                (v) => d3.sum(v, (d) => d.events),
                (d) => d.country,
                (d) => parseDate(d.week)
            );

            // Also aggregate by country, week, and event_type for tooltip breakdown
            const aggregatedByCountryType = d3.rollup(
                filteredData,
                (v) => d3.sum(v, (d) => d.events),
                (d) => d.country,
                (d) => parseDate(d.week),
                (d) => d.event_type
            );

            const countries = Array.from(aggregatedByCountry.keys());
            const allWeeks = new Set();
            for (const [, weekData] of aggregatedByCountry) {
                for (const week of weekData.keys()) {
                    allWeeks.add(week);
                }
            }
            const weeks = Array.from(allWeeks).sort((a, b) => a - b);

            // X scale: time - use fixed domain
            const x = d3
                .scaleUtc()
                .domain([new Date(2023, 0, 1), new Date(2025, 11, 31)])
                .range([margin.left, width - margin.right]);

            // Get month range for x-axis ticks starting from Jan 2023 (same as line chart)
            const startDate = new Date(2023, 0, 1); // Jan 2023
            const endDate = new Date(2025, 10, 1); // Nov 2025
            const monthRange = d3.timeMonth
                .range(startDate, endDate)
                .filter((d, i) => i % 3 === 0);

            // Compute global maximum weekly events across all data (fixed scale)
            const aggregatedAll = d3.rollup(
                dataRef.current,
                (v) => d3.sum(v, (d) => d.events),
                (d) => d.country,
                (d) => parseDate(d.week)
            );
            let globalMaxWeekly = 0;
            for (const [, weekMap] of aggregatedAll) {
                for (const [, sum] of weekMap) {
                    if (Number.isFinite(sum) && sum > globalMaxWeekly) globalMaxWeekly = sum;
                }
            }
            if (!globalMaxWeekly) globalMaxWeekly = 1;

            const getColor = (country) => {
                if (country === 'Gaza') return 'var(--color-Palestine)';
                if (country === 'Israel') return 'var(--color-Israel)';
                return 'var(--text-primary)';
            };

            // Tooltip setup (same style as line chart)
            const tooltip = d3
                .select('body')
                .selectAll('.chart-tooltip')
                .data([null])
                .join('div')
                .attr('class', 'chart-tooltip')
                .attr('role', 'tooltip')
                .style('position', 'absolute')
                .style('pointer-events', 'none')
                .style('z-index', 10)
                .style('opacity', 0)
                .style('visibility', 'hidden')
                .style('transition', 'opacity 120ms ease, visibility 120ms ease');

            // Draw ridge for each country using fixed amplitude normalized by global max
            if (filteredData.length > 0 && weeks.length > 0) {
                const maxRidgeHeightPx = Math.min(500, innerHeight * 0.8);
                const yRidge = d3
                    .scaleLinear()
                    .domain([0, globalMaxWeekly])
                    .range([0, maxRidgeHeightPx]);

                const baselineY = height - margin.bottom - innerHeight * 0.2;

                // Ensure Israel is drawn after Gaza (in front)
                // Draw order: Gaza, then Israel
                const drawOrder = ['Gaza', 'Israel'];
                const uniqueCountries = Array.from(new Set(countries));
                const orderedCountries = [
                    ...drawOrder.filter((c) => uniqueCountries.includes(c)),
                    ...uniqueCountries.filter((c) => !drawOrder.includes(c))
                ];

                for (const country of orderedCountries) {
                    const weekData = aggregatedByCountry.get(country) || new Map();
                    const series = weeks.map((week) => ({
                        week,
                        value: weekData.get(week) || 0,
                    }));
                    
                    const area = d3
                        .area()
                        .x((d) => x(d.week))
                        .y0(() => baselineY)
                        .y1((d) => baselineY - yRidge(d.value));

                    const pathElement = svg
                        .append('path')
                        .datum(series)
                        .attr('fill', getColor(country))
                        .attr('fill-opacity', animationPlayedRef.current ? 0.6 : 0)
                        .attr('stroke', getColor(country))
                        .attr('stroke-width', 2)
                        .attr('d', area);

                    // Setup animation: set stroke-dasharray to make ridge invisible initially
                    const pathNode = pathElement.node();
                    const pathLength = pathNode.getTotalLength();
                    pathElement
                        .attr('stroke-dasharray', pathLength)
                        .attr(
                            'stroke-dashoffset',
                            animationPlayedRef.current ? 0 : pathLength
                        );
                }
            }

            // Focus line and overlay for tooltip interaction
            const focusLayer = svg.append('g').style('display', 'none');
            const focusLine = focusLayer
                .append('line')
                .attr('y1', margin.top)
                .attr('y2', height - margin.bottom)
                .attr('stroke', 'var(--text-primary)')
                .attr('stroke-opacity', 0.25)
                .attr('stroke-width', 1.2);

            const overlay = svg
                .append('rect')
                .attr('x', x(new Date(2023, 0, 1)))
                .attr('y', margin.top)
                .attr('width', x(new Date(2025, 11, 31)) - x(new Date(2023, 0, 1)))
                .attr('height', height - margin.top - margin.bottom)
                .attr('fill', 'transparent')
                .style('cursor', 'crosshair');

            const formatDate = d3.timeFormat('%b %d, %Y');
            const bisectDate = d3.bisector((d) => d).center;

            const countriesForTooltip = ['Gaza', 'Israel'];

            const updateTooltip = (event) => {
                if (weeks.length === 0) return;
                const [mx] = d3.pointer(event, svg.node());
                const hoveredDate = x.invert(mx);
                const nearestIndex = bisectDate(weeks, hoveredDate);
                const targetWeek = weeks[Math.max(0, Math.min(nearestIndex, weeks.length - 1))];
                if (!targetWeek) return;

                const entries = [];
                for (const displayCountry of countriesForTooltip) {
                    const dataCountry = displayCountry;
                    const selectedMap = aggregatedByCountry.get(dataCountry) || new Map();
                    const totalMap = aggregatedAll.get(dataCountry) || new Map();
                    const typeNested = aggregatedByCountryType.get(dataCountry) || new Map();
                    const typeMap = typeNested.get(targetWeek) || new Map();

                    const selectedCount = selectedMap.get(targetWeek) || 0;
                    const totalCount = totalMap.get(targetWeek) || 0;

                    const typeBreakdown = Array.from(selectedEventTypes).sort().map((et) => {
                        const val = typeMap.get(et) || 0;
                        const pct = selectedCount > 0 ? (val / selectedCount) * 100 : 0;
                        return { eventType: et, value: val, pct };
                    });

                    entries.push({ country: displayCountry, selectedCount, totalCount, typeBreakdown });
                }

                focusLayer.style('display', null);
                focusLine.attr('x1', x(targetWeek)).attr('x2', x(targetWeek));

                const tooltipHtml = `
                    <div class=\"tooltip-date\">${formatDate(targetWeek)}</div>
                    ${entries
                        .map((e) => {
                            const header = `
                                <div class=\"tooltip-entry\">
                                    <span class=\"tooltip-square\" style=\"border: 1px solid ${getColor(e.country)}; background-color: ${getColor(e.country)}; opacity: 0.6; border-radius: 2px;\"></span>
                                    <span class=\"tooltip-country\">${e.country}:</span>
                                    <span class=\"tooltip-fatalities\">${e.selectedCount} selected</span>
                                </div>
                            `;
                            const details = e.typeBreakdown
                                .map((tb) => `
                                    <div class=\"tooltip-detail\" style=\"display:flex; align-items:center; justify-content:space-between; gap:10px;\">
                                        <span class=\"tooltip-type\">${tb.eventType}</span>
                                        <span class=\"tooltip-pct\" style=\"font-weight:700;\">${tb.value} (${tb.pct.toFixed(1)}%)</span>
                                    </div>
                                `)
                                .join('');
                            return header + details;
                        })
                        .join('')}
                `;

                tooltip
                    .style('opacity', 1)
                    .style('visibility', 'visible')
                    .html(tooltipHtml)
                    .style('left', `${event.pageX + 12}px`)
                    .style('top', `${event.pageY - 20}px`);
            };

            overlay
                .on('mouseenter', () => {
                    focusLayer.style('display', null);
                })
                .on('mousemove', (event) => {
                    updateTooltip(event);
                })
                .on('mouseleave', () => {
                    focusLayer.style('display', 'none');
                    tooltip.style('opacity', 0).style('visibility', 'hidden');
                });

            // Add baseline
            svg
                .append('line')
                .attr('x1', margin.left)
                .attr('x2', width - margin.right)
                .attr('y1', height - margin.bottom - innerHeight * 0.2)
                .attr('y2', height - margin.bottom - innerHeight * 0.2)
                .attr('stroke', 'var(--text-primary)')
                .attr('stroke-opacity', 0.3)
                .attr('stroke-width', 1.5);

            // X axis
            svg
                .append('g')
                .attr('transform', `translate(0,${height - margin.bottom})`)
                .call(d3.axisBottom(x).tickValues(monthRange).tickFormat(d3.timeFormat('%b %Y')).tickSizeOuter(0))
                .call((g) => g.selectAll('text').style('fill', 'var(--text-primary)').style('font-size', '11px'))
                .call((g) => g.selectAll('.tick line').style('stroke', 'var(--text-primary)').style('stroke-opacity', 0.25))
                .call((g) => g.select('.domain').style('stroke', 'var(--text-primary)').style('stroke-opacity', 0.4));

            // X axis label
            svg
                .append('text')
                .attr('x', width / 2)
                .attr('y', height - 12)
                .attr('text-anchor', 'middle')
                .style('fill', 'var(--text-primary)')
                .style('font-size', '12px');

            // Top-left chart label (like line chart)
            svg
                .append('text')
                .attr('x', margin.left)
                .attr('y', margin.top - 12)
                .attr('font-size', 12)
                .attr('font-weight', 600)
                .style('fill', 'var(--text-primary)')
                .text('Events timeline (2023-2025)');

            // Legend - always show for both countries
            const legendX = width - margin.right - 140;
            const legendY = margin.top + 10;
            // Legend: always show 'Gaza' and 'Israel'
            const legendCountries = ['Gaza', 'Israel'];

            for (let i = 0; i < legendCountries.length; i++) {
                const displayCountry = legendCountries[i];
                svg
                    .append('rect')
                    .attr('x', legendX)
                    .attr('y', legendY + i * 20)
                    .attr('width', 12)
                    .attr('height', 12)
                    .attr('rx', 2)
                    .style('fill', getColor(displayCountry))
                    .style('fill-opacity', 0.6)
                    .style('stroke', getColor(displayCountry))
                    .style('stroke-width', 1);

                svg
                    .append('text')
                    .attr('x', legendX + 18)
                    .attr('y', legendY + i * 20 + 10)
                    .style('fill', 'var(--text-primary)')
                    .style('font-size', '11px')
                    .text(displayCountry);
            }

            // Show message when no event types selected
            if (selectedEventTypes.size === 0) {
                svg
                    .append('text')
                    .attr('x', width / 2)
                    .attr('y', height / 2 - 30)
                    .attr('text-anchor', 'middle')
                    .style('fill', 'var(--text-primary)')
                    .style('font-size', '16px')
                    .style('font-style', 'italic')
                    .style('opacity', 0.6)
                    .text('Select at least one event type');
            }

            // Remove centered title; label added top-left
        };

        render();

        // Setup Intersection Observer to trigger animation when chart comes into view
        const observerOptions = {
            threshold: 0.3 // Trigger when 30% visible
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !animationPlayedRef.current) {
                    animationPlayedRef.current = true;
                    // Trigger ridge animation (stroke and fill together)
                    d3.select(svgRef.current)
                        .selectAll('path[fill]')
                        .transition()
                        .duration(1500)
                        .attr('stroke-dashoffset', 0)
                        .attr('fill-opacity', 0.6);
                }
            });
        }, observerOptions);

        if (wrapperRef.current) {
            observer.observe(wrapperRef.current);
        }

        let resizeObserver;
        if (wrapperRef.current) {
            resizeObserver = new ResizeObserver(() => render());
            resizeObserver.observe(wrapperRef.current);
        }

        window.addEventListener('resize', render);

        return () => {
            observer.disconnect();
            resizeObserver?.disconnect();
            window.removeEventListener('resize', render);
        };
    }, [selectedEventTypes, availableEventTypes]);

    const handleEventTypeToggle = (eventType) => {
        setSelectedEventTypes((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(eventType)) {
                newSet.delete(eventType);
            } else {
                newSet.add(eventType);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        setSelectedEventTypes(new Set(availableEventTypes));
    };

    const handleClearAll = () => {
        setSelectedEventTypes(new Set());
    };

    return (
        <div style={{ display: 'flex', gap: '20px', width: '100%' }}>
            {/* Left sidebar for filters */}
            <div style={{ 
                minWidth: '100px', 
                maxWidth: '100px',
                padding: '15px', 
                backgroundColor: 'var(--bg-secondary)', 
                borderRadius: '8px',
                alignSelf: 'flex-start',
                position: 'sticky',
                top: '20px',
                zIndex: 21000,
            }}>
                <div style={{ marginBottom: '15px', fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>
                    Event Types
                </div>
                <div style={{ marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                        onClick={handleSelectAll}
                        className="control-button"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                    >
                        Select All
                    </button>
                    <button
                        onClick={handleClearAll}
                        className="control-button"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                    >
                        Clear All
                    </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {availableEventTypes.map((eventType, index) => (
                        <label
                            key={eventType}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                color: 'var(--text-primary)',
                                fontSize: '12px',
                                lineHeight: '1.3',
                                minHeight: '20px',
                            }}
                        >
                            <input
                                type="checkbox"
                                className="theme-checkbox"
                                checked={selectedEventTypes.has(eventType)}
                                onChange={() => handleEventTypeToggle(eventType)}
                                style={{
                                    marginRight: '8px',
                                    marginTop: '2px',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                }}
                            />
                            <span style={{ overflowWrap: 'break-word', flex: 1 }}>{eventType}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Chart container */}
            <div ref={wrapperRef} style={{ flex: 1, minWidth: 0, overflow: 'visible', position: 'relative' }}>
                {/* Guide banners for onhover tooltip and events selection */}
                {guideActive && (
                    <>
                        <div
                            style={{
                                position: 'absolute',
                                left: '58%',
                                top: '10%',
                                zIndex: 21000,
                                display: 'flex',
                                alignItems: 'center',
                                background: 'var(--bg-secondary, #23272f)',
                                color: 'var(--color-details, #90caf9)',
                                borderRadius: 10,
                                padding: '8px 18px',
                                fontSize: '1.08rem',
                                fontWeight: 500,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                                pointerEvents: 'none',
                            }}
                        >
                            <NearMeIcon style={{ fontSize: 22, marginRight: 8, transform: 'scaleX(-1)' }} />
                            Hover tooltip
                        </div>
                        <div
                            style={{
                                position: 'absolute',
                                left: '-2%',
                                top: '30%',
                                zIndex: 20999,
                                display: 'flex',
                                alignItems: 'center',
                                background: 'var(--bg-secondary, #23272f)',
                                color: 'var(--color-details, #90caf9)',
                                borderRadius: 10,
                                padding: '8px 18px',
                                fontSize: '1.08rem',
                                fontWeight: 500,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                                pointerEvents: 'none',
                            }}
                        >
                            <FilterAltOutlinedIcon style={{ fontSize: 22, marginRight: 8 }} />
                            Events selection
                        </div>
                    </>
                )}
                <svg ref={svgRef} style={{ width: '100%', height: 420, display: 'block', zIndex: 1 }} />
            <div style={{
                position: 'absolute',
                right: 12,
                bottom: 0,
                fontSize: '0.95rem',
                color: isDark ? 'var(--text-secondary)' : 'var(--text-secondary)',
                opacity: 0.5,
                padding: '2px 10px',
                borderRadius: '12px',
                fontFamily: 'var(--font-serif)',
                zIndex: 2
            }}>
                Data source: <strong>ACLED</strong>
            </div>
            </div>
            
        </div>
    );
}

export default RidgeChart;