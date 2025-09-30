import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageContainer } from '../types';
import LLMUIMessage from './LLMUIMessage';
import { useScrollyTell } from '../context/ScrollyTellContext';
import { isTemporaryId } from '../utils/forkUtils';

interface MessageDisplayProps {
  message: MessageContainer;
}

const MessageDisplay: React.FC<MessageDisplayProps> = ({ message }) => {
  const navigate = useNavigate();
  const { forkMessage, setCurrentView } = useScrollyTell();

  const handleFork = () => {
    // Create a new forked message from this message
    const forkedMessage = forkMessage(message.id_in_tree, 'user', '');

    if (forkedMessage) {
      // Navigate to chat view with the new forked message as the leaf
      setCurrentView('chat');
      navigate('/scrollytell/chat');
      console.log(`Created fork from message ${message.id_in_tree}, opening chat with new leaf ${forkedMessage.id_in_tree}`);
    } else {
      console.error('Failed to create fork from message:', message.id_in_tree);
    }
  };

  const handleTreeView = () => {
    // Navigate to tree view with this message centered
    setCurrentView('tree');
    navigate(`/scrollytell/tree?messageId=${message.id_in_tree}`);
  };

  const isDraft = isTemporaryId(message.id_in_tree);

  return (
    <div className={isDraft ? 'message-draft-wrapper' : undefined}>
      <LLMUIMessage
        message={message}
        showActions={true}
        onFork={handleFork}
        onTreeView={handleTreeView}
      />
      {isDraft && (
        <div className="draft-indicator">DRAFT</div>
      )}
    </div>
  );
};

export default MessageDisplay;