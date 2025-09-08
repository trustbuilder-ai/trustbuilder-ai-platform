import { useState, useEffect, useRef } from 'react';

export interface MessageAnimationState {
  displayedText: string;
  isComplete: boolean;
  isAnimating: boolean;
}

const WORDS_PER_SECOND = 40; // Adjust for desired streaming speed
const INTERVAL_MS = 50; // Update frequency

export function useMessageAnimation(
  fullText: string,
  progress: number,
  isActive: boolean,
  canStart: boolean = true
) {
  const [state, setState] = useState<MessageAnimationState>({
    displayedText: '',
    isComplete: false,
    isAnimating: false
  });
  
  const hasStarted = useRef(false);
  const currentWordIndex = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const words = useRef<string[]>([]);

  useEffect(() => {
    // Split text into words once
    words.current = fullText.split(' ');
  }, [fullText]);

  useEffect(() => {
    // Start condition: active, can start, hasn't started yet, and some scroll progress
    if (isActive && canStart && !hasStarted.current && progress > 0) {
      hasStarted.current = true;
      
      // Start the interval for continuous streaming
      intervalRef.current = setInterval(() => {
        if (currentWordIndex.current < words.current.length) {
          // Calculate how many words to add per interval
          const wordsPerInterval = (WORDS_PER_SECOND * INTERVAL_MS) / 1000;
          const newIndex = Math.min(
            currentWordIndex.current + Math.ceil(wordsPerInterval),
            words.current.length
          );
          
          currentWordIndex.current = newIndex;
          const displayedText = words.current.slice(0, newIndex).join(' ');
          const isComplete = newIndex >= words.current.length;
          
          setState({
            displayedText,
            isComplete,
            isAnimating: !isComplete
          });
          
          // Clear interval when complete
          if (isComplete && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, INTERVAL_MS);
    }
    
    // Pause if scrolled out of view
    if (!isActive && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setState(prev => ({ ...prev, isAnimating: false }));
    }
    
    // Resume if scrolled back into view and not complete
    if (isActive && hasStarted.current && !intervalRef.current && currentWordIndex.current < words.current.length) {
      intervalRef.current = setInterval(() => {
        if (currentWordIndex.current < words.current.length) {
          const wordsPerInterval = (WORDS_PER_SECOND * INTERVAL_MS) / 1000;
          const newIndex = Math.min(
            currentWordIndex.current + Math.ceil(wordsPerInterval),
            words.current.length
          );
          
          currentWordIndex.current = newIndex;
          const displayedText = words.current.slice(0, newIndex).join(' ');
          const isComplete = newIndex >= words.current.length;
          
          setState({
            displayedText,
            isComplete,
            isAnimating: !isComplete
          });
          
          if (isComplete && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }, INTERVAL_MS);
    }
    
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, canStart, progress]);

  return state;
}

export function useSequentialMessageAnimation(messageCount: number) {
  const [completedMessages, setCompletedMessages] = useState<Set<number>>(new Set());
  
  const markComplete = (messageIndex: number) => {
    setCompletedMessages(prev => new Set(prev).add(messageIndex));
  };
  
  const canStartMessage = (messageIndex: number) => {
    if (messageIndex === 0) return true;
    return completedMessages.has(messageIndex - 1);
  };
  
  const reset = () => {
    setCompletedMessages(new Set());
  };
  
  return {
    completedMessages,
    markComplete,
    canStartMessage,
    reset
  };
}