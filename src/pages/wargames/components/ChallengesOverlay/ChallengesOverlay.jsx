import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../../../hooks/useAuth';
import { useApiData } from '../../../../hooks/useApiData';
import { usePaginatedData } from '../../../../hooks/usePaginatedData';
import TournamentSection from './TournamentSection';
import {
  listTournamentsTournamentsGet,
  listChallengesChallengesGet,
  joinTournamentTournamentsTournamentIdJoinPost,
  startChallengeChallengesChallengeIdStartPost,
  getChallengeContextChallengesChallengeIdContextGet
} from '../../../../backend_client/sdk.gen';
import './ChallengesOverlay.css';

const ChallengesOverlay = ({ isOpen, onClose, theme, wargamesContext, onSelectChallenge }) => {
  const { session } = useAuth();
  const [pendingChallengeId, setPendingChallengeId] = useState(null);
  const [challengeContexts, setChallengeContexts] = useState({});
  const [loadingContexts, setLoadingContexts] = useState({});
  const [startingChallenge, setStartingChallenge] = useState(false);
  const [tournamentChallenges, setTournamentChallenges] = useState({});
  const [tournamentPages, setTournamentPages] = useState({});
  const [loadingMore, setLoadingMore] = useState({});
  const [contextLoadAttempted, setContextLoadAttempted] = useState({});

  // Load all tournaments
  const { data: tournaments, loading: tournamentsLoading } = useApiData(
    listTournamentsTournamentsGet,
    { requiresAuth: false, enabled: isOpen }
  );

  // Load initial challenges for each tournament
  useEffect(() => {
    const loadInitialChallenges = async () => {
      if (!tournaments || tournaments.length === 0) return;

      // Clear previous data when reopening
      setTournamentChallenges({});
      setTournamentPages({});
      setChallengeContexts({});
      setLoadingContexts({});
      setContextLoadAttempted({});

      for (const tournament of tournaments) {
        try {
          const response = await listChallengesChallengesGet({
            query: {
              tournament_id: tournament.id,
              page_index: 0,
              count: 10
            }
          });

          if (response.data) {
            setTournamentChallenges(prev => ({
              ...prev,
              [tournament.id]: response.data
            }));
            setTournamentPages(prev => ({
              ...prev,
              [tournament.id]: 0
            }));
          }
        } catch (error) {
          console.error(`Error loading challenges for tournament ${tournament.id}:`, error);
        }
      }
    };

    if (isOpen && tournaments) {
      loadInitialChallenges();
    }
  }, [tournaments, isOpen]);

  // Load challenge contexts for authenticated users
  useEffect(() => {
    const loadChallengeContexts = async () => {
      if (!session || !tournamentChallenges || !isOpen) return;

      const allChallenges = Object.values(tournamentChallenges).flat();
      
      for (const challenge of allChallenges) {
        // Only try to load context once per challenge
        if (!contextLoadAttempted[challenge.id]) {
          setContextLoadAttempted(prev => ({ ...prev, [challenge.id]: true }));
          setLoadingContexts(prev => ({ ...prev, [challenge.id]: true }));
          
          try {
            const response = await getChallengeContextChallengesChallengeIdContextGet({
              path: { challenge_id: challenge.id },
              requiresAuth: true
            });

            if (response.data) {
              setChallengeContexts(prev => ({
                ...prev,
                [challenge.id]: response.data
              }));
            }
          } catch (error) {
            // Challenge may not be started yet, mark as null
            setChallengeContexts(prev => ({
              ...prev,
              [challenge.id]: null
            }));
          } finally {
            setLoadingContexts(prev => ({ ...prev, [challenge.id]: false }));
          }
        }
      }
    };

    loadChallengeContexts();
  }, [session, tournamentChallenges, contextLoadAttempted, isOpen]);

  const loadMoreChallenges = useCallback(async (tournamentId) => {
    setLoadingMore(prev => ({ ...prev, [tournamentId]: true }));
    
    try {
      const currentPage = (tournamentPages[tournamentId] || 0) + 1;
      const response = await listChallengesChallengesGet({
        query: {
          tournament_id: tournamentId,
          page_index: currentPage,
          count: 10
        }
      });

      if (response.data && response.data.length > 0) {
        setTournamentChallenges(prev => ({
          ...prev,
          [tournamentId]: [...(prev[tournamentId] || []), ...response.data]
        }));
        setTournamentPages(prev => ({
          ...prev,
          [tournamentId]: currentPage
        }));
      }
    } catch (error) {
      console.error(`Error loading more challenges for tournament ${tournamentId}:`, error);
    } finally {
      setLoadingMore(prev => ({ ...prev, [tournamentId]: false }));
    }
  }, [tournamentPages]);

  const handleStartChallenge = useCallback(async (challengeId) => {
    setStartingChallenge(true);
    
    try {
      // Find the challenge and its tournament
      let targetChallenge = null;
      let tournamentId = null;
      
      for (const [tId, challenges] of Object.entries(tournamentChallenges)) {
        const challenge = challenges.find(c => c.id === challengeId);
        if (challenge) {
          targetChallenge = challenge;
          tournamentId = parseInt(tId);
          break;
        }
      }

      if (!targetChallenge || !tournamentId) {
        throw new Error('Challenge not found');
      }

      // Join tournament first (required)
      console.log('Joining tournament:', tournamentId);
      const joinResponse = await joinTournamentTournamentsTournamentIdJoinPost({
        path: { tournament_id: tournamentId },
        requiresAuth: true
      });

      if (joinResponse.error) {
        // Tournament might already be joined, continue anyway
        console.log('Tournament join response:', joinResponse.error);
      }

      // Update context with tournament info
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (tournament) {
        wargamesContext.joinTournament(tournamentId, tournament.name);
      }

      // Start the challenge
      console.log('Starting challenge:', challengeId);
      const startResponse = await startChallengeChallengesChallengeIdStartPost({
        path: { challenge_id: challengeId },
        requiresAuth: true
      });

      if (startResponse.data || (startResponse.response && startResponse.response.ok)) {
        // Update context and close overlay
        wargamesContext.startChallenge(challengeId, targetChallenge.name, true);
        
        // Call the onSelectChallenge callback to trigger any parent updates
        if (onSelectChallenge) {
          onSelectChallenge(challengeId, targetChallenge.name, targetChallenge.description);
        }
        
        onClose();
      } else if (startResponse.error?.detail?.toLowerCase().includes('already')) {
        // Challenge already started, just select it
        wargamesContext.startChallenge(challengeId, targetChallenge.name, true);
        if (onSelectChallenge) {
          onSelectChallenge(challengeId, targetChallenge.name, targetChallenge.description);
        }
        onClose();
      } else {
        throw new Error(startResponse.error?.detail || 'Failed to start challenge');
      }
    } catch (error) {
      console.error('Error starting challenge:', error);
      alert(`Failed to start challenge: ${error.message}`);
    } finally {
      setStartingChallenge(false);
    }
  }, [tournamentChallenges, tournaments, wargamesContext, onSelectChallenge, onClose]);

  const handleChallengeAction = useCallback((challengeId) => {
    if (!session) {
      // Track pending challenge for auto-start after auth
      setPendingChallengeId(challengeId);
      alert('Please sign in to start this challenge');
    } else {
      handleStartChallenge(challengeId);
    }
  }, [session, handleStartChallenge]);

  // Auto-start pending challenge on authentication
  useEffect(() => {
    if (session && pendingChallengeId && !startingChallenge) {
      handleStartChallenge(pendingChallengeId);
      setPendingChallengeId(null);
    }
  }, [session, pendingChallengeId, startingChallenge, handleStartChallenge]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div className={`challenges-overlay-backdrop theme-${theme}`} onClick={onClose}>
      <div 
        className="challenges-overlay-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="challenges-overlay-header">
          <h2>Challenges</h2>
          <button 
            className="challenges-overlay-close"
            onClick={onClose}
            aria-label="Close overlay"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="challenges-overlay-body">
          {tournamentsLoading ? (
            <div className="challenges-loading">
              <div className="loading-spinner"></div>
              <p>Loading tournaments...</p>
            </div>
          ) : tournaments && tournaments.length > 0 ? (
            tournaments.map(tournament => (
              <TournamentSection
                key={tournament.id}
                tournament={tournament}
                challenges={tournamentChallenges[tournament.id] || []}
                challengeContexts={challengeContexts}
                onChallengeAction={handleChallengeAction}
                onLoadMore={() => loadMoreChallenges(tournament.id)}
                hasMore={(tournamentChallenges[tournament.id]?.length || 0) % 10 === 0 && 
                        (tournamentChallenges[tournament.id]?.length || 0) > 0}
                loadingMore={loadingMore[tournament.id]}
                session={session}
                startingChallenge={startingChallenge}
              />
            ))
          ) : (
            <div className="no-tournaments">
              <p>No tournaments available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ChallengesOverlay;