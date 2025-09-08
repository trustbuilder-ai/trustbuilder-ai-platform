import { useState, useEffect } from 'react';
import { useSpring, SpringValue } from '@react-spring/web';

export interface GraphAnimationState {
  opacity: SpringValue<number>;
  scale: SpringValue<number>;
  progress: SpringValue<number>;
  hasAnimated: boolean;
  isAnimating: boolean;
}

/**
 * Custom hook for managing graph animations based on scroll progress
 * Provides spring animations and state management for data visualizations
 */
export const useGraphAnimation = (
  isActive: boolean,
  scrollProgress: number,
  animationDuration = 1200,
  options?: {
    delay?: number;
    once?: boolean; // If true, animation only plays once
  }
) => {
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Determine if we should animate
  const shouldAnimate = isActive && (!options?.once || !hasAnimated);

  // Spring animations for the graph
  const springs = useSpring({
    opacity: shouldAnimate ? 1 : 0,
    scale: shouldAnimate ? 1 : 0.8,
    progress: shouldAnimate ? scrollProgress : 0,
    config: {
      tension: 120,
      friction: 14,
      clamp: true,
    },
    delay: options?.delay || 0,
    onStart: () => {
      if (shouldAnimate) {
        setIsAnimating(true);
      }
    },
    onRest: () => {
      setIsAnimating(false);
      if (shouldAnimate && !hasAnimated) {
        setHasAnimated(true);
      }
    },
  });

  // Reset animation state when component becomes inactive
  useEffect(() => {
    if (!isActive && !options?.once) {
      setHasAnimated(false);
    }
  }, [isActive, options?.once]);

  return {
    springs,
    hasAnimated,
    isAnimating,
    setHasAnimated,
  };
};

/**
 * Hook for staggered animations (useful for bar charts, list items, etc.)
 */
export const useStaggeredAnimation = (
  itemCount: number,
  isActive: boolean,
  baseDelay = 0,
  staggerDelay = 50
) => {
  const [animatedItems, setAnimatedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isActive) {
      const timers: NodeJS.Timeout[] = [];
      
      for (let i = 0; i < itemCount; i++) {
        const timer = setTimeout(() => {
          setAnimatedItems(prev => new Set(prev).add(i));
        }, baseDelay + (i * staggerDelay));
        
        timers.push(timer);
      }

      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    } else {
      setAnimatedItems(new Set());
    }
  }, [isActive, itemCount, baseDelay, staggerDelay]);

  return animatedItems;
};