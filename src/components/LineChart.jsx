import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import NearMeIcon from '@mui/icons-material/NearMe';

export function LineChart({ isDark = true, guideActive = false }) {
    const svgRef = useRef(null);
    const wrapperRef = useRef(null);
    const dataRef = useRef([]);
    const selectedCountryRef = useRef(null);
    const animationPlayedRef = useRef(false);
    const allCirclesRef = useRef([]);
    const [dataLoaded, setDataLoaded] = useState(false);

    // Load data once, keep event_type for tooltip breakdown
    useEffect(() => {
        let isMounted = true;
        const parseDate = d3.timeParse('%Y-%m');

        const load = async () => {
            if (dataRef.current.length === 0) {
                const url = new URL('../Dataset/processed/fatalities_per_month.csv', import.meta.url).href;
                const rows = await d3.csv(url, (d) => {
                    const date = parseDate(d.MONTH);
                    const fatalities = Number(d.fatalities);
                    const country = d.country;
                    const event_type = d.event_type ? d.event_type.trim() : undefined;
                    if (!date || !Number.isFinite(fatalities)) return null;
                    if (country !== 'Israel' && country !== 'Gaza') return null;
                    return { date, country, fatalities, event_type };
                });

                if (!isMounted) return;
                dataRef.current = rows.filter(Boolean).sort((a, b) => a.date - b.date);
                setDataLoaded(true);
            } else {
                setDataLoaded(true);
            }
        };

        load();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!dataLoaded) return;

        // Reset animation when chart is shown
        animationPlayedRef.current = false;

        const formatDate = d3.timeFormat('%B %Y');

        const render = () => {
            // Aggregate fatalities by country and date (sum all event types)
            const rawData = dataRef.current;
            const aggregatedByCountry = d3.rollup(
                rawData,
                v => d3.sum(v, d => d.fatalities),
                d => d.country,
                d => d.date
            );
            // Flatten for plotting
            const data = [];
            for (const [country, dateMap] of aggregatedByCountry) {
                for (const [date, fatalities] of dateMap) {
                    data.push({ country, date, fatalities });
                }
            }
            data.sort((a, b) => a.date - b.date);
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
                if (country === 'Gaza') return 'var(--color-Palestine)';
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

                // For each country, get the fatalities and breakdown by event_type for this date
                const entries = [];
                for (const [country, series] of seriesByCountry.entries()) {
                    const idx = bisectSeries(series, targetDate);
                    const datum = series[idx];
                    if (!datum) continue;
                    // Find all raw rows for this country and date
                    const rawRows = dataRef.current.filter(d => d.country === country && +d.date === +targetDate);
                    const total = d3.sum(rawRows, d => d.fatalities);
                    // Group by event_type
                    const byType = d3.rollup(
                        rawRows,
                        v => d3.sum(v, d => d.fatalities),
                        d => d.event_type || 'Unknown'
                    );
                    const breakdown = Array.from(byType.entries())
                        .map(([event_type, value]) => ({
                            event_type,
                            value,
                            pct: total > 0 ? (value / total) * 100 : 0
                        }))
                        .filter(b => b.value > 0)
                        .sort((a, b) => b.value - a.value);
                    entries.push({ country, datum, breakdown });
                }
                entries.sort((a, b) => (a.country === 'Gaza' ? -1 : 1) - (b.country === 'Gaza' ? -1 : 1));

                if (entries.length === 0) {
                    focusLayer.style('display', 'none');
                    return;
                }

                focusLayer.style('display', null);
                focusLine.attr('x1', x(targetDate)).attr('x2', x(targetDate));

                focusLayer
                    .selectAll('circle')
                    .data(entries, (d) => d.country)
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
                        return `
                        <div class="tooltip-entry">
                            <span class="tooltip-square" style="background-color: ${getColor(e.country)};"></span>
                            <span class="tooltip-country">${e.country}</span>
                            <span class="tooltip-fatalities">${e.datum.fatalities}</span>
                        </div>
                        <div class="tooltip-country-breakdown">
                            ${e.breakdown.map(b => `
                                <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
                                    <span>${b.event_type}</span>
                                    <span style="font-weight:700;">${b.value} (${b.pct.toFixed(1)}%)</span>
                                </div>
                            `).join('')}
                        </div>
                        `;
                    }).join('')}
                `;

                tooltip
                    .style('opacity', 1)
                    .style('visibility', 'visible')
                    .html(tooltipHtml)
                    .style('left', `${(event.pageX !== undefined ? event.pageX : event.clientX) + 12}px`)
                    .style('top', `${(event.pageY !== undefined ? event.pageY : event.clientY) - 20}px`);
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

        render();

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
            observer.disconnect();
            resizeObserver?.disconnect();
            window.removeEventListener('resize', render);
            document.removeEventListener('click', handleDocumentClick);
        };
    }, [dataLoaded]);

    return (
        <div ref={wrapperRef} style={{ width: '100%', maxWidth: '100%', margin: '0 auto', position: 'relative', minHeight: 420 }}>
            {/* Duplicate guide banners for onhover tooltip, matching SmallMultiples */}
            {guideActive && (
                <>
                    <div
                        style={{
                            position: 'absolute',
                            left: '60%',
                            top: '170%',
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
                            left: '68%',
                            top: '40%',
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
                </>
            )}
            <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block', zIndex: 1 }} />
            <div style={{
                position: 'absolute',
                right: 12,
                bottom: -10,
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
    );
}

export default LineChart;