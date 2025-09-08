import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { 
  MessageTree, 
  ScrollyTellData, 
  ScrollyTellState, 
  ScrollyTellContextValue, 
  ViewType,
  MessageContainer 
} from '../types';
import { messageTree as defaultMessageTree, scrollyTellData as defaultScrollyTellData, defaultChatLeafId } from '../data/sampleData';
import { createForkedMessage } from '../utils/forkUtils';

const ScrollyTellContext = createContext<ScrollyTellContextValue | undefined>(undefined);

interface ScrollyTellProviderProps {
  children: ReactNode;
}

export const ScrollyTellProvider: React.FC<ScrollyTellProviderProps> = ({ children }) => {
  const [currentChatLeafId, setCurrentChatLeafId] = useState<number>(defaultChatLeafId);
  const [messageTree, setMessageTree] = useState<MessageTree>(defaultMessageTree);
  const [scrollyTellData, setScrollyTellData] = useState<ScrollyTellData>(defaultScrollyTellData);
  const [currentView, setCurrentView] = useState<ViewType>('scrollytell');

  const updateMessageTree = useCallback((tree: MessageTree) => {
    setMessageTree(tree);
  }, []);

  const updateScrollyTellData = useCallback((data: ScrollyTellData) => {
    setScrollyTellData(data);
  }, []);

  const getMessagePath = useCallback((leafId: number): MessageContainer[] => {
    const path: MessageContainer[] = [];
    let currentMessage = messageTree.find(m => m.id === leafId);
    
    while (currentMessage) {
      path.unshift(currentMessage);
      if (currentMessage.parent_message_id === null || currentMessage.parent_message_id === 0) {
        break;
      }
      currentMessage = messageTree.find(m => m.id === currentMessage.parent_message_id);
    }
    
    return path;
  }, [messageTree]);

  /**
   * Creates a new forked message from an existing message.
   * The new message will have a temporary negative ID until persisted to the server.
   * After forking, the current chat leaf is updated to the new message.
   */
  const forkMessage = useCallback((
    parentMessageId: number,
    role: 'user' | 'assistant' | 'system' = 'user',
    content: string = ''
  ): MessageContainer | null => {
    const parentMessage = messageTree.find(m => m.id === parentMessageId);
    if (!parentMessage) {
      console.error(`Cannot fork: parent message ${parentMessageId} not found`);
      return null;
    }

    // Create the new forked message with a temporary ID
    const forkedMessage = createForkedMessage(parentMessage, messageTree, role);
    
    // If content is provided, set it
    if (content) {
      forkedMessage.message.content = content;
    }

    // Add the new message to the tree
    const newTree = [...messageTree, forkedMessage];
    setMessageTree(newTree);

    // Update the current chat leaf to the new message
    setCurrentChatLeafId(forkedMessage.id);

    console.log(`Created fork from message ${parentMessageId} with temporary ID ${forkedMessage.id}`);
    
    return forkedMessage;
  }, [messageTree]);

  const value: ScrollyTellContextValue = {
    currentChatLeafId,
    setCurrentChatLeafId,
    messageTree,
    updateMessageTree,
    scrollyTellData,
    updateScrollyTellData,
    currentView,
    setCurrentView,
    getMessagePath,
    forkMessage
  };

  return (
    <ScrollyTellContext.Provider value={value}>
      {children}
    </ScrollyTellContext.Provider>
  );
};

export const useScrollyTell = (): ScrollyTellContextValue => {
  const context = useContext(ScrollyTellContext);
  if (!context) {
    throw new Error('useScrollyTell must be used within a ScrollyTellProvider');
  }
  return context;
};