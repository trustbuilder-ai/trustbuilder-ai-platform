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
  
  // Helper functions
  const joinTournament = (tournamentId, name) => {
    setCurrentTournamentId(tournamentId);
    setTournamentName(name);
    // Reset challenge when joining a new tournament
    setActiveChallengeId(null);
    setChallengeName('');
  };
  
  const startChallenge = (challengeId, name, canContributeFlag = true) => {
    setActiveChallengeId(challengeId);
    setChallengeName(name);
    setCanContribute(canContributeFlag);
  };
  
  const clearState = () => {
    setCurrentTournamentId(null);
    setTournamentName('');
    setActiveChallengeId(null);
    setChallengeName('');
    setCanContribute(true);
  };
  
  const value = {
    // Tournament state
    currentTournamentId,
    tournamentName,
    
    // Challenge state
    activeChallengeId,
    challengeName,
    canContribute,
    
    // Actions
    joinTournament,
    startChallenge,
    clearState,
    
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