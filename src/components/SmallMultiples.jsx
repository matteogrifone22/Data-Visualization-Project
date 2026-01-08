import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

export function SmallMultipleChart({ isDark = true }) {
    const svgRef = useRef(null);
    const wrapperRef = useRef(null);
    const dataRef = useRef([]);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [selectedChart, setSelectedChart] = useState(null);
    const animationPlayedRef = useRef(false);
    const isAnimatingRef = useRef(false);
    const prevSelectedChartRef = useRef(null);

    // Load data once
    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            if (dataRef.current.length === 0) {
                const url = new URL('../Dataset/processed/Combined_SmallMultiple.csv', import.meta.url).href;
                const rows = await d3.csv(url, (d) => {
                    return {
                        country: d.Country,
                        year: +d.Year,
                        gdp: d.GDP_per_capita ? +d.GDP_per_capita : null,
                        drinkingWater: d.Drinking_Water_Access_Percent ? +d.Drinking_Water_Access_Percent : null,
                        sanitation: d.Sanitation_Access_Percent ? +d.Sanitation_Access_Percent : null,
                        foodInsecurity: d.Food_Insecurity_Percent ? +d.Food_Insecurity_Percent : null
                    };
                });

                if (!isMounted) return;
                dataRef.current = rows.filter(Boolean);
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

        // Reset animation only when layout changes (selectedChart toggles) or first render
        if (prevSelectedChartRef.current !== selectedChart) {
            animationPlayedRef.current = false;
            prevSelectedChartRef.current = selectedChart;
        }

        const render = () => {
            const data = dataRef.current;
            if (!svgRef.current || !wrapperRef.current || data.length === 0) return;

            const containerWidth = wrapperRef.current.getBoundingClientRect().width || 800;
            const width = 1100;
            const height = 500;

            // Dynamic margins based on selection state
            const margin = selectedChart !== null
                ? { top: 50, right: 20, bottom: 35, left: 260 }  // More space for selected view
                : { top: 50, right: 40, bottom: 35, left: 60 }; // Normal 2x2 grid view

            // Define metrics for small multiples
            const metrics = [
                { key: 'gdp', label: 'GDP per Capita ($)', unit: '$', format: d3.format(',.0f') },
                { key: 'drinkingWater', label: 'Safe Drinking Water Access (%)', unit: '%', format: d3.format('.1f') },
                { key: 'sanitation', label: 'Safe Sanitation Access (%)', unit: '%', format: d3.format('.1f') },
                { key: 'foodInsecurity', label: 'Food Insecurity (%)', unit: '%', format: d3.format('.1f') }
            ];

            const svg = d3
                .select(svgRef.current)
                .attr('viewBox', `0 0 ${width} ${height}`)
                .attr('preserveAspectRatio', 'xMidYMid meet');

            svg.selectAll('*').remove();

            // Calculate grid layout - 2x2 grid with minimal spacing
            const cols = 2;
            const rows = 2;
            const chartWidth = (width - margin.left - margin.right) / cols - 30;
            const chartHeight = (height - margin.top - margin.bottom) / rows - 30;

            // Create tooltip
            const tooltip = d3.select('body')
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

            // Group data by country
            const byCountry = d3.group(data, d => d.country);
            const countries = Array.from(byCountry.keys()).sort();

            // Color function for countries
            const getColor = (country) => {
                if (country === 'Israel') return 'var(--color-Israel)';
                if (country === 'Palestine') return 'var(--color-Palestine)';
                return 'var(--color-details)';
            };

            // Create small multiples
            metrics.forEach((metric, idx) => {
                const isSelected = selectedChart === idx;
                const isOtherSelected = selectedChart !== null && selectedChart !== idx;

                // Calculate position and size based on selection
                let xOffset, yOffset, currentWidth, currentHeight;

                if (selectedChart === null) {
                    // Normal 2x2 grid
                    const row = Math.floor(idx / cols);
                    const col = idx % cols;
                    xOffset = margin.left + col * (chartWidth + 60);
                    yOffset = margin.top + row * (chartHeight + 60);
                    currentWidth = chartWidth;
                    currentHeight = chartHeight;
                } else if (isSelected) {
                    // Large chart on the right
                    xOffset = width - margin.right - chartWidth * 1.8;
                    yOffset = margin.top + (height - margin.top - margin.bottom - chartHeight * 1.8) / 2;
                    currentWidth = chartWidth * 1.8;
                    currentHeight = chartHeight * 1.8;
                } else {
                    // Small charts stacked on the left
                    const smallIdx = idx < selectedChart ? idx : idx - 1;
                    const smallChartHeight = chartHeight * 0.6;
                    const verticalSpacing = 50;
                    const totalSmallChartsHeight = 3 * smallChartHeight + 2 * verticalSpacing;
                    const startY = margin.top + (height - margin.top - margin.bottom - totalSmallChartsHeight) / 2;

                    xOffset = margin.left - 200;
                    yOffset = startY + smallIdx * (smallChartHeight + verticalSpacing);
                    currentWidth = chartWidth * 0.6;
                    currentHeight = smallChartHeight;
                }

                let g = svg.select(`.chart-group-${idx}`);
                if (g.empty()) {
                    g = svg.append('g')
                        .attr('class', `chart-group-${idx}`)
                        .attr('transform', `translate(${xOffset}, ${yOffset})`);
                } else {
                    g.transition()
                        .duration(500)
                        .attr('transform', `translate(${xOffset}, ${yOffset})`);
                }

                g.transition()
                    .duration(500)
                    .style('opacity', isOtherSelected ? 0.7 : 1);

                // Clear existing content for re-rendering
                g.selectAll('*').remove();

                // Get data for this metric (filter out null values)
                const metricData = data.filter(d => d[metric.key] !== null);

                if (metricData.length === 0) return;

                // Scales
                const xScale = d3.scaleLinear()
                    .domain(d3.extent(metricData, d => d.year))
                    .range([0, currentWidth]);

                // Special handling for percentage metrics: different scales based on view mode
                let yDomain;
                if (metric.key === 'foodInsecurity' || metric.key === 'drinkingWater' || metric.key === 'sanitation') {
                    // Percentage metrics: 0-100 in grid view, auto-scale in zoomed view
                    if (isSelected) {
                        const yExtent = d3.extent(metricData, d => d[metric.key]);
                        const yPadding = (yExtent[1] - yExtent[0]) * 0.1;
                        yDomain = [yExtent[0] - yPadding, yExtent[1] + yPadding];
                    } else {
                        yDomain = [0, 100];
                    }
                } else {
                    // Other metrics: auto-scale based on data
                    const yExtent = d3.extent(metricData, d => d[metric.key]);
                    const yPadding = (yExtent[1] - yExtent[0]) * 0.1;
                    yDomain = [yExtent[0] - yPadding, yExtent[1] + yPadding];
                }

                const yScale = d3.scaleLinear()
                    .domain(yDomain)
                    .nice()
                    .range([currentHeight, 0]);

                // Title
                g.append('text')
                    .attr('x', currentWidth / 2)
                    .attr('y', -10)
                    .attr('text-anchor', 'middle')
                    .attr('fill', 'var(--text-primary)')
                    .style('font-size', '13px')
                    .style('font-weight', '600')
                    .text(metric.label);

                // X-axis
                const xAxis = d3.axisBottom(xScale)
                    .ticks(4)
                    .tickFormat(d3.format('d'));

                g.append('g')
                    .attr('transform', `translate(0, ${currentHeight})`)
                    .call(xAxis)
                    .call(g => g.selectAll('.tick line')
                        .style('stroke', 'var(--text-primary)')
                        .style('stroke-opacity', 0.25))
                    .call(g => g.select('.domain')
                        .style('stroke', 'var(--text-primary)')
                        .style('stroke-opacity', 0.4))
                    .call(g => g.selectAll('text')
                        .style('fill', 'var(--text-primary)')
                        .style('font-size', '10px'));

                // Y-axis
                const yAxis = d3.axisLeft(yScale)
                    .ticks(5)
                    .tickFormat(d => {
                        const formatted = metric.format(d);
                        if (metric.key === 'gdp') {
                            return `${formatted}$`;
                        } else if (metric.key === 'drinkingWater' || metric.key === 'sanitation' || metric.key === 'foodInsecurity') {
                            return `${formatted}%`;
                        }
                        return formatted;
                    });

                g.append('g')
                    .call(yAxis)
                    .call(g => g.selectAll('.tick line')
                        .style('stroke', 'var(--text-primary)')
                        .style('stroke-opacity', 0.15))
                    .call(g => g.select('.domain')
                        .style('stroke', 'none'))
                    .call(g => g.selectAll('text')
                        .style('fill', 'var(--text-primary)')
                        .style('font-size', '10px'));

                // Grid lines
                g.append('g')
                    .attr('class', 'grid')
                    .selectAll('line')
                    .data(yScale.ticks(5))
                    .join('line')
                    .attr('x1', 0)
                    .attr('x2', currentWidth)
                    .attr('y1', d => yScale(d))
                    .attr('y2', d => yScale(d))
                    .style('stroke', 'var(--text-primary)')
                    .style('stroke-opacity', 0.25)
                    .attr('stroke-dasharray', '2,2');

                // Add transparent background for click and hover interaction
                const interactionRect = g.append('rect')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('width', currentWidth)
                    .attr('height', currentHeight)
                    .attr('fill', 'transparent')
                    .attr('cursor', 'pointer')
                    .on('click', () => {
                        setSelectedChart(selectedChart === idx ? null : idx);
                    })
                    .on('mousemove', function (event) {
                        // Disable hover interactions during animations
                        if (!animationPlayedRef.current || isAnimatingRef.current) return;

                        const [mouseX] = d3.pointer(event, this);
                        const year = Math.round(xScale.invert(mouseX));

                        // Highlight dots for the current year
                        g.selectAll('circle')
                            .transition()
                            .duration(100)
                            .attr('r', d => d.year === year ? 9 : 5)
                            .style('opacity', d => d.year === year ? 1 : 0.8);

                        // Create tooltip content for both countries
                        let content = `<div class="tooltip-title">${metric.label}</div>`;
                        content += `<div class="tooltip-subtitle">Year ${year}</div>`;

                        countries.forEach(country => {
                            const countryYearData = data.find(d => d.country === country && d.year === year);
                            const prevYearData = data.find(d => d.country === country && d.year === year - 1);
                            const countryColor = getColor(country);

                            content += `<div class="tooltip-country-section">`;
                            content += `<div class="tooltip-country-name" style="color: ${countryColor};">${country}</div>`;

                            // Show only the current metric for this chart
                            if (countryYearData && countryYearData[metric.key] !== null) {
                                const value = countryYearData[metric.key];
                                content += `
                                    <div class="tooltip-metric-row">
                                        <span class="tooltip-label">Value:</span>
                                        <span class="tooltip-value">${metric.format(value)}${metric.unit}</span>
                                    </div>
                                `;

                                // Add trend if available
                                if (prevYearData && prevYearData[metric.key] !== null) {
                                    const prevValue = prevYearData[metric.key];
                                    const change = value - prevValue;

                                    // Format change with 1 decimal place
                                    const changeFormatted = Math.abs(change).toFixed(1);
                                    const roundedChange = parseFloat(changeFormatted);

                                    let arrow, changeColor;

                                    if (roundedChange === 0) {
                                        arrow = '→';
                                        changeColor = 'var(--color-neutral)';
                                    } else if (change > 0) {
                                        arrow = '↑';
                                        changeColor = 'var(--color-positive)';
                                    } else {
                                        arrow = '↓';
                                        changeColor = 'var(--color-negative)';
                                    }

                                    content += `
                                        <div class="tooltip-trend">
                                            <span class="tooltip-trend-label">vs. ${year - 1}: </span>
                                            <span class="tooltip-trend-value" style="color: ${changeColor};">${arrow} ${change > 0 ? '+' : ''}${changeFormatted}${metric.unit}</span>
                                        </div>
                                    `;
                                }
                            } else {
                                content += `<div class="tooltip-no-data">No data</div>`;
                            }

                            content += `</div>`;
                        });

                        tooltip
                            .html(content)
                            .style('opacity', '1')
                            .style('visibility', 'visible')
                            .style('left', `${event.pageX + 12}px`)
                            .style('top', `${event.pageY - 12}px`);
                    })
                    .on('mouseleave', function () {
                        // Disable hover interactions during animations
                        if (!animationPlayedRef.current || isAnimatingRef.current) return;

                        // Reset all dots to normal size
                        g.selectAll('circle')
                            .transition()
                            .duration(100)
                            .attr('r', 5)
                            .style('opacity', 0.8);

                        tooltip
                            .style('opacity', '0')
                            .style('visibility', 'hidden');
                    });

                // Line generator
                const line = d3.line()
                    .defined(d => d[metric.key] !== null)
                    .x(d => xScale(d.year))
                    .y(d => yScale(d[metric.key]))
                    .curve(d3.curveMonotoneX);

                // Draw lines for each country
                countries.forEach(country => {
                    const countryData = metricData.filter(d => d.country === country);

                    if (countryData.length === 0) return;

                    // Line path
                    const pathElement = g.append('path')
                        .datum(countryData)
                        .attr('fill', 'none')
                        .attr('stroke', getColor(country))
                        .attr('stroke-width', 5)
                        .attr('stroke-linejoin', 'round')
                        .attr('stroke-linecap', 'round')
                        .attr('d', line)
                        .attr('data-country', country)
                        .attr('data-chart-idx', idx);

                    // Setup animation: set stroke-dasharray to make line invisible initially
                    const pathNode = pathElement.node();
                    const pathLength = pathNode.getTotalLength();
                    pathElement
                        .attr('stroke-dasharray', pathLength)
                        .attr('stroke-dashoffset', animationPlayedRef.current ? 0 : pathLength);

                    // Add points for visual reference
                    g.selectAll(`.point-${country.replace(/\s+/g, '-')}`)
                        .data(countryData)
                        .join('circle')
                        .attr('class', `point-${country.replace(/\s+/g, '-')}`)
                        .attr('cx', d => xScale(d.year))
                        .attr('cy', d => yScale(d[metric.key]))
                        .attr('r', 5)
                        .attr('fill', getColor(country))
                        .attr('stroke', 'var(--bg-primary)')
                        .attr('stroke-width', 1.5)
                        .attr('data-country', country)
                        .attr('data-chart-idx', idx)
                        .style('opacity', animationPlayedRef.current ? 0.8 : 0)
                        .style('pointer-events', 'none');
                });
            });

            // Add legend
            const legend = svg.append('g')
                .attr('transform', `translate(${width - margin.right - 50}, ${margin.top - 35})`);

            countries.forEach((country, i) => {
                const legendItem = legend.append('g')
                    .attr('transform', `translate(0, ${i * 16})`);

                legendItem.append('line')
                    .attr('x1', 0)
                    .attr('x2', 16)
                    .attr('y1', 0)
                    .attr('y2', 0)
                    .attr('stroke', getColor(country))
                    .attr('stroke-width', 2.5);

                legendItem.append('text')
                    .attr('x', 20)
                    .attr('y', 3)
                    .attr('fill', 'var(--text-primary)')
                    .style('font-size', '12px')
                    .text(country);
            });
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
                    isAnimatingRef.current = true;
                    // Trigger line animation for all small multiples
                    d3.select(svgRef.current)
                        .selectAll('path[data-country]')
                        .transition()
                        .duration(1500)
                        .attr('stroke-dashoffset', 0);

                    // Trigger circles animation after lines finish
                    setTimeout(() => {
                        d3.select(svgRef.current)
                            .selectAll('circle[data-country]')
                            .transition()
                            .duration(300)
                            .style('opacity', 0.8);
                        
                        // Re-enable interactions after animation completes
                        setTimeout(() => {
                            isAnimatingRef.current = false;
                        }, 300);
                    }, 1500);
                }
            });
        }, observerOptions);

        if (wrapperRef.current) {
            observer.observe(wrapperRef.current);
        }

        const handleResize = () => {
            render();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            observer.disconnect();
            window.removeEventListener('resize', handleResize);
            d3.select('body').selectAll('.chart-tooltip').remove();
        };
    }, [dataLoaded, isDark, selectedChart]);

    return (
        <div ref={wrapperRef} style={{ width: '100%', maxWidth: '1100px', height: 'auto', margin: '0 auto' }}>
            <svg ref={svgRef} style={{ width: '100%', height: 'auto', display: 'block' }} />
        </div>
    );
}

export default SmallMultipleChart;
