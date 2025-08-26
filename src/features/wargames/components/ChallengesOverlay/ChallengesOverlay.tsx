import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useAuth } from '../../../../shared/hooks/useAuth';
import TournamentSection from './TournamentSection';
import {
  listChallengesChallengesGet,
  startChallengeChallengesChallengeIdStartPost,
  getCurrentUserInfoUsersMeGet
} from '../../../../backend_client/sdk.gen';
import { WARGAMES_CONSTANTS } from '../../../../shared/constants/wargames';
import './ChallengesOverlay.css';

// Helper function to derive challenge context from UserInfo data
const getChallengeContextFromUserInfo = (challengeId, userInfo) => {
  if (!userInfo) return null;
  
  // Find the challenge context in active_challenge_contexts
  const activeContext = userInfo.active_challenge_contexts?.find(
    ctx => ctx.challenge_id === challengeId
  );
  
  // Find the evaluation result in eval_results
  const evalResult = userInfo.eval_results?.find(
    result => result.challenge_id === challengeId
  );
  
  // If no active context, challenge hasn't been started
  if (!activeContext) return null;
  
  // Build a context object that matches the expected structure
  return {
    user_challenge_context: activeContext,
    eval_result: evalResult || null
  };
};

const ChallengesOverlay = ({ isOpen, onClose, theme, wargamesContext, onSelectChallenge }) => {
  const { session } = useAuth();
  const [pendingChallengeId, setPendingChallengeId] = useState(null);
  const [startingChallenge, setStartingChallenge] = useState(false);
  
  // Simplified state
  const [allChallengesData, setAllChallengesData] = useState([]); // Store full ChallengesPublic objects
  const [groupedChallenges, setGroupedChallenges] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null); // Store user info from single API call
  const [loadingUserInfo, setLoadingUserInfo] = useState(false);

  // Load all challenges with single API call
  useEffect(() => {
    const loadChallenges = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      try {
        const response = await listChallengesChallengesGet({
          query: {
            count: WARGAMES_CONSTANTS.CHALLENGES_PAGE_SIZE,
            page_index: 0
          },
          requiresAuth: false
        });
        
        if (response.data) {
          // Store the full data for later use
          setAllChallengesData(response.data);
          
          // Group by tournament_name
          const grouped = response.data.reduce((acc, item) => {
            const tournamentName = item.tournament_name;
            if (!acc[tournamentName]) {
              acc[tournamentName] = [];
            }
            acc[tournamentName].push(item.challenge);
            return acc;
          }, {});
          
          setGroupedChallenges(grouped);
        }
      } catch (error) {
        console.error('Error loading challenges:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadChallenges();
  }, [isOpen]);

  // Load user info for authenticated users
  useEffect(() => {
    const loadUserInfo = async () => {
      if (!session || !isOpen) return;

      setLoadingUserInfo(true);
      try {
        const response = await getCurrentUserInfoUsersMeGet({
          requiresAuth: true
        });

        if (response.data) {
          setUserInfo(response.data);
        }
      } catch (error) {
        console.error('Error loading user info:', error);
        setUserInfo(null);
      } finally {
        setLoadingUserInfo(false);
      }
    };

    void loadUserInfo();
  }, [session, isOpen]);

  const handleStartChallenge = useCallback(async (challengeId) => {
    setStartingChallenge(true);
    
    try {
      // Find the challenge data from our stored data
      const challengeData = allChallengesData.find(item => item.challenge.id === challengeId);
      
      if (!challengeData) {
        throw new Error('Challenge not found');
      }
      
      const targetChallenge = challengeData.challenge;
      const tournamentName = challengeData.tournament_name;
      
      // Update context with tournament info (backend auto-joins tournament when challenge starts)
      const tournamentId = targetChallenge.tournament_id;
      if (tournamentId) {
        wargamesContext.joinTournament(tournamentId, tournamentName);
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
  }, [allChallengesData, wargamesContext, onSelectChallenge, onClose]);

  const handleChallengeAction = useCallback((challengeId) => {
    if (!session) {
      // Track pending challenge for auto-start after auth
      setPendingChallengeId(challengeId);
      alert('Please sign in to start this challenge');
    } else {
      void handleStartChallenge(challengeId);
    }
  }, [session, handleStartChallenge]);

  // Auto-start pending challenge on authentication
  useEffect(() => {
    if (session && pendingChallengeId && !startingChallenge) {
      void handleStartChallenge(pendingChallengeId);
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
          {isLoading || (session && loadingUserInfo) ? (
            <div className="challenges-loading">
              <div className="loading-spinner"></div>
              <p>{isLoading ? 'Loading challenges...' : 'Loading user data...'}</p>
            </div>
          ) : Object.keys(groupedChallenges).length > 0 ? (
            Object.entries(groupedChallenges).map(([tournamentName, challenges]) => (
              <TournamentSection
                key={tournamentName}
                tournament={{ name: tournamentName }}
                challenges={challenges}
                userInfo={userInfo}
                getChallengeContextFromUserInfo={getChallengeContextFromUserInfo}
                onChallengeAction={handleChallengeAction}
                session={session}
                startingChallenge={startingChallenge}
              />
            ))
          ) : (
            <div className="no-tournaments">
              <p>No challenges available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ChallengesOverlay;