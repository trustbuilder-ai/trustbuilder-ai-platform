import React from 'react';
import { isTemporaryId } from '../utils/forkUtils';
import './LLMUIMessage.css'; // Reuse the existing LLM UI styles

interface LLMUIWrapperProps {
  role: string;
  children: React.ReactNode;
  showActions?: boolean;
  onFork?: () => void;
  onTreeView?: () => void;
  isDraft?: boolean;
  messageId?: number;
}

/**
 * A styling wrapper that provides LLM UI appearance without streaming logic.
 * This component is purely presentational - it wraps the actual content
 * (which handles its own animation/streaming) with LLM UI styling.
 */
const LLMUIWrapper: React.FC<LLMUIWrapperProps> = ({
  role,
  children,
  showActions = false,
  onFork,
  onTreeView,
  isDraft = false,
  messageId
}) => {
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
    <div className={`llm-ui-message ${getRoleClass(role)} ${isDraft ? 'llm-ui-draft' : ''}`}>
      <div className="llm-ui-message-header">
        <span className="llm-ui-message-role">{getRoleLabel(role)}</span>
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
        {children}
      </div>
    </div>
  );
};

export default LLMUIWrapper;