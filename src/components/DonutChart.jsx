import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

function DonutChart() {
    const svgRef = useRef(null);
    const wrapperRef = useRef(null);
    const [animationPlayed, setAnimationPlayed] = useState(false);
    const [pieData, setPieData] = useState(null);

    // Load and prepare data only once
    useEffect(() => {
        let isMounted = true;
        const load = async () => {
            const url = new URL('../Dataset/fatalities_per_month.csv', import.meta.url).href;
            const rows = await d3.csv(url, (d) => {
                const fatalities = Number(d.fatalities);
                const country = d.country;
                if (!Number.isFinite(fatalities)) return null;
                if (country !== 'Israel' && country !== 'Gaza') return null;
                return { country, fatalities };
            });
            if (!isMounted) return;
            const data = rows.filter(Boolean);
            // Aggregate fatalities by country
            const totals = d3.rollup(
                data,
                v => d3.sum(v, d => d.fatalities),
                d => d.country
            );
            setPieData(Array.from(totals, ([country, value]) => ({ country, value })));
        };
        load();
        return () => { isMounted = false; };
    }, []);

    // Render chart only when animationPlayed and pieData are ready
    useEffect(() => {
        if (!animationPlayed || !pieData) return;
            const width = 320;
            const height = 320;
            const extraSpace = 60;
            const svgHeight = height + extraSpace;
            const radius = Math.min(width, height) / 2 - 20;
            const color = d3.scaleOrdinal()
                .domain(["Gaza", "Israel"])
                .range(["var(--color-Palestine)", "var(--color-Israel)"]);

            const svg = d3.select(svgRef.current)
                .attr("viewBox", `0 0 ${width} ${svgHeight}`)
                .attr("width", width)
                .attr("height", svgHeight);
            svg.selectAll("*").remove();

            const g = svg.append("g")
                .attr("transform", `translate(${width / 2},${height / 2 + extraSpace/2})`);

            const pie = d3.pie()
                .value(d => d.value)
                .sort(null);
            const arc = d3.arc()
                .innerRadius(radius * 0.6)
                .outerRadius(radius);

            // Tooltip div
            let tooltip = d3.select("body").selectAll(".donut-tooltip").data([null]).join("div")
                .attr("class", "donut-tooltip")
                .style("position", "absolute")
                .style("pointer-events", "none")
                .style("z-index", 20)
                .style("opacity", 0)
                .style("background", "var(--bg-secondary)")
                .style("color", "var(--text-primary)")
                .style("padding", "10px 14px")
                .style("border-radius", "10px")
                .style("box-shadow", "0 4px 16px rgba(0,0,0,0.18)")
                .style("font-size", "15px")
                .style("font-weight", 600);

            const arcPaths = g.selectAll("path")
                .data(pie(pieData))
                .enter()
                .append("path")
                .attr("fill", d => color(d.data.country))
                .style("cursor", "pointer")
                .on("mousemove", function(event, d) {
                    const percent = (d.data.value / d3.sum(pieData, d => d.value) * 100).toFixed(1);
                    tooltip
                        .style("opacity", 1)
                        .html(`<span style='color:${color(d.data.country)};font-weight:700;'>${d.data.country}</span><br>${percent}% (${d.data.value})`)
                        .style("left", (event.pageX + 16) + "px")
                        .style("top", (event.pageY - 24) + "px");
                })
                .on("mouseleave", function() {
                    tooltip.style("opacity", 0);
                });

        // Animate arcs
        arcPaths
            .transition()
            .duration(2500)
            .ease(d3.easeCubicInOut)
            .attrTween("d", function(d) {
                const i = d3.interpolate({ startAngle: d.startAngle, endAngle: d.startAngle }, d);
                return function(t) {
                    return arc(i(t));
                };
            });

            // Place Israel label above its arc, Gaza label below its arc
            const pieLayout = pie(pieData);
            pieLayout.forEach((d) => {
                const arcCentroid = arc.centroid(d);
                let labelX = width / 2 + arcCentroid[0];
                let labelY;
                if (d.data.country === "Israel") {
                    // Place well above the arc
                    labelY = (height / 2 + extraSpace/2 + arcCentroid[1]) - 60;
                } else if (d.data.country === "Gaza") {
                    // Place well below the arc
                    labelY = (height / 2 + extraSpace/2 + arcCentroid[1]) + 60;
                } else {
                    labelY = height / 2 + extraSpace/2 + arcCentroid[1];
                }
                svg.append("text")
                    .attr("x", labelX)
                    .attr("y", labelY)
                    .attr("text-anchor", "middle")
                    .style("fill", color(d.data.country))
                    .style("font-size", "17px")
                    .style("font-weight", 700)
                    .text(d.data.country);
            });

    }, [animationPlayed, pieData]);

    // Intersection Observer for animation trigger
    useEffect(() => {
        if (!wrapperRef.current) return;
        const observer = new window.IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !animationPlayed) {
                        setAnimationPlayed(true);
                    }
                });
            },
            { threshold: 0.5 }
        );
        observer.observe(wrapperRef.current);
        return () => observer.disconnect();
    }, [animationPlayed]);

    return (
        <div style={{ width: 340, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8, color: 'var(--text-primary)' }}>
                Fatalities Distribution: Gaza vs Israel
            </div>
            <div ref={wrapperRef} style={{ width: 340, height: 340, margin: '0 auto' }}>
                <svg ref={svgRef} style={{ width: '100%', height: '100%', display: 'block' }} />
            </div>
        </div>
    );
}

export default DonutChart;
