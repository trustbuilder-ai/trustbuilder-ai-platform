import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageContainer } from '../types';
import StreamingText from './StreamingText';
import { useScrollyTell } from '../context/ScrollyTellContext';
import { isTemporaryId } from '../utils/forkUtils';
import './MessageDisplay.css';

interface MessageDisplayProps {
  message: MessageContainer;
  progress: number;
  isActive: boolean;
  canStart: boolean;
  onComplete?: () => void;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({
  message,
  progress,
  isActive,
  canStart,
  onComplete
}) => {
  const navigate = useNavigate();
  const { forkMessage, setCurrentView } = useScrollyTell();
  
  const handleFork = () => {
    // Create a new forked message from this message
    const forkedMessage = forkMessage(message.id, 'user', '');
    
    if (forkedMessage) {
      // Navigate to chat view with the new forked message as the leaf
      // This gives users a fresh chat canvas starting from the fork point
      setCurrentView('chat');
      navigate('/scrollytell/chat');
      console.log(`Created fork from message ${message.id}, opening chat with new leaf ${forkedMessage.id}`);
    } else {
      console.error('Failed to create fork from message:', message.id);
    }
  };
  
  const handleTreeView = () => {
    // Navigate to tree view with this message centered
    navigate(`/scrollytell/tree?messageId=${message.id}`);
  };
  
  const getRoleClass = (role: string) => {
    switch (role) {
      case 'system':
        return 'message-system';
      case 'user':
        return 'message-user';
      case 'assistant':
        return 'message-assistant';
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
  
  const isDraft = isTemporaryId(message.id);
  
  return (
    <div className={`message-display ${getRoleClass(message.message.role)} ${isDraft ? 'message-draft' : ''}`}>
      <div className="message-header">
        <span className="message-role">{getRoleLabel(message.message.role)}</span>
        <div className="message-actions">
          <button 
            className="action-button fork-button" 
            onClick={handleFork}
            title="Fork conversation from here"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"/>
            </svg>
            Fork
          </button>
          <button 
            className="action-button tree-button" 
            onClick={handleTreeView}
            title="View in tree"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1.5 1.75a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-8.5a.75.75 0 00-.75-.75h-5.5zm.75 7.5v-6.5h4v6.5h-4z"/>
              <path d="M3 9.25h4v1.5H3z"/>
              <path d="M9.5 4.75a.75.75 0 00-.75.75v5.5c0 .414.336.75.75.75h5a.75.75 0 00.75-.75v-5.5a.75.75 0 00-.75-.75h-5zm.75 5v-3.5h3.5v3.5h-3.5z"/>
            </svg>
            Tree View
          </button>
        </div>
      </div>
      
      <div className="message-content">
        <StreamingText
          text={message.message.content}
          progress={progress}
          isActive={isActive}
          canStart={canStart}
          onComplete={onComplete}
          className="message-text"
        />
      </div>
    </div>
  );
};

export default MessageDisplay;