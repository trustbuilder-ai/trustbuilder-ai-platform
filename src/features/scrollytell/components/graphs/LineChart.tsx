import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SpringValue } from '@react-spring/web';
import { useD3 } from '../../hooks/useD3';
import {
  getChartDimensions,
  createTooltip,
  showTooltip,
  hideTooltip,
  formatNumber,
} from './ChartUtils';
import './ChartStyles.css';

interface LineChartProps {
  data: Array<{ x?: any; y?: number; label?: string; [key: string]: any }> | 
        { series: Array<{ name: string; values: Array<{ x: any; y: number }> }> };
  metadata?: any;
  label?: any;
  progress: SpringValue<number>;
  isAnimating: boolean;
  hasAnimated: boolean;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  metadata = {},
  progress,
  isAnimating,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth } = containerRef.current;
        const width = Math.min(clientWidth - 40, 800);
        const height = metadata.height || 400;
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [metadata.height]);

  // Create tooltip on mount
  useEffect(() => {
    tooltipRef.current = createTooltip();
    return () => {
      tooltipRef.current?.remove();
    };
  }, []);

  const svgRef = useD3(
    (svg) => {
      const chartDimensions = getChartDimensions(
        dimensions.width,
        dimensions.height,
        metadata.margin || { top: 20, right: 80, bottom: 60, left: 60 }
      );

      const { innerWidth, innerHeight, margin } = chartDimensions;

      // Process data - handle both single and multi-series
      let series: Array<{ name: string; values: Array<{ x: any; y: number }> }>;
      
      if ('series' in data) {
        series = data.series;
      } else if (Array.isArray(data)) {
        // Single series
        series = [{
          name: metadata.seriesName || 'Series 1',
          values: data.map(d => ({
            x: d.x || d.label || '',
            y: d.y || d.value || 0,
          })),
        }];
      } else {
        series = [];
      }

      // Set up SVG
      svg
        .attr('width', dimensions.width)
        .attr('height', dimensions.height)
        .attr('viewBox', `0 0 ${dimensions.width} ${dimensions.height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      const g = svg
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      // Scales
      const allValues = series.flatMap(s => s.values);
      
      const xScale = metadata.xScaleType === 'time' 
        ? d3.scaleTime()
            .domain(d3.extent(allValues, d => new Date(d.x)) as [Date, Date])
            .range([0, innerWidth])
        : d3.scalePoint()
            .domain(allValues.map(d => String(d.x)))
            .range([0, innerWidth])
            .padding(0.1);

      const yScale = d3.scaleLinear()
        .domain([
          d3.min(allValues, d => d.y) || 0,
          d3.max(allValues, d => d.y) || 0,
        ])
        .nice()
        .range([innerHeight, 0]);

      // Color scale
      const colorScale = d3.scaleOrdinal()
        .domain(series.map(s => s.name))
        .range(metadata.colors || [
          '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
          '#FFA07A', '#98D8C8', '#F7DC6F',
        ]);

      // Line generator
      const line = d3.line<{ x: any; y: number }>()
        .x(d => {
          if (metadata.xScaleType === 'time') {
            return xScale(new Date(d.x) as any) || 0;
          }
          return (xScale as d3.ScalePoint<string>)(String(d.x)) || 0;
        })
        .y(d => yScale(d.y))
        .curve(metadata.curve || d3.curveMonotoneX);

      // X Axis
      const xAxis = g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(
          metadata.xScaleType === 'time'
            ? d3.axisBottom(xScale as d3.ScaleTime<number, number>)
            : d3.axisBottom(xScale as d3.ScalePoint<string>)
        );

      // Rotate x-axis labels if needed
      if (metadata.rotateLabels) {
        xAxis.selectAll('text')
          .style('text-anchor', 'end')
          .attr('dx', '-.8em')
          .attr('dy', '.15em')
          .attr('transform', 'rotate(-45)');
      }

      // Y Axis
      g.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(yScale).tickFormat(d => formatNumber(Number(d))));

      // Y Axis label
      if (metadata.yAxisLabel) {
        g.append('text')
          .attr('transform', 'rotate(-90)')
          .attr('y', 0 - margin.left)
          .attr('x', 0 - (innerHeight / 2))
          .attr('dy', '1em')
          .style('text-anchor', 'middle')
          .style('font-size', '12px')
          .text(metadata.yAxisLabel);
      }

      // Grid lines
      if (metadata.showGrid !== false) {
        // Horizontal grid lines
        g.append('g')
          .attr('class', 'grid')
          .style('stroke-dasharray', '3,3')
          .style('opacity', 0.3)
          .call(
            d3.axisLeft(yScale)
              .tickSize(-innerWidth)
              .tickFormat(() => '')
          );
      }

      // Draw lines for each series
      series.forEach((s, i) => {
        const lineGroup = g.append('g')
          .attr('class', `line-series series-${i}`);

        // Line path with animation
        const path = lineGroup
          .append('path')
          .datum(s.values)
          .attr('fill', 'none')
          .attr('stroke', colorScale(s.name))
          .attr('stroke-width', metadata.strokeWidth || 2)
          .attr('d', line)
          .style('opacity', 0.8);

        // Animate line drawing
        const totalLength = (path.node() as SVGPathElement)?.getTotalLength() || 0;
        const progressValue = progress.get ? Math.min(1, Math.max(0, progress.get())) : 0;
        
        path
          .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
          .attr('stroke-dashoffset', totalLength)
          .transition()
          .duration(1000)
          .ease(d3.easeCubicOut)
          .attr('stroke-dashoffset', totalLength * (1 - progressValue));

        // Add dots for data points
        const dots = lineGroup
          .selectAll('.dot')
          .data(s.values)
          .enter()
          .append('circle')
          .attr('class', 'dot')
          .attr('cx', d => {
            if (metadata.xScaleType === 'time') {
              return xScale(new Date(d.x) as any) || 0;
            }
            return (xScale as d3.ScalePoint<string>)(String(d.x)) || 0;
          })
          .attr('cy', d => yScale(d.y))
          .attr('r', 0)
          .attr('fill', colorScale(s.name))
          .style('cursor', 'pointer');

        // Animate dots appearance
        dots.each(function(d, j) {
          const dot = d3.select(this);
          const dotDelay = j / s.values.length * 0.3;
          const dotProgress = Math.min(1, Math.max(0, (progressValue - 0.5 - dotDelay) / (0.5 - dotDelay)));
          
          dot
            .transition()
            .delay(500 + j * 50)
            .duration(300)
            .attr('r', dotProgress * 4);
        });

        // Hover effects on dots
        dots
          .on('mouseenter', function(event, d) {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('r', 6);

            if (tooltipRef.current) {
              showTooltip(
                tooltipRef.current,
                `<strong>${s.name}</strong><br/>X: ${d.x}<br/>Y: ${formatNumber(d.y)}`,
                event
              );
            }
          })
          .on('mouseleave', function() {
            d3.select(this)
              .transition()
              .duration(200)
              .attr('r', 4);

            if (tooltipRef.current) {
              hideTooltip(tooltipRef.current);
            }
          });
      });

      // Legend for multi-series
      if (series.length > 1 && metadata.showLegend !== false) {
        const legend = g.append('g')
          .attr('class', 'legend')
          .attr('transform', `translate(${innerWidth + 10}, 20)`);

        series.forEach((s, i) => {
          const legendItem = legend.append('g')
            .attr('transform', `translate(0, ${i * 20})`);

          legendItem.append('rect')
            .attr('width', 10)
            .attr('height', 10)
            .attr('fill', colorScale(s.name));

          legendItem.append('text')
            .attr('x', 15)
            .attr('y', 9)
            .style('font-size', '12px')
            .text(s.name);
        });
      }
    },
    [data, metadata, dimensions, progress]
  );

  return (
    <div ref={containerRef} className="line-chart-container" style={{ width: '100%' }}>
      <svg ref={svgRef} />
    </div>
  );
};

export default LineChart;