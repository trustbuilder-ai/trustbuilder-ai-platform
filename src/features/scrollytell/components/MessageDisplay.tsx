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
  const { setCurrentChatLeafId, setCurrentView } = useScrollyTell();

  const handleFork = () => {
    // Set this message as the current leaf and navigate to chat view
    setCurrentChatLeafId(message.id_in_tree);
    setCurrentView('chat');
    navigate('/scrollytell/chat');
    console.log(`Forking from message ${message.id_in_tree}, opening chat view`);
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