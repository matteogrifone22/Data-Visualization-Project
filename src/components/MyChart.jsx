import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function MyChart() {
  const ref = useRef(null);

  useEffect(() => {
    const data = [10, 15, 20, 25, 18, 30];

    const width = 600;
    const height = 300;
    const svg = d3.select(ref.current)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove(); // pulisce prima di ridisegnare

    const x = d3.scaleBand().domain(d3.range(data.length)).range([40, width - 20]).padding(0.2);
    const y = d3.scaleLinear().domain([0, d3.max(data)]).nice().range([height - 30, 10]);

    svg.append('g')
      .attr('transform', `translate(0, ${height - 30})`)
      .call(d3.axisBottom(x).tickFormat(i => i + 1));

    svg.append('g')
      .attr('transform', `translate(40,0)`)
      .call(d3.axisLeft(y));

    svg.selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', (d, i) => x(i))
      .attr('y', d => y(d))
      .attr('height', d => y(0) - y(d))
      .attr('width', x.bandwidth())
      .attr('fill', 'steelblue')
  }, []);

  return <svg ref={ref}></svg>;
}
