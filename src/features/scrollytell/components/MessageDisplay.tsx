import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageContainer } from '../types';
import StreamingText from './StreamingText';
import LLMUIWrapper from './LLMUIWrapper';
import { useScrollyTell } from '../context/ScrollyTellContext';
import { isTemporaryId } from '../utils/forkUtils';

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
    setCurrentView('tree');
    navigate(`/scrollytell/tree?messageId=${message.id}`);
  };
  
  const isDraft = isTemporaryId(message.id);
  
  return (
    <div className={isDraft ? 'message-draft-wrapper' : undefined}>
      <LLMUIWrapper
        role={message.message.role}
        showActions={true}
        onFork={handleFork}
        onTreeView={handleTreeView}
        isDraft={isDraft}
        messageId={message.id}
      >
        <StreamingText
          text={message.message.content}
          progress={progress}
          isActive={isActive}
          canStart={canStart}
          onComplete={onComplete}
          className="message-text"
        />
      </LLMUIWrapper>
      {isDraft && (
        <div className="draft-indicator">DRAFT</div>
      )}
    </div>
  );
};

export default MessageDisplay;