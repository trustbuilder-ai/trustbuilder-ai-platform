import { useState, useEffect, useRef } from 'react';

export interface MessageAnimationState {
  displayedText: string;
  isComplete: boolean;
  isAnimating: boolean;
}

const WORDS_PER_SECOND = 40; // Base streaming speed
const INTERVAL_MS = 50; // Update frequency
const TARGET_COMPLETION_PROGRESS = 0.75; // Complete at 75% scroll progress

export function useMessageAnimation(
  fullText: string,
  progress: number,  // Scroll progress from 0 to 1
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
  const lastProgress = useRef(0);

  useEffect(() => {
    // Split text into words once
    words.current = fullText.split(' ');
  }, [fullText]);

  useEffect(() => {
    // Start condition: active, can start, hasn't started yet, and some scroll progress
    if (isActive && canStart && !hasStarted.current && progress > 0) {
      hasStarted.current = true;
      lastProgress.current = progress;
      
      // Start the interval for continuous streaming with progress-based acceleration
      intervalRef.current = setInterval(() => {
        if (currentWordIndex.current < words.current.length) {
          // Calculate target words based on scroll progress
          const adjustedProgress = Math.min(progress / TARGET_COMPLETION_PROGRESS, 1);
          const targetWordCount = Math.floor(words.current.length * adjustedProgress);
          
          // Also apply time-based streaming for smooth animation
          const wordsPerInterval = (WORDS_PER_SECOND * INTERVAL_MS) / 1000;
          const timeBasedIndex = currentWordIndex.current + Math.ceil(wordsPerInterval);
          
          // Use the higher of progress-based or time-based to ensure smooth streaming
          const newIndex = Math.min(
            Math.max(targetWordCount, timeBasedIndex),
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
    
    // Update based on scroll progress changes
    if (isActive && hasStarted.current && Math.abs(progress - lastProgress.current) > 0.01) {
      lastProgress.current = progress;
      
      // Calculate words to display based on progress
      const adjustedProgress = Math.min(progress / TARGET_COMPLETION_PROGRESS, 1);
      const targetWordCount = Math.floor(words.current.length * adjustedProgress);
      
      // Only update if we need to show more words
      if (targetWordCount > currentWordIndex.current) {
        currentWordIndex.current = targetWordCount;
        const displayedText = words.current.slice(0, targetWordCount).join(' ');
        const isComplete = targetWordCount >= words.current.length;
        
        setState({
          displayedText,
          isComplete,
          isAnimating: !isComplete && intervalRef.current !== null
        });
      }
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
          // Calculate target based on progress
          const adjustedProgress = Math.min(progress / TARGET_COMPLETION_PROGRESS, 1);
          const targetWordCount = Math.floor(words.current.length * adjustedProgress);
          
          // Time-based increment for smooth animation
          const wordsPerInterval = (WORDS_PER_SECOND * INTERVAL_MS) / 1000;
          const timeBasedIndex = currentWordIndex.current + Math.ceil(wordsPerInterval);
          
          // Use the higher value to ensure we meet progress requirements
          const newIndex = Math.min(
            Math.max(targetWordCount, timeBasedIndex),
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