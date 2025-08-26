import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WargamesContextValue {
  // Tournament state
  currentTournamentId: string | null;
  tournamentName: string;
  
  // Challenge state
  activeChallengeId: string | null;
  challengeName: string;
  canContribute: boolean;
  remainingMessageCount: number | null;
  evaluationStatus: any | null; // TODO: Define proper evaluation status type
  
  // Actions
  joinTournament: (tournamentId: string, name: string) => void;
  startChallenge: (challengeId: string, name: string, canContributeFlag?: boolean, messageCount?: number | null) => void;
  clearState: () => void;
  setRemainingMessageCount: (count: number | null) => void;
  setEvaluationStatus: (status: any) => void;
  
  // Computed values
  hasTournament: boolean;
  hasActiveChallenge: boolean;
}

/**
 * Context for managing Wargames state including current tournament and challenge
 */
const WargamesContext = createContext<WargamesContextValue | null>(null);

interface WargamesProviderProps {
  children: ReactNode;
}

export const WargamesProvider = ({ children }: WargamesProviderProps) => {
  // Tournament state
  const [currentTournamentId, setCurrentTournamentId] = useState<string | null>(null);
  const [tournamentName, setTournamentName] = useState<string>('');
  
  // Challenge state
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [challengeName, setChallengeName] = useState<string>('');
  const [canContribute, setCanContribute] = useState<boolean>(true);
  const [remainingMessageCount, setRemainingMessageCount] = useState<number | null>(null);
  const [evaluationStatus, setEvaluationStatus] = useState<any | null>(null);
  
  // Helper functions
  const joinTournament = (tournamentId: string, name: string) => {
    setCurrentTournamentId(tournamentId);
    setTournamentName(name);
    // Reset challenge when joining a new tournament
    setActiveChallengeId(null);
    setChallengeName('');
  };
  
  const startChallenge = (challengeId: string, name: string, canContributeFlag = true, messageCount: number | null = null) => {
    setActiveChallengeId(challengeId);
    setChallengeName(name);
    setCanContribute(canContributeFlag);
    setRemainingMessageCount(messageCount);
  };
  
  const clearState = () => {
    setCurrentTournamentId(null);
    setTournamentName('');
    setActiveChallengeId(null);
    setChallengeName('');
    setCanContribute(true);
    setRemainingMessageCount(null);
    setEvaluationStatus(null);
  };
  
  const value: WargamesContextValue = {
    // Tournament state
    currentTournamentId,
    tournamentName,
    
    // Challenge state
    activeChallengeId,
    challengeName,
    canContribute,
    remainingMessageCount,
    evaluationStatus,
    
    // Actions
    joinTournament,
    startChallenge,
    clearState,
    setRemainingMessageCount,
    setEvaluationStatus,
    
    // Computed values
    hasTournament: !!currentTournamentId,
    hasActiveChallenge: !!activeChallengeId
  };
  
  return (
    <WargamesContext.Provider value={value}>
      {children}
    </WargamesContext.Provider>
  );
};

/**
 * Hook to use the Wargames context
 */
export const useWargamesContext = () => {
  const context = useContext(WargamesContext);
  if (!context) {
    throw new Error('useWargamesContext must be used within a WargamesProvider');
  }
  return context;
};