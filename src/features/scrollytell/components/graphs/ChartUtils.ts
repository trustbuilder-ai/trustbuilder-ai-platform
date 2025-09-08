import * as d3 from 'd3';

/**
 * Common chart dimensions and margins
 */
export interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  innerWidth: number;
  innerHeight: number;
}

/**
 * Calculate inner dimensions based on margins
 */
export const getChartDimensions = (
  width: number,
  height: number,
  margin = { top: 20, right: 20, bottom: 40, left: 40 }
): ChartDimensions => {
  return {
    width,
    height,
    margin,
    innerWidth: width - margin.left - margin.right,
    innerHeight: height - margin.top - margin.bottom,
  };
};

/**
 * Create responsive SVG container
 */
export const createSvgContainer = (
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  dimensions: ChartDimensions
) => {
  svg
    .attr('width', dimensions.width)
    .attr('height', dimensions.height)
    .attr('viewBox', `0 0 ${dimensions.width} ${dimensions.height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  const g = svg
    .append('g')
    .attr('transform', `translate(${dimensions.margin.left},${dimensions.margin.top})`);

  return g;
};

/**
 * Default color palette for charts
 */
export const defaultColors = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E2',
  '#F8B739',
];

/**
 * Get color scale
 */
export const getColorScale = (
  domain: string[] | number[],
  colors?: string[]
): d3.ScaleOrdinal<string, string> => {
  const colorArray = colors || defaultColors;
  return d3.scaleOrdinal<string>()
    .domain(domain.map(String))
    .range(colorArray);
};

/**
 * Format numbers for display
 */
export const formatNumber = (value: number, decimals = 0): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(decimals)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(decimals)}K`;
  }
  return value.toFixed(decimals);
};

/**
 * Wrap text to fit within a given width
 */
export const wrapText = (
  text: d3.Selection<SVGTextElement, any, any, any>,
  width: number
) => {
  text.each(function() {
    const textElement = d3.select(this);
    const words = textElement.text().split(/\s+/).reverse();
    const lineHeight = 1.1;
    const y = textElement.attr('y');
    const dy = parseFloat(textElement.attr('dy') || '0');
    let line: string[] = [];
    let lineNumber = 0;
    let word: string | undefined;
    let tspan = textElement
      .text(null)
      .append('tspan')
      .attr('x', 0)
      .attr('y', y)
      .attr('dy', `${dy}em`);

    while ((word = words.pop())) {
      line.push(word);
      tspan.text(line.join(' '));
      const node = tspan.node();
      if (node && node.getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(' '));
        line = [word];
        tspan = textElement
          .append('tspan')
          .attr('x', 0)
          .attr('y', y)
          .attr('dy', `${++lineNumber * lineHeight + dy}em`)
          .text(word);
      }
    }
  });
};

/**
 * Create tooltip div
 */
export const createTooltip = () => {
  return d3
    .select('body')
    .append('div')
    .attr('class', 'chart-tooltip')
    .style('position', 'absolute')
    .style('padding', '10px')
    .style('background', 'rgba(0, 0, 0, 0.8)')
    .style('color', 'white')
    .style('border-radius', '4px')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('font-size', '12px')
    .style('z-index', 1000);
};

/**
 * Show tooltip
 */
export const showTooltip = (
  tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>,
  content: string,
  event: MouseEvent
) => {
  tooltip
    .style('opacity', 1)
    .html(content)
    .style('left', `${event.pageX + 10}px`)
    .style('top', `${event.pageY - 28}px`);
};

/**
 * Hide tooltip
 */
export const hideTooltip = (
  tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, any>
) => {
  tooltip.style('opacity', 0);
};

/**
 * Interpolate value based on progress (0 to 1)
 */
export const interpolateProgress = (
  startValue: number,
  endValue: number,
  progress: number
): number => {
  return startValue + (endValue - startValue) * Math.min(1, Math.max(0, progress));
};

/**
 * Get responsive dimensions based on container
 */
export const getResponsiveDimensions = (
  container: HTMLElement | null,
  aspectRatio = 16 / 9,
  maxWidth = 800,
  maxHeight = 600
): { width: number; height: number } => {
  if (!container) {
    return { width: maxWidth, height: maxHeight };
  }

  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  let width = Math.min(containerWidth, maxWidth);
  let height = width / aspectRatio;

  if (height > containerHeight || height > maxHeight) {
    height = Math.min(containerHeight, maxHeight);
    width = height * aspectRatio;
  }

  return { width, height };
};

/**
 * Animation easing functions
 */
export const easings = {
  easeInOut: d3.easeCubicInOut,
  easeOut: d3.easeCubicOut,
  easeIn: d3.easeCubicIn,
  elastic: d3.easeElasticOut,
  bounce: d3.easeBounceOut,
};