import React from 'react';
import { useScrollyTell } from '../context/ScrollyTellContext';
import './ScrollyTell.css';

const ChatView: React.FC = () => {
  const { messageTree, currentChatLeafId, getMessagePath } = useScrollyTell();
  
  const messagePath = getMessagePath(currentChatLeafId);

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
              <div key={container.id} className={`message message-${container.message.role}`}>
                <div className="message-role">{container.message.role}</div>
                <div className="message-content">{container.message.content}</div>
                <div className="message-id">ID: {container.id}</div>
              </div>
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