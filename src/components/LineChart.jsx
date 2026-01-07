import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export function LineChart({ isDark = true }) {
    const svgRef = useRef(null);
    const wrapperRef = useRef(null);
    const dataRef = useRef([]);
    const selectedCountryRef = useRef(null);
    const animationPlayedRef = useRef(false);
    const allCirclesRef = useRef([]);
    const [dataLoaded, setDataLoaded] = useState(false);

    // Load data once
    useEffect(() => {
        let isMounted = true;
        const parseDate = d3.timeParse('%Y-%m');

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
        <div ref={wrapperRef} style={{ width: '100%', maxWidth: '100%', overflow: 'visible', position: 'relative' }}>
            <svg ref={svgRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
    );
}

export default LineChart;