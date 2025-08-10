import React, { createContext, useContext, useState } from 'react';

/**
 * Context for managing Wargames state including current tournament and challenge
 */
const WargamesContext = createContext(null);

export const WargamesProvider = ({ children }) => {
  // Tournament state
  const [currentTournamentId, setCurrentTournamentId] = useState(null);
  const [tournamentName, setTournamentName] = useState('');
  
  // Challenge state
  const [activeChallengeId, setActiveChallengeId] = useState(null);
  const [challengeName, setChallengeName] = useState('');
  const [canContribute, setCanContribute] = useState(true);
  const [remainingMessageCount, setRemainingMessageCount] = useState(null);
  const [evaluationStatus, setEvaluationStatus] = useState(null);
  
  // Helper functions
  const joinTournament = (tournamentId, name) => {
    setCurrentTournamentId(tournamentId);
    setTournamentName(name);
    // Reset challenge when joining a new tournament
    setActiveChallengeId(null);
    setChallengeName('');
  };
  
  const startChallenge = (challengeId, name, canContributeFlag = true, messageCount = null) => {
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
  
  const value = {
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