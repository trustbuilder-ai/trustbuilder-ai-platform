import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SpringValue, to } from '@react-spring/web';
import { useD3 } from '../../hooks/useD3';
import {
  getChartDimensions,
  createTooltip,
  showTooltip,
  hideTooltip,
  interpolateProgress,
} from './ChartUtils';
import './ChartStyles.css';

interface PieChartProps {
  data: Array<{ application?: string; label?: string; usage?: number; value?: number }>;
  metadata?: any;
  label?: any;
  progress: SpringValue<number>;
  isAnimating: boolean;
  hasAnimated: boolean;
}

const PieChart: React.FC<PieChartProps> = ({
  data,
  metadata = {},
  progress,
  isAnimating,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, HTMLElement, any> | null>(null);

  // Update dimensions on mount and resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth } = containerRef.current;
        const size = Math.min(clientWidth - 40, 400);
        setDimensions({ width: size, height: size });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Create tooltip on mount
  useEffect(() => {
    tooltipRef.current = createTooltip();
    return () => {
      tooltipRef.current?.remove();
    };
  }, []);

  const svgRef = useD3(
    (svg) => {
      const { width, height } = dimensions;
      const radius = Math.min(width, height) / 2;
      const innerRadius = metadata.innerRadius || 0;
      const padAngle = metadata.padAngle || 0;
      const cornerRadius = metadata.cornerRadius || 0;
      const colors = metadata.colors || [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
        '#FFA07A', '#98D8C8', '#F7DC6F',
      ];

      // Process data
      const processedData = data.map(d => ({
        label: d.application || d.label || 'Unknown',
        value: d.usage || d.value || 0,
      }));

      // Set up dimensions
      svg
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');

      const g = svg
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

      // Create pie generator
      const pie = d3.pie<{ label: string; value: number }>()
        .value(d => d.value)
        .sort(null)
        .padAngle(padAngle);

      // Create arc generator
      const arc = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
        .innerRadius(innerRadius)
        .outerRadius(radius - 10)
        .cornerRadius(cornerRadius);

      // Create label arc for positioning labels
      const labelArc = d3.arc<d3.PieArcDatum<{ label: string; value: number }>>()
        .innerRadius(radius * 0.6)
        .outerRadius(radius * 0.6);

      // Color scale
      const color = d3.scaleOrdinal(colors);

      // Generate pie data
      const pieData = pie(processedData);

      // Create slices
      const slices = g
        .selectAll('.slice')
        .data(pieData)
        .enter()
        .append('g')
        .attr('class', 'slice');

      // Add paths with animation
      const progressValue = progress.get ? progress.get() : 0;
      
      slices
        .append('path')
        .attr('fill', (d, i) => color(String(i)))
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .style('opacity', 0.9)
        .style('cursor', 'pointer')
        .each(function(d) {
          const path = d3.select(this);
          
          // Interpolate the arc based on current progress
          const interpolatedEndAngle = interpolateProgress(
            d.startAngle,
            d.endAngle,
            progressValue
          );
          
          path.attr('d', arc({
            ...d,
            endAngle: interpolatedEndAngle,
          }));
        })
        .on('mouseenter', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('transform', function() {
              const [x, y] = arc.centroid(d);
              return `translate(${x * 0.1},${y * 0.1})`;
            })
            .style('opacity', 1);

          if (tooltipRef.current) {
            const percentage = ((d.value / d3.sum(processedData, p => p.value)) * 100).toFixed(1);
            showTooltip(
              tooltipRef.current,
              `<strong>${d.data.label}</strong><br/>${d.value}% (${percentage}% of total)`,
              event
            );
          }
        })
        .on('mouseleave', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('transform', 'translate(0,0)')
            .style('opacity', 0.9);

          if (tooltipRef.current) {
            hideTooltip(tooltipRef.current);
          }
        });

      // Add labels if enabled
      if (metadata.showLabels !== false) {
        slices
          .append('text')
          .attr('transform', d => `translate(${labelArc.centroid(d)})`)
          .attr('text-anchor', 'middle')
          .style('font-size', '12px')
          .style('font-weight', '500')
          .style('fill', 'white')
          .style('pointer-events', 'none')
          .style('opacity', 0)
          .text(d => {
            const percentage = ((d.value / d3.sum(processedData, p => p.value)) * 100);
            return percentage > 5 ? `${d.data.label}` : '';
          })
          .transition()
          .delay(500)
          .duration(500)
          .style('opacity', 1);
      }

      // Add center text for donut charts
      if (innerRadius > 0 && metadata.centerText) {
        const centerGroup = g.append('g').attr('class', 'center-text');

        if (metadata.centerText.primary) {
          centerGroup
            .append('text')
            .attr('y', -5)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text(metadata.centerText.primary);
        }

        if (metadata.centerText.secondary) {
          centerGroup
            .append('text')
            .attr('y', 15)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#666')
            .text(metadata.centerText.secondary);
        }
      }
    },
    [data, metadata, dimensions, progress]
  );

  return (
    <div ref={containerRef} className="pie-chart-container" style={{ width: '100%' }}>
      <svg ref={svgRef} />
    </div>
  );
};

export default PieChart;