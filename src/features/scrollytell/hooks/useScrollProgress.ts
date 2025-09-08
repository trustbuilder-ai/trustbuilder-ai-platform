import { useState, useCallback } from 'react';

export interface ScrollProgressState {
  currentStepIndex: number | null;
  stepProgress: number;
  direction: 'up' | 'down' | null;
}

export function useScrollProgress() {
  const [state, setState] = useState<ScrollProgressState>({
    currentStepIndex: null,
    stepProgress: 0,
    direction: null
  });

  const handleStepEnter = useCallback(({ data, direction }: any) => {
    setState(prev => ({
      ...prev,
      currentStepIndex: data.index,
      direction,
      stepProgress: direction === 'down' ? 0 : 1
    }));
  }, []);

  const handleStepProgress = useCallback(({ data, progress }: any) => {
    setState(prev => ({
      ...prev,
      currentStepIndex: data.index,
      stepProgress: progress
    }));
  }, []);

  const handleStepExit = useCallback(({ direction }: any) => {
    setState(prev => ({
      ...prev,
      direction,
      stepProgress: direction === 'down' ? 1 : 0
    }));
  }, []);

  return {
    ...state,
    handleStepEnter,
    handleStepProgress,
    handleStepExit
  };
}