import React from 'react';
import { animated } from '@react-spring/web';
import { VisualData } from '../types';
import { useGraphAnimation } from '../hooks/useGraphAnimation';
import PieChart from './graphs/PieChart';
import BarChart from './graphs/BarChart';
import LineChart from './graphs/LineChart';
import './AnimatedGraph.css';

interface AnimatedGraphProps {
  data: VisualData;
  isActive: boolean;
  progress: number;
  className?: string;
}

/**
 * Wrapper component that routes to the appropriate chart type
 * and manages scroll-triggered animations
 */
const AnimatedGraph: React.FC<AnimatedGraphProps> = ({
  data,
  isActive,
  progress,
  className = '',
}) => {
  const animationDuration = data.metadata?.animationDuration || 1200;
  const { springs, hasAnimated, isAnimating } = useGraphAnimation(
    isActive,
    progress,
    animationDuration,
    { once: data.metadata?.animateOnce }
  );

  const renderChart = () => {
    const chartProps = {
      data: data.data,
      metadata: data.metadata,
      label: data.label,
      progress: springs.progress,
      isAnimating,
      hasAnimated,
    };

    switch (data.type) {
      case 'pie':
        return <PieChart {...chartProps} />;
      case 'bar':
        return <BarChart {...chartProps} />;
      case 'line':
        return <LineChart {...chartProps} />;
      default:
        return (
          <div className="chart-placeholder">
            <p>Unsupported chart type: {data.type}</p>
          </div>
        );
    }
  };

  return (
    <animated.div
      className={`animated-graph ${className}`}
      style={{
        opacity: springs.opacity,
        transform: springs.scale.to(s => `scale(${s})`),
      }}
    >
      <div className="graph-container">
        {data.label && (
          <div className="graph-header">
            {typeof data.label === 'object' ? (
              <>
                {data.label.title && <h3 className="graph-title">{data.label.title}</h3>}
                {data.label.subtitle && (
                  <p className="graph-subtitle">{data.label.subtitle}</p>
                )}
              </>
            ) : (
              <h3 className="graph-title">{data.label}</h3>
            )}
          </div>
        )}
        
        <div className="graph-content">
          {renderChart()}
        </div>
      </div>
    </animated.div>
  );
};

export default AnimatedGraph;