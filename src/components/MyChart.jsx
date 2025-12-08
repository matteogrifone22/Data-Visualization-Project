import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function MyChart() {
  const ref = useRef(null);

  useEffect(() => {
    const data = [10, 15, 20, 25, 18, 30];

    const renderChart = () => {
      if (!ref.current) return;
      
      // Make the chart responsive - use more of container width on mobile
      const containerWidth = ref.current.parentElement.offsetWidth;
      const width = Math.min(600, containerWidth);
      const height = Math.min(300, width * 0.5);
      
      const svg = d3.select(ref.current)
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      svg.selectAll('*').remove(); // pulisce prima di ridisegnare

      // Adjust margins based on width
      const marginLeft = width < 400 ? 30 : 40;
      const marginRight = width < 400 ? 10 : 20;
      const marginBottom = width < 400 ? 25 : 30;
      const marginTop = 10;

      const x = d3.scaleBand()
        .domain(d3.range(data.length))
        .range([marginLeft, width - marginRight])
        .padding(0.2);
      const y = d3.scaleLinear()
        .domain([0, d3.max(data)])
        .nice()
        .range([height - marginBottom, marginTop]);

      svg.append('g')
        .attr('transform', `translate(0, ${height - marginBottom})`)
        .call(d3.axisBottom(x).tickFormat(i => i + 1));

      svg.append('g')
        .attr('transform', `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y));

      svg.selectAll('rect')
        .data(data)
        .join('rect')
        .attr('x', (d, i) => x(i))
        .attr('y', d => y(d))
        .attr('height', d => y(0) - y(d))
        .attr('width', x.bandwidth())
        .attr('fill', 'steelblue');
    };

    renderChart();

    // Add resize listener
    const handleResize = () => renderChart();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <svg ref={ref} style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }}></svg>;
}
