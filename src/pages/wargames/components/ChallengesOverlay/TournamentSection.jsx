import React from 'react';
import ChallengeCard from './ChallengeCard';

const TournamentSection = ({
  tournament,
  challenges,
  challengeContexts,
  onChallengeAction,
  onLoadMore,
  hasMore,
  loadingMore,
  session,
  startingChallenge
}) => {
  return (
    <div className="tournament-section">
      <h3 className="tournament-section-title">{tournament.name}</h3>
      
      <div className="challenges-grid">
        {challenges.length > 0 ? (
          <>
            {challenges.map(challenge => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                context={challengeContexts[challenge.id]}
                onAction={onChallengeAction}
                session={session}
                isStarting={startingChallenge}
              />
            ))}
            
            {hasMore && (
              <div className="load-more-card">
                <button 
                  className="load-more-button"
                  onClick={onLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <div className="loading-spinner small"></div>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M9 18l6-6-6-6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="no-challenges">
            <p>No challenges available in this tournament</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentSection;