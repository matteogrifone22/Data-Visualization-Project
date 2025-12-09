import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export default function MyChart() {
  const ref = useRef(null);

  useEffect(() => {
    // Line chart data with x and y values
    const data1 = [
      { x: 1, y: 10 },
      { x: 2, y: 15 },
      { x: 3, y: 20 },
      { x: 4, y: 25 },
      { x: 5, y: 18 },
      { x: 6, y: 30 }
    ];

    const data2 = [
      { x: 1, y: 12 },
      { x: 2, y: 18 },
      { x: 3, y: 16 },
      { x: 4, y: 22 },
      { x: 5, y: 25 },
      { x: 6, y: 28 }
    ];

    const renderChart = () => {
      if (!ref.current) return;
      
      // Make the chart responsive - use more of container width on mobile
      const containerWidth = ref.current.parentElement.offsetWidth;
      const width = Math.min(600, containerWidth);
      // Ensure minimum height to prevent negative heights
      const height = Math.max(250, Math.min(300, width * 0.5));
      
      const svg = d3.select(ref.current)
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      svg.selectAll('*').remove(); // pulisce prima di ridisegnare

      // Adjust margins based on width - ensure margins don't exceed chart size
      const marginLeft = width < 400 ? 30 : 40;
      const marginRight = width < 400 ? 10 : 20;
      const marginBottom = width < 400 ? 25 : 30;
      const marginTop = 10;
      
      // Safety check: ensure chart area is positive
      const chartHeight = height - marginTop - marginBottom;
      const chartWidth = width - marginLeft - marginRight;
      if (chartHeight <= 0 || chartWidth <= 0) return;

      const x = d3.scaleLinear()
        .domain([1, 6])
        .range([marginLeft, width - marginRight]);
      
      const y = d3.scaleLinear()
        .domain([0, d3.max([...data1, ...data2], d => d.y)])
        .nice()
        .range([height - marginBottom, marginTop]);

      // Create line generator
      const line = d3.line()
        .x(d => x(d.x))
        .y(d => y(d.y));

      svg.append('g')
        .attr('transform', `translate(0, ${height - marginBottom})`)
        .call(d3.axisBottom(x).tickFormat(d => Math.round(d)));

      svg.append('g')
        .attr('transform', `translate(${marginLeft},0)`)
        .call(d3.axisLeft(y));

      // Draw the first line path
      svg.append('path')
        .datum(data1)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 2)
        .attr('d', line);

      // Draw the second line path
      svg.append('path')
        .datum(data2)
        .attr('fill', 'none')
        .attr('stroke', 'coral')
        .attr('stroke-width', 2)
        .attr('d', line);

      // Add data points for line 1 (circles)
      svg.selectAll('circle.line1')
        .data(data1)
        .join('circle')
        .attr('class', 'line1')
        .attr('cx', d => x(d.x))
        .attr('cy', d => y(d.y))
        .attr('r', 4)
        .attr('fill', 'steelblue');

      // Add data points for line 2 (circles)
      svg.selectAll('circle.line2')
        .data(data2)
        .join('circle')
        .attr('class', 'line2')
        .attr('cx', d => x(d.x))
        .attr('cy', d => y(d.y))
        .attr('r', 4)
        .attr('fill', 'coral');
    };

    renderChart();

    // Add resize listener
    const handleResize = () => renderChart();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return <svg ref={ref} style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }}></svg>;
}
