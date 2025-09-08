import React, { useEffect, useRef } from 'react';
import { useMessageAnimation } from '../hooks';
import './StreamingText.css';

interface StreamingTextProps {
  text: string;
  progress: number;
  isActive: boolean;
  canStart?: boolean;
  onComplete?: () => void;
  className?: string;
}

const StreamingText: React.FC<StreamingTextProps> = ({
  text,
  progress,
  isActive,
  canStart = true,
  onComplete,
  className = ''
}) => {
  const { displayedText, isComplete, isAnimating } = useMessageAnimation(
    text,
    progress,
    isActive,
    canStart
  );
  
  const hasCalledComplete = useRef(false);

  useEffect(() => {
    if (isComplete && onComplete && !hasCalledComplete.current) {
      hasCalledComplete.current = true;
      onComplete();
    }
  }, [isComplete, onComplete]);

  return (
    <div className={`streaming-text ${className} ${isAnimating ? 'animating' : ''}`}>
      <span className="displayed-text">{displayedText}</span>
      {isAnimating && <span className="cursor">▊</span>}
    </div>
  );
};

export default StreamingText;