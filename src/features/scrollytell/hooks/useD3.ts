import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

/**
 * Custom hook for integrating D3.js with React components
 * Handles DOM manipulation and cleanup lifecycle
 */
export const useD3 = (
  renderChartFn: (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>) => void,
  dependencies: React.DependencyList = []
) => {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (ref.current) {
      const svg = d3.select(ref.current);
      
      // Clear previous content
      svg.selectAll('*').remove();
      
      // Render the chart
      renderChartFn(svg);
    }
    
    return () => {
      // Cleanup on unmount or before re-render
      if (ref.current) {
        d3.select(ref.current).selectAll('*').remove();
      }
    };
  }, dependencies);

  return ref;
};

/**
 * Simplified version for when you need more control over the lifecycle
 */
export const useD3Ref = () => {
  const ref = useRef<SVGSVGElement>(null);
  
  const select = () => {
    if (!ref.current) return null;
    return d3.select(ref.current);
  };
  
  const clear = () => {
    if (ref.current) {
      d3.select(ref.current).selectAll('*').remove();
    }
  };
  
  return { ref, select, clear };
};