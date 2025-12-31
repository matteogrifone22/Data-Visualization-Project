import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export function Chapter1LineChart({ isDark = true }) {
    const svgRef = useRef(null);
    const wrapperRef = useRef(null);
    const dataRef = useRef([]);
    const selectedCountryRef = useRef(null);
    const animationPlayedRef = useRef(false);
    const allCirclesRef = useRef([]);

    useEffect(() => {
        let isMounted = true;
        const parseDate = d3.timeParse('%Y-%m');
        const formatDate = d3.timeFormat('%B %Y');

        const render = () => {
            const data = dataRef.current;
            if (!svgRef.current || !wrapperRef.current || data.length === 0) return;

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

            const containerWidth = wrapperRef.current.getBoundingClientRect().width || 800;
            const width = Math.max(Math.min(containerWidth, 1100), 360);
            const height = 440;
            const margin = { top: 32, right: 110, bottom: 44, left: 64 };

            const svg = d3
                .select(svgRef.current)
                .attr('viewBox', `0 0 ${width} ${height}`)
                .attr('preserveAspectRatio', 'xMidYMid meet');

            svg.selectAll('*').remove();

            const innerWidth = width - margin.left - margin.right;
            const innerHeight = height - margin.top - margin.bottom;
            if (innerWidth <= 0 || innerHeight <= 0) return;

            const x = d3
                .scaleUtc()
                .domain(d3.extent(data, (d) => d.date))
                .range([margin.left, width - margin.right]);

            const y = d3
                .scaleLinear()
                .domain([0, d3.max(data, (d) => d.fatalities) || 0])
                .nice()
                .range([height - margin.bottom, margin.top]);

            const grouped = d3.group(data, (d) => d.country);
            const seriesByCountry = new Map();
            for (const [country, values] of grouped.entries()) {
                seriesByCountry.set(country, [...values].sort((a, b) => a.date - b.date));
            }

            const uniqueDates = Array.from(new Set(data.map((d) => +d.date)))
                .sort(d3.ascending)
                .map((t) => new Date(t));
            const bisectDate = d3.bisector((d) => d).center;
            const bisectSeries = d3.bisector((d) => d.date).center;

            const monthRange = d3.timeMonth
                .range(d3.min(data, (d) => d.date), d3.timeMonth.offset(d3.max(data, (d) => d.date), 1))
                .filter((d, i) => i % 3 === 0);

            const getColor = (country) => {
                if (country === 'Israel') return 'var(--color-Israel)';
                if (country === 'Palestine') return 'var(--color-Palestine)';
                return 'var(--text-primary)';
            };

            const line = d3
                .line()
                .defined((d) => Number.isFinite(d.fatalities))
                .x((d) => x(d.date))
                .y((d) => y(d.fatalities));

            svg
                .append('g')
                .attr('transform', `translate(0,${height - margin.bottom})`)
                .call(d3.axisBottom(x).tickValues(monthRange).tickFormat(d3.timeFormat('%b %Y')).tickSizeOuter(0))
                .call((g) => g.selectAll('text').style('fill', 'var(--text-primary)').style('font-size', '11px'))
                .call((g) => g.selectAll('.tick line').style('stroke', 'var(--text-primary)').style('stroke-opacity', 0.25))
                .call((g) => g.select('.domain').style('stroke', 'var(--text-primary)').style('stroke-opacity', 0.4));

            svg
                .append('g')
                .attr('transform', `translate(${margin.left},0)`)
                .call(d3.axisLeft(y).ticks(6).tickSize(-innerWidth).tickSizeOuter(0))
                .call((g) => g.selectAll('text').style('fill', 'var(--text-primary)'))
                .call((g) => g.selectAll('.tick line').style('stroke', 'var(--text-primary)').style('stroke-opacity', 0.15))
                .call((g) => g.select('.domain').style('stroke', 'none'));

            // Collect all circles for z-ordering
            allCirclesRef.current = [];

            const applySelectionStyles = () => {
                for (const country of seriesByCountry.keys()) {
                    const isSelected = selectedCountryRef.current === country;
                    const isOther = selectedCountryRef.current && selectedCountryRef.current !== country;

                    svg.selectAll(`path[data-country="${country}"]`)
                        .style('opacity', isOther ? 0.15 : 1)
                        .attr('stroke-width', isSelected ? 3.5 : 2.5);
                }

                // Redraw circles based on selection state
                svg.selectAll('circle').remove();
                allCirclesRef.current.sort((a, b) => a.fatalities - b.fatalities);
                for (const circle of allCirclesRef.current) {
                    // Only draw circles for selected country if one is selected, otherwise draw all
                    if (selectedCountryRef.current && selectedCountryRef.current !== circle.country) {
                        continue;
                    }
                    svg
                        .append('circle')
                        .attr('cx', x(circle.point.date))
                        .attr('cy', y(circle.point.fatalities))
                        .attr('r', 4)
                        .attr('data-country', circle.country)
                        .style('fill', getColor(circle.country))
                        .style('cursor', 'pointer')
                        .style('opacity', 1)
                        .on('click', function (event) {
                            event.stopPropagation();
                            selectedCountryRef.current = selectedCountryRef.current === circle.country ? null : circle.country;
                            applySelectionStyles();
                        });
                }
            };

            for (const [country, series] of seriesByCountry.entries()) {
                const pathElement = svg
                    .append('path')
                    .datum(series)
                    .attr('fill', 'none')
                    .style('stroke', getColor(country))
                    .attr('stroke-width', 2.5)
                    .attr('d', line)
                    .attr('data-country', country)
                    .style('cursor', 'pointer')
                    .on('click', function (event) {
                        event.stopPropagation();
                        selectedCountryRef.current = selectedCountryRef.current === country ? null : country;
                        applySelectionStyles();
                    });

                // Setup animation: set stroke-dasharray to make line invisible initially
                const pathNode = pathElement.node();
                const pathLength = pathNode.getTotalLength();
                pathElement
                    .attr('stroke-dasharray', pathLength)
                    .attr(
                        'stroke-dashoffset',
                        animationPlayedRef.current ? 0 : pathLength
                    );

                // Collect all points (intermediate + end) for this country
                for (const point of series) {
                    allCirclesRef.current.push({ country, point, fatalities: point.fatalities });
                }

                const labelOffset = country === 'Israel' ? 10 : -10;
                svg
                    .append('text')
                    .attr('x', x(series[series.length - 1].date) + 8)
                    .attr('y', y(series[series.length - 1].fatalities) + labelOffset)
                    .attr('dy', '0.32em')
                    .style('fill', getColor(country))
                    .attr('font-size', 12)
                    .attr('font-weight', 600)
                    .style('cursor', 'pointer')
                    .on('click', function (event) {
                        event.stopPropagation();
                        selectedCountryRef.current = selectedCountryRef.current === country ? null : country;
                        applySelectionStyles();
                    })
                    .text(country);
            }

            // Draw all circles sorted by fatality (highest on top)
            allCirclesRef.current.sort((a, b) => a.fatalities - b.fatalities);
            for (const circle of allCirclesRef.current) {
                // Only draw circles for selected country if one is selected, otherwise draw all
                if (selectedCountryRef.current && selectedCountryRef.current !== circle.country) {
                    continue;
                }
                svg
                    .append('circle')
                    .attr('cx', x(circle.point.date))
                    .attr('cy', y(circle.point.fatalities))
                    .attr('r', 4)
                    .attr('data-country', circle.country)
                    .style('fill', getColor(circle.country))
                    .style('cursor', 'pointer')
                    .style('opacity', animationPlayedRef.current ? 1 : 0)
                    .on('click', function (event) {
                        event.stopPropagation();
                        selectedCountryRef.current = selectedCountryRef.current === circle.country ? null : circle.country;
                        applySelectionStyles();
                    });
            }

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
                .attr('x', margin.left)
                .attr('y', margin.top)
                .attr('width', innerWidth)
                .attr('height', innerHeight)
                .attr('fill', 'transparent')
                .style('cursor', 'crosshair')
                .on('click', () => {
                    selectedCountryRef.current = null;
                    applySelectionStyles();
                });

            const updateTooltip = (event) => {
                const [mx] = d3.pointer(event, svg.node());
                const hoveredDate = x.invert(mx);
                const nearestIndex = bisectDate(uniqueDates, hoveredDate);
                const targetDate = uniqueDates[nearestIndex];
                if (!targetDate) return;

                const entries = [];
                for (const [country, series] of seriesByCountry.entries()) {
                    const idx = bisectSeries(series, targetDate);
                    const datum = series[idx];
                    if (!datum) continue;
                    entries.push({ country, datum });
                }
                entries.sort((a, b) => (a.country === 'Palestine' ? -1 : 1) - (b.country === 'Palestine' ? -1 : 1));

                // Filter out non-selected countries when one is selected
                const filteredEntries = selectedCountryRef.current
                    ? entries.filter(e => e.country === selectedCountryRef.current)
                    : entries;

                if (filteredEntries.length === 0) {
                    focusLayer.style('display', 'none');
                    return;
                }

                focusLayer.style('display', null);
                focusLine.attr('x1', x(targetDate)).attr('x2', x(targetDate));

                focusLayer
                    .selectAll('circle')
                    .data(filteredEntries, (d) => d.country)
                    .join(
                        (enter) =>
                            enter
                                .append('circle')
                                .attr('r', 6)
                                .attr('stroke', 'var(--bg-primary)')
                                .attr('stroke-width', 2)
                                .style('fill', (d) => getColor(d.country)),
                        (update) => update,
                        (exit) => exit.remove()
                    )
                    .attr('cx', (d) => x(d.datum.date))
                    .attr('cy', (d) => y(d.datum.fatalities));

                const tooltipHtml = `
                    <div class="tooltip-date">${formatDate(targetDate)}</div>
                    ${entries.map((e) => {
                    const isSelected = selectedCountryRef.current === e.country;
                    const isOther = selectedCountryRef.current && selectedCountryRef.current !== e.country;
                    const squareOpacity = isOther ? 0.2 : 1;
                    return `
                        <div class="tooltip-entry">
                            <span class="tooltip-square" style="background-color: ${getColor(e.country)}; opacity: ${squareOpacity}"></span>
                            <span class="tooltip-country">${e.country}</span>
                            <span class="tooltip-fatalities">${e.datum.fatalities}</span>
                        </div>
                    `;
                }).join('')}
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


            svg
                .append('text')
                .attr('x', margin.left)
                .attr('y', margin.top - 12)
                .attr('font-size', 12)
                .attr('font-weight', 600)
                .style('fill', 'var(--text-primary)')
                .text('Monthly fatalities');
        };

        const load = async () => {
            if (dataRef.current.length === 0) {
                const url = new URL('../Dataset/fatalities_per_month.csv', import.meta.url).href;
                const rows = await d3.csv(url, (d) => {
                    const date = parseDate(d.MONTH);
                    const fatalities = Number(d.fatalities);
                    const country = d.country;
                    if (!date || !Number.isFinite(fatalities)) return null;
                    if (country !== 'Israel' && country !== 'Palestine') return null;
                    return { date, country, fatalities };
                });

                if (!isMounted) return;
                dataRef.current = rows.filter(Boolean).sort((a, b) => a.date - b.date);
            }
            render();

            // After render completes, check if already in view and trigger animation
            if (wrapperRef.current && !animationPlayedRef.current) {
                const rect = wrapperRef.current.getBoundingClientRect();
                if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
                    animationPlayedRef.current = true;
                    d3.select(svgRef.current)
                        .selectAll('path[data-country]')
                        .transition()
                        .duration(1500)
                        .attr('stroke-dashoffset', 0);

                    setTimeout(() => {
                        d3.select(svgRef.current)
                            .selectAll('circle')
                            .transition()
                            .duration(300)
                            .style('opacity', 1);
                    }, 1500);
                }
            }
        };

        load();

        // Setup Intersection Observer to trigger animation when chart comes into view
        const observerOptions = {
            threshold: 1.0 // Trigger when fully visible
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !animationPlayedRef.current) {
                    animationPlayedRef.current = true;
                    // Trigger line animation
                    d3.select(svgRef.current)
                        .selectAll('path[data-country]')
                        .transition()
                        .duration(1500)
                        .attr('stroke-dashoffset', 0);

                    // Trigger circles animation after lines finish
                    setTimeout(() => {
                        d3.select(svgRef.current)
                            .selectAll('circle')
                            .transition()
                            .duration(300)
                            .style('opacity', 1);
                    }, 1500);
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

        // Global click handler to deselect when clicking anywhere outside the chart
        const handleDocumentClick = (event) => {
            if (selectedCountryRef.current && !svgRef.current?.contains(event.target)) {
                selectedCountryRef.current = null;
                render();
            }
        };

        document.addEventListener('click', handleDocumentClick);

        return () => {
            isMounted = false;
            observer.disconnect();
            resizeObserver?.disconnect();
            window.removeEventListener('resize', render);
            document.removeEventListener('click', handleDocumentClick);
        };
    }, []);

    return (
        <div ref={wrapperRef} style={{ width: '100%', maxWidth: '100%', overflow: 'visible', position: 'relative' }}>
            <svg ref={svgRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
    );
}

export function Chapter1RidgeChart({ isDark = true }) {
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
                const response = await fetch('/src/Dataset/events_per_week.csv');
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
                if (country === 'Israel') return 'var(--color-Israel)';
                if (country === 'Palestine') return 'var(--color-Palestine)';
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

                const baselineY = height - margin.bottom - innerHeight * 0.3;

                // Ensure Israel is drawn after Palestine (in front)
                const drawOrder = ['Palestine', 'Israel'];
                const orderedCountries = [
                    ...drawOrder.filter((c) => countries.includes(c)),
                    ...countries.filter((c) => !drawOrder.includes(c))
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

            const countriesForTooltip = ['Palestine', 'Israel'];

            const updateTooltip = (event) => {
                if (weeks.length === 0) return;
                const [mx] = d3.pointer(event, svg.node());
                const hoveredDate = x.invert(mx);
                const nearestIndex = bisectDate(weeks, hoveredDate);
                const targetWeek = weeks[Math.max(0, Math.min(nearestIndex, weeks.length - 1))];
                if (!targetWeek) return;

                const entries = [];
                for (const country of countriesForTooltip) {
                    const selectedMap = aggregatedByCountry.get(country) || new Map();
                    const totalMap = aggregatedAll.get(country) || new Map();
                    const typeNested = aggregatedByCountryType.get(country) || new Map();
                    const typeMap = typeNested.get(targetWeek) || new Map();

                    const selectedCount = selectedMap.get(targetWeek) || 0;
                    const totalCount = totalMap.get(targetWeek) || 0;

                    const typeBreakdown = Array.from(selectedEventTypes).sort().map((et) => {
                        const val = typeMap.get(et) || 0;
                        const pct = selectedCount > 0 ? (val / selectedCount) * 100 : 0;
                        return { eventType: et, value: val, pct };
                    });

                    entries.push({ country, selectedCount, totalCount, typeBreakdown });
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
                .attr('y1', height - margin.bottom - innerHeight * 0.3)
                .attr('y2', height - margin.bottom - innerHeight * 0.3)
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
                .style('font-size', '12px')
                .text('Time');

            // Top-left chart label (like line chart)
            svg
                .append('text')
                .attr('x', margin.left)
                .attr('y', margin.top - 12)
                .attr('font-size', 12)
                .attr('font-weight', 600)
                .style('fill', 'var(--text-primary)')
                .text('Weekly events (selected types)');

            // Legend - always show for both countries
            const legendX = width - margin.right - 140;
            const legendY = margin.top + 10;
            const legendCountries = ['Palestine', 'Israel'];

            for (let i = 0; i < legendCountries.length; i++) {
                const country = legendCountries[i];
                svg
                    .append('rect')
                    .attr('x', legendX)
                    .attr('y', legendY + i * 20)
                    .attr('width', 12)
                    .attr('height', 12)
                    .attr('rx', 2)
                    .style('fill', getColor(country))
                    .style('fill-opacity', 0.6)
                    .style('stroke', getColor(country))
                    .style('stroke-width', 1);

                svg
                    .append('text')
                    .attr('x', legendX + 18)
                    .attr('y', legendY + i * 20 + 10)
                    .style('fill', 'var(--text-primary)')
                    .style('font-size', '11px')
                    .text(country);
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
            }}>
                <div style={{ marginBottom: '15px', fontWeight: 'bold', fontSize: '14px', color: 'var(--text-primary)' }}>
                    Event Types
                </div>
                <div style={{ marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                        onClick={handleSelectAll}
                        style={{
                            padding: '4px 8px',
                            backgroundColor: 'transparent',
                            color: 'var(--color-link-hover)',
                            border: '1px solid var(--color-link-hover)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '500',
                        }}
                    >
                        Select All
                    </button>
                    <button
                        onClick={handleClearAll}
                        style={{
                            padding: '4px 8px',
                            backgroundColor: 'transparent',
                            color: 'var(--color-link-hover)',
                            border: '1px solid var(--color-link-hover)',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '11px',
                            fontWeight: '500',
                        }}
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
                <svg ref={svgRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
        </div>
    );
}

export default Chapter1RidgeChart;
