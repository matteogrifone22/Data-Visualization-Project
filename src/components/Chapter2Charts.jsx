import { Fragment, useEffect, useRef, useState } from "react";
import { PlayArrow, Pause, CompareArrows } from "@mui/icons-material";
import * as d3 from "d3";

// Kernel + KDE helpers
const kernelEpanechnikov = (k) => (v) => {
  v /= k;
  return Math.abs(v) <= 1 ? 0.75 * (1 - v * v) / k : 0;
};

const kernelDensityEstimatorWeighted = (kernel, X) => (VW) => {
  const totalW = d3.sum(VW, (d) => d.weight) || 1;
  return X.map((x) => [x, d3.sum(VW, (d) => d.weight * kernel(x - d.age)) / totalW]);
};

// Weighted quantiles for boxplot along the age axis
function weightedBoxStats(values, weights) {
  const data = values
    .map((v, i) => ({ v, w: weights[i] }))
    .filter((d) => Number.isFinite(d.v) && d.w > 0)
    .sort((a, b) => a.v - b.v);

  const totalW = d3.sum(data, (d) => d.w);
  if (!totalW) return null;

  const quantileW = (p) => {
    const target = totalW * p;
    let acc = 0;
    for (const d of data) {
      acc += d.w;
      if (acc >= target) return d.v;
    }
    return data[data.length - 1].v;
  };

  const q1 = quantileW(0.25);
  const median = quantileW(0.5);
  const q3 = quantileW(0.75);
  const iqr = q3 - q1;
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;

  const valuesOnly = data.map((d) => d.v);
  const minActual = d3.min(valuesOnly);
  const maxActual = d3.max(valuesOnly);
  const whiskerLow = valuesOnly.find((v) => v >= lowerFence) ?? minActual;
  const whiskerHigh = [...valuesOnly].reverse().find((v) => v <= upperFence) ?? maxActual;
  const outliers = valuesOnly.filter((v) => v < whiskerLow || v > whiskerHigh);

  return {
    q1,
    median,
    q3,
    min: whiskerLow,
    max: whiskerHigh,
    whiskerLow,
    whiskerHigh,
    minActual,
    maxActual,
    outliers
  };
}

const weightedMean = (observations) => {
  const num = d3.sum(observations, (o) => o.age * o.weight);
  const den = d3.sum(observations, (o) => o.weight);
  return den ? num / den : null;
};

const ageMidpoint = (str) => {
  const m = str.match(/(\d+)-(\d+)/);
  return m ? (Number(m[1]) + Number(m[2])) / 2 : NaN;
};

// Named export expected by imports
export function Chapter2ViolinBoxPlot({ isDark = true }) {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);
  const yearsRef = useRef([]);
  const [data, setData] = useState([]);
  const [year, setYear] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const [currentStats, setCurrentStats] = useState([]);

  // Load dataset once
  useEffect(() => {
    const load = async () => {
      const url = new URL("../Dataset/mortality_rate_grouped.csv", import.meta.url).href;
      const rows = await d3.csv(url);
      if (!rows || rows.length === 0) return;

      const ageCols = Object.keys(rows[0]).filter((c) => c.includes("-"));
      const parsed = rows
        .map((d) => {
          const country = d.Country === "State of Palestine" ? "Palestine" : d.Country;
          const yearVal = Number(d.Year);
          if (!country || !Number.isFinite(yearVal)) return null;
          const observations = ageCols
            .map((col) => ({ age: ageMidpoint(col), weight: Number(d[col]) }))
            .filter((o) => Number.isFinite(o.age) && Number.isFinite(o.weight));
          return { country, year: yearVal, observations };
        })
        .filter(Boolean);

      const years = Array.from(new Set(parsed.map((d) => d.year))).sort(d3.ascending);
      yearsRef.current = years;
      setYear(years[years.length - 1]);
      setData(parsed);
    };

    load();
  }, []);

  // Play / pause progression over years
  useEffect(() => {
    if (!isPlaying || !year || yearsRef.current.length === 0) return undefined;
    const handle = setInterval(() => {
      setYear((prev) => {
        const idx = yearsRef.current.indexOf(prev);
        const next = yearsRef.current[(idx + 1) % yearsRef.current.length];
        return next;
      });
    }, 900);
    return () => clearInterval(handle);
  }, [isPlaying, year]);

  // Draw whenever data, year, theme, or compare state changes
  useEffect(() => {
    if (!year || data.length === 0 || !svgRef.current) return;

    const filtered = data.filter((d) => d.year === year);
    if (filtered.length === 0) return;
    const withStats = filtered.map((d) => ({
      ...d,
      stats: weightedBoxStats(
        d.observations.map((o) => o.age),
        d.observations.map((o) => o.weight)
      ),
      mean: weightedMean(d.observations)
    }));
    setCurrentStats(withStats);

    const containerWidth = wrapperRef.current?.getBoundingClientRect().width || 900;
    const width = Math.max(Math.min(containerWidth, 960), 360);
    const height = 350;
    const margin = { top: 32, right: 44, bottom: 30, left: 80 };

    const svg = d3.select(svgRef.current);
    svg.attr("viewBox", `0 0 ${width} ${height}`).attr("preserveAspectRatio", "xMidYMid meet");

    const y = d3.scaleLinear().domain([0, 100]).range([height - margin.bottom, margin.top]);
    const innerWidth = width - margin.left - margin.right;
    const positions = {
      Israel: showCompare ? margin.left + innerWidth * 0.18 : margin.left + innerWidth * 0.35,
      Palestine: showCompare ? margin.left + innerWidth * 0.82 : margin.left + innerWidth * 0.65
    };
    const bandWidth = showCompare ? Math.min(innerWidth * 0.14, 120) : Math.min(innerWidth * 0.22, 160);

    const xLabels = [
      { label: "Israel", x: positions.Israel },
      { label: "Palestine", x: positions.Palestine }
    ];

    const kdeX = d3.range(0, 100, 0.5);
    const kde = kernelDensityEstimatorWeighted(kernelEpanechnikov(6), kdeX);

    const maxDensity = d3.max(withStats, (d) => {
      const density = kde(d.observations);
      return d3.max(density, (e) => e[1]);
    }) || 0.001;
    const widthScale = d3.scaleLinear().domain([0, maxDensity]).range([0, (bandWidth / 2) * 0.9]);
    const areaGen = d3
      .area()
      .x0((e) => -widthScale(e[1]))
      .x1((e) => widthScale(e[1]))
      .y((e) => y(e[0]))
      .curve(d3.curveCatmullRom);

    const getColor = (country) => {
      if (country === "Israel") return "var(--color-Israel)";
      if (country === "Palestine") return "var(--color-Palestine)";
      return "var(--text-primary)";
    };

    const plotRoot = svg.selectAll(".plot-root").data([null]).join("g").attr("class", "plot-root");

    const xAxis = svg.selectAll(".x-axis").data([null]).join((enter) => enter.append("g").attr("class", "x-axis"));
    xAxis
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .selectAll("text")
      .data(xLabels, (d) => d.label)
      .join(
        (enter) =>
          enter
            .append("text")
            .attr("y", 16)
            .attr("text-anchor", "middle")
            .style("fill", "var(--text-primary)")
            .style("font-weight", 700)
            .attr("x", (d) => d.x),
        (update) =>
          update
            .transition()
            .duration(420)
            .ease(d3.easeCubicInOut)
            .attr("x", (d) => d.x),
        (exit) => exit.remove()
      )
      .text((d) => d.label);

    const yAxisGenerator = d3.axisLeft(y).ticks(10).tickSize(-(width - margin.left - margin.right));
    const yAxis = svg
      .selectAll(".y-axis")
      .data([null])
      .join((enter) => enter.append("g").attr("class", "y-axis"));
    yAxis
      .attr("transform", `translate(${margin.left},0)`)
      .call(yAxisGenerator)
      .call((g) => g.selectAll("text").style("fill", "var(--text-primary)"))
      .call((g) =>
        g
          .selectAll(".tick line")
          .attr("stroke", isDark ? "rgba(217,217,214,0.25)" : "rgba(37,40,42,0.25)")
          .attr("stroke-dasharray", "3 4")
      )
      .call((g) => g.select(".domain").remove());

    svg
      .selectAll(".y-label")
      .data([null])
      .join((enter) => enter.append("text").attr("class", "y-label"))
      .attr("x", -margin.left + 100)
      .attr("y", margin.top - 16)
      .attr("fill", "var(--text-primary)")
      .attr("font-size", 12)
      .attr("font-weight", 700)
      .text("Age group");

    svg
      .selectAll(".chart-title")
      .data([year])
      .join((enter) => enter.append("text").attr("class", "chart-title"))
      .attr("x", width / 2)
      .attr("y", margin.top - 12)
      .attr("fill", "var(--text-primary)")
      .attr("font-size", 13)
      .attr("font-weight", 700)
      .attr("text-anchor", "middle")
      .text((d) => `Age distribution of mortality rates - ${d}`);

    const countryGroups = plotRoot.selectAll(".country-group").data(withStats, (d) => d.country);

    const countryEnter = countryGroups
      .enter()
      .append("g")
      .attr("class", "country-group")
      .attr("transform", (d) => `translate(${positions[d.country]},0)`);

    countryEnter.append("path").attr("class", "violin");
    countryEnter.append("line").attr("class", "whisker").attr("stroke-linecap", "round");
    countryEnter.append("line").attr("class", "whisker-cap whisker-cap-low").attr("stroke-linecap", "round");
    countryEnter.append("line").attr("class", "whisker-cap whisker-cap-high").attr("stroke-linecap", "round");
    countryEnter.append("rect").attr("class", "box").attr("rx", 6);
    countryEnter.append("line").attr("class", "median");
    countryEnter.append("g").attr("class", "outliers");

    const allGroups = countryEnter.merge(countryGroups);
    const transition = d3.transition().duration(420).ease(d3.easeCubicInOut);

    allGroups
      .transition(transition)
      .attr("transform", (d) => `translate(${positions[d.country]},0)`);

    allGroups.each(function (d) {
      const density = kde(d.observations);
      const stats = d.stats;
      const color = getColor(d.country);
      const boxWidth = Math.min(46, bandWidth * 0.6);
      const capWidth = Math.min(26, boxWidth * 0.7);

      const group = d3.select(this);
      group
        .select(".violin")
        .datum(density)
        .attr("fill", color)
        .attr("fill-opacity", isDark ? 0.32 : 0.26)
        .attr("stroke", color)
        .attr("stroke-width", 0.8)
        .transition(transition)
        .attr("d", areaGen);

      if (stats) {
        group
          .select(".whisker")
          .attr("stroke", color)
          .attr("stroke-width", 2)
          .transition(transition)
          .attr("y1", y(stats.whiskerLow))
          .attr("y2", y(stats.whiskerHigh));

        group
          .select(".whisker-cap-low")
          .attr("stroke", color)
          .attr("stroke-width", 2)
          .transition(transition)
          .attr("x1", -capWidth / 2)
          .attr("x2", capWidth / 2)
          .attr("y1", y(stats.whiskerLow))
          .attr("y2", y(stats.whiskerLow));

        group
          .select(".whisker-cap-high")
          .attr("stroke", color)
          .attr("stroke-width", 2)
          .transition(transition)
          .attr("x1", -capWidth / 2)
          .attr("x2", capWidth / 2)
          .attr("y1", y(stats.whiskerHigh))
          .attr("y2", y(stats.whiskerHigh));

        group
          .select(".box")
          .attr("fill", color)
          .attr("fill-opacity", isDark ? 0.32 : 0.24)
          .attr("stroke", color)
          .attr("stroke-width", 1.4)
          .transition(transition)
          .attr("x", -boxWidth / 2)
          .attr("width", boxWidth)
          .attr("y", y(stats.q3))
          .attr("height", Math.max(1, y(stats.q1) - y(stats.q3)));

        group
          .select(".median")
          .attr("stroke", isDark ? "#fdfdfd" : "#111")
          .attr("stroke-width", 2.4)
          .transition(transition)
          .attr("x1", -boxWidth / 2)
          .attr("x2", boxWidth / 2)
          .attr("y1", y(stats.median))
          .attr("y2", y(stats.median));

        const outlierSel = group
          .select(".outliers")
          .selectAll("circle")
          .data(stats.outliers || []);

        outlierSel
          .enter()
          .append("circle")
          .attr("r", 3.2)
          .attr("fill", color)
          .attr("fill-opacity", 0.8)
          .attr("stroke", color)
          .attr("stroke-width", 0.6)
          .attr("cx", 0)
          .attr("cy", (v) => y(v))
          .merge(outlierSel)
          .transition(transition)
          .attr("cy", (v) => y(v));

        outlierSel.exit().transition(transition).attr("cy", y(stats.median)).remove();
      }
    });

    countryGroups.exit().remove();
  }, [data, year, isDark, showCompare]);

  const minYear = yearsRef.current[0];
  const maxYear = yearsRef.current[yearsRef.current.length - 1];

  const compareMetrics = [
    { key: "median", label: "Median age (weighted)" },
    { key: "mean", label: "Mean age (weighted)" },
    { key: "q1", label: "Q1 (25th percentile)" },
    { key: "q3", label: "Q3 (75th percentile)" },
    { key: "min", label: "Lower whisker" },
    { key: "max", label: "Upper whisker" }
  ];

  const bestByMetric = Object.fromEntries(
    compareMetrics.map(({ key }) => {
      const values = currentStats
        .map((d) => {
          if (key === "mean") return d.mean;
          return d.stats ? d.stats[key] : null;
        })
        .filter((v) => Number.isFinite(v));
      const best = values.length ? d3.max(values) : null;
      return [key, best];
    })
  );

  return (
    <div ref={wrapperRef} style={{ width: "100%", margin: "0 auto", position: "relative" }}>
      <svg
        ref={svgRef}
        role="img"
        aria-label="Violin and box plot of mortality by age and country"
        style={{ width: "100%", height: "100%" }}
      />
      <div className="chapter2-controls">
        <button
          className="chapter2-icon-button"
          onClick={() => setShowCompare((v) => !v)}
          aria-pressed={showCompare}
          aria-label={showCompare ? "Hide compare" : "Show compare"}
          title={showCompare ? "Hide compare" : "Show compare"}
        >
          <CompareArrows fontSize="small" />
        </button>
        <button
          className="chapter2-icon-button"
          onClick={() => setIsPlaying((p) => !p)}
          aria-label={isPlaying ? "Pause autoplay" : "Play autoplay"}
        >
          {isPlaying ? <Pause fontSize="small" /> : <PlayArrow fontSize="small" />}
        </button>
        <span className="chapter2-year-label">Year</span>
        <input
          className="chapter2-range"
          type="range"
          min={minYear ?? 0}
          max={maxYear ?? 0}
          step={1}
          value={year ?? minYear ?? 0}
          onChange={(e) => setYear(Number(e.target.value))}
        />
        <span className="chapter2-year-value">{year ?? "–"}</span>
      </div>
      {showCompare && currentStats.length > 0 && (
        <div className="chapter2-compare-overlay">
          <div className="chapter2-compare-panel">
            <div className="chapter2-compare-header">
              <div className="chapter2-compare-title">Comparison for {year}</div>
              <div className="chapter2-compare-note">
                Higher ages mean mortality is concentrated among older groups (better)
              </div>
            </div>
            <div
              className="chapter2-compare-grid"
              style={{ gridTemplateColumns: `140px repeat(${currentStats.length}, 1fr)` }}
            >
              <div className="compare-cell compare-label" />
              {currentStats.map((d) => (
                <div key={d.country} className="compare-cell compare-country">
                  <span
                    className="compare-dot"
                    style={{ background: d.country === "Israel" ? "var(--color-Israel)" : "var(--color-Palestine)" }}
                  />
                  {d.country}
                </div>
              ))}

              {compareMetrics.map(({ key, label }) => (
                <Fragment key={key}>
                  <div className="compare-cell compare-label">{label}</div>
                  {currentStats.map((d) => {
                    const val = key === "mean" ? d.mean : d.stats ? d.stats[key] : null;
                    const isBest = Number.isFinite(val) && bestByMetric[key] !== null && val === bestByMetric[key];
                    return (
                      <div key={`${key}-${d.country}`} className={`compare-cell compare-value ${isBest ? "is-best" : ""}`}>
                        {Number.isFinite(val) ? val.toFixed(2) : "–"}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chapter2ViolinBoxPlot;
