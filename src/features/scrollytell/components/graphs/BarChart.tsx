import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SpringValue } from '@react-spring/web';
import { useD3 } from '../../hooks/useD3';
import {
  getChartDimensions,
  createTooltip,
  showTooltip,
  hideTooltip,
  interpolateProgress,
  formatNumber,
} from './ChartUtils';
import './ChartStyles.css';

interface BarChartProps {
  data: Array<{ category?: string; label?: string; value?: number; [key: string]: any }>;
  metadata?: any;
  label?: any;
  progress: SpringValue<number>;
  isAnimating: boolean;
  hasAnimated: boolean;
}

const BarChart: React.FC<BarChartProps> = ({
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
        metadata.margin || { top: 20, right: 30, bottom: 60, left: 60 }
      );

      const { innerWidth, innerHeight, margin } = chartDimensions;

      // Process data
      const processedData = data.map(d => ({
        category: d.category || d.label || 'Unknown',
        value: d.value || 0,
        ...d,
      }));

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
      const xScale = d3.scaleBand()
        .domain(processedData.map(d => d.category))
        .range([0, innerWidth])
        .padding(metadata.padding || 0.1);

      const yScale = d3.scaleLinear()
        .domain([0, d3.max(processedData, d => d.value) || 0])
        .nice()
        .range([innerHeight, 0]);

      // Color scale
      const colorScale = d3.scaleOrdinal()
        .domain(processedData.map(d => d.category))
        .range(metadata.colors || [
          '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
          '#FFA07A', '#98D8C8', '#F7DC6F',
        ]);

      // X Axis
      const xAxis = g.append('g')
        .attr('class', 'x-axis')
        .attr('transform', `translate(0,${innerHeight})`)
        .call(d3.axisBottom(xScale));

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

      // Bars with animation
      const bars = g.selectAll('.bar')
        .data(processedData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.category) || 0)
        .attr('width', xScale.bandwidth())
        .attr('y', innerHeight)
        .attr('height', 0)
        .attr('fill', d => colorScale(d.category))
        .attr('rx', metadata.cornerRadius || 0)
        .style('cursor', 'pointer')
        .style('opacity', 0.9);

      // Animate bars based on progress
      const progressValue = progress.get ? Math.min(1, Math.max(0, progress.get())) : 0;
      
      bars.each(function(d, i) {
        const bar = d3.select(this);
        const totalBars = processedData.length;
        const barDelay = i / totalBars * 0.3; // Stagger effect
        const barProgress = Math.min(1, Math.max(0, (progressValue - barDelay) / (1 - barDelay)));
        
        const targetHeight = innerHeight - yScale(d.value);
        const currentHeight = interpolateProgress(0, targetHeight, barProgress);
        
        bar
          .transition()
          .duration(500)
          .ease(d3.easeCubicOut)
          .attr('height', currentHeight)
          .attr('y', innerHeight - currentHeight);
      });

      // Hover effects
      bars
        .on('mouseenter', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .style('opacity', 1)
            .attr('transform', 'scale(1.02)');

          if (tooltipRef.current) {
            showTooltip(
              tooltipRef.current,
              `<strong>${d.category}</strong><br/>Value: ${formatNumber(d.value)}`,
              event
            );
          }

          // Show value label on bar
          g.append('text')
            .attr('class', 'value-label')
            .attr('x', (xScale(d.category) || 0) + xScale.bandwidth() / 2)
            .attr('y', yScale(d.value) - 5)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text(formatNumber(d.value))
            .style('opacity', 0)
            .transition()
            .duration(200)
            .style('opacity', 1);
        })
        .on('mouseleave', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .style('opacity', 0.9)
            .attr('transform', 'scale(1)');

          if (tooltipRef.current) {
            hideTooltip(tooltipRef.current);
          }

          g.selectAll('.value-label').remove();
        });

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
    },
    [data, metadata, dimensions, progress]
  );

  return (
    <div ref={containerRef} className="bar-chart-container" style={{ width: '100%' }}>
      <svg ref={svgRef} />
    </div>
  );
};

export default BarChart;