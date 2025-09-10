import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollyTell } from '../context/ScrollyTellContext';
import LLMUIMessage from '../components/LLMUIMessage';
import './ScrollyTell.css';

const ChatView: React.FC = () => {
  const { messageTree, currentChatLeafId, getMessagePath, forkMessage, setCurrentView } = useScrollyTell();
  const navigate = useNavigate();
  
  const messagePath = getMessagePath(currentChatLeafId);

  const handleFork = (messageId: number) => {
    const forkedMessage = forkMessage(messageId, 'user', '');
    if (forkedMessage) {
      console.log(`Created fork from message ${messageId}, new leaf ${forkedMessage.id}`);
    }
  };

  const handleTreeView = (messageId: number) => {
    setCurrentView('tree');
    navigate(`/scrollytell/tree?messageId=${messageId}`);
  };

  return (
    <div className="chat-view">
      <div className="view-container">
        <h2>Chat View</h2>
        <p className="view-description">
          Linear display of LLM messages in a chat-like interface.
        </p>
        
        <div className="chat-messages">
          <div className="messages-container">
            {messagePath.map((container) => (
              <LLMUIMessage
                key={container.id}
                message={container}
                showActions={true}
                onFork={() => handleFork(container.id)}
                onTreeView={() => handleTreeView(container.id)}
              />
            ))}
          </div>
        </div>
        
        <div className="chat-info">
          <p>Showing path to message {currentChatLeafId}</p>
          <p>{messagePath.length} messages in current conversation</p>
        </div>
      </div>
    </div>
  );
};

export default ChatView;