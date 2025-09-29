import React, { createContext, useState, useContext, useCallback, ReactNode, useMemo } from 'react';
import {
  MessageTree,
  ScrollyTellData,
  ScrollyTellState,
  ScrollyTellContextValue,
  ViewType,
  MessageContainer,
  ScrollyTellRegistryEntry
} from '../types';
import { scrollyTellRegistry, getMessageTreeForSample } from '../data/scrollyTellRegistry';
import { createForkedMessage } from '../utils/forkUtils';

const ScrollyTellContext = createContext<ScrollyTellContextValue | undefined>(undefined);

interface ScrollyTellProviderProps {
  children: ReactNode;
}

// Get the first registry entry as default
const defaultSampleId = Object.keys(scrollyTellRegistry)[0];
const defaultSample = scrollyTellRegistry[defaultSampleId];

export const ScrollyTellProvider: React.FC<ScrollyTellProviderProps> = ({ children }) => {
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(defaultSampleId);
  const [currentChatLeafId, setCurrentChatLeafId] = useState<number>(defaultSample.defaultChatLeafId);
  const [messageTree, setMessageTree] = useState<MessageTree>(getMessageTreeForSample(defaultSampleId));
  const [scrollyTellData, setScrollyTellData] = useState<ScrollyTellData>(defaultSample.scrollyTellData);
  const [currentView, setCurrentView] = useState<ViewType>('scrollytell');

  // Memoize available samples array
  const availableSamples = useMemo(() => Object.values(scrollyTellRegistry), []);

  const updateMessageTree = useCallback((tree: MessageTree) => {
    setMessageTree(tree);
  }, []);

  const updateScrollyTellData = useCallback((data: ScrollyTellData) => {
    setScrollyTellData(data);
  }, []);

  /**
   * Select a different sample from the registry and load its data
   */
  const selectSample = useCallback((sampleId: string) => {
    const sample = scrollyTellRegistry[sampleId];
    if (!sample) {
      console.error(`Sample "${sampleId}" not found in registry`);
      return;
    }

    // Update all related state
    setSelectedSampleId(sampleId);
    setScrollyTellData(sample.scrollyTellData);
    setCurrentChatLeafId(sample.defaultChatLeafId);

    // Load the message tree (temporary - will fetch from backend in future)
    const tree = getMessageTreeForSample(sampleId);
    setMessageTree(tree);

    console.log(`Loaded sample: ${sample.name} (${sampleId})`);
  }, []);

  const getMessagePath = useCallback((leafId: number): MessageContainer[] => {
    const path: MessageContainer[] = [];
    let currentMessage = messageTree.find(m => m.id === leafId);

    while (currentMessage) {
      path.unshift(currentMessage);
      if (currentMessage.parent_message_id === null || currentMessage.parent_message_id === 0) {
        break;
      }
      currentMessage = messageTree.find(m => m.id === currentMessage?.parent_message_id);
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
    forkMessage,
    selectedSampleId,
    availableSamples,
    selectSample
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