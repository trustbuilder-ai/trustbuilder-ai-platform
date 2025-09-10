import React, { useMemo } from 'react';
import { useLLMOutput, useStreamExample } from '@llm-ui/react';
import { markdownLookBack } from '@llm-ui/markdown';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageContainer } from '../types';
import './LLMUIMessage.css';

interface LLMUIMessageProps {
  message: MessageContainer;
  isStreaming?: boolean;
  streamProgress?: number;
  onComplete?: () => void;
  showActions?: boolean;
  onFork?: () => void;
  onTreeView?: () => void;
  truncate?: boolean;
  maxLength?: number;
}

const LLMUIMessage: React.FC<LLMUIMessageProps> = ({
  message,
  isStreaming = false,
  streamProgress = 1,
  onComplete,
  showActions = false,
  onFork,
  onTreeView,
  truncate = false,
  maxLength = 100
}) => {
  // For streaming mode in ScrollyTell view
  const streamOptions = useMemo(() => ({
    autoStart: isStreaming,
    startIndex: 0,
    delayMultiplier: 1 - streamProgress, // Faster as progress increases
  }), [isStreaming, streamProgress]);

  const { output: streamedOutput, isStreamFinished } = useStreamExample(
    message.message.content,
    isStreaming ? streamOptions : { autoStart: false }
  );

  // Call onComplete when streaming finishes
  React.useEffect(() => {
    if (isStreaming && isStreamFinished && onComplete) {
      onComplete();
    }
  }, [isStreaming, isStreamFinished, onComplete]);

  // Use LLM UI's markdown rendering with lookback for better display
  const { blockMatches } = useLLMOutput({
    llmOutput: isStreaming ? streamedOutput : message.message.content,
    blocks: [],
    fallbackBlock: {
      component: ({ blockMatch }: { blockMatch: any }) => (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {blockMatch.output}
        </ReactMarkdown>
      ),
      lookBack: markdownLookBack(),
    },
    isStreamFinished: !isStreaming || isStreamFinished,
  });

  const displayContent = truncate && !isStreaming
    ? message.message.content.substring(0, maxLength) + (message.message.content.length > maxLength ? '...' : '')
    : undefined;

  const getRoleClass = (role: string) => {
    switch (role) {
      case 'system':
        return 'llm-ui-system';
      case 'user':
        return 'llm-ui-user';
      case 'assistant':
        return 'llm-ui-assistant';
      default:
        return '';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'system':
        return 'System';
      case 'user':
        return 'User';
      case 'assistant':
        return 'Assistant';
      default:
        return role;
    }
  };

  return (
    <div className={`llm-ui-message ${getRoleClass(message.message.role)}`}>
      <div className="llm-ui-message-header">
        <span className="llm-ui-message-role">{getRoleLabel(message.message.role)}</span>
        {showActions && (
          <div className="llm-ui-message-actions">
            {onFork && (
              <button 
                className="llm-ui-action-button fork-button" 
                onClick={onFork}
                title="Fork conversation from here"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
                </svg>
                Fork
              </button>
            )}
            {onTreeView && (
              <button 
                className="llm-ui-action-button tree-button" 
                onClick={onTreeView}
                title="View in tree"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M1.5 1.75a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-8.5a.75.75 0 00-.75-.75h-5.5zm.75 7.5v-6.5h4v6.5h-4z"/>
                  <path d="M3 9.25h4v1.5H3z"/>
                  <path d="M9.5 4.75a.75.75 0 00-.75.75v5.5c0 .414.336.75.75.75h5a.75.75 0 00.75-.75v-5.5a.75.75 0 00-.75-.75h-5zm.75 5v-3.5h3.5v3.5h-3.5z"/>
                </svg>
                Tree View
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="llm-ui-message-content">
        {truncate && displayContent ? (
          <div className="llm-ui-message-text">{displayContent}</div>
        ) : (
          blockMatches.map((blockMatch: any, index: number) => (
            <div key={index} className="llm-ui-block">
              {React.createElement(blockMatch.block.component, { blockMatch })}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LLMUIMessage;