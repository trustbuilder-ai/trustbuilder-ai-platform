import React, { createContext, useState, useContext, useCallback, ReactNode, useMemo } from 'react';
import {
  ScrollyTellData,
  ScrollyTellContextValue,
  ViewType,
  ScrollyTellRegistryEntry
} from '../types';
import { scrollyTellRegistry } from '../data/scrollyTellRegistry';

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
  const [scrollyTellData, setScrollyTellData] = useState<ScrollyTellData>(defaultSample.scrollyTellData);
  const [currentView, setCurrentView] = useState<ViewType>('scrollytell');

  // Memoize available samples array
  const availableSamples = useMemo(() => Object.values(scrollyTellRegistry), []);

  const updateScrollyTellData = useCallback((data: ScrollyTellData) => {
    setScrollyTellData(data);
  }, []);

  /**
   * Select a different sample from the registry
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

    console.log(`Selected sample: ${sample.name} (${sampleId})`);
  }, []);

  const value: ScrollyTellContextValue = {
    currentChatLeafId,
    setCurrentChatLeafId,
    scrollyTellData,
    updateScrollyTellData,
    currentView,
    setCurrentView,
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