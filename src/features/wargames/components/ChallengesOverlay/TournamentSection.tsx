import React from 'react';
import ChallengeCard from './ChallengeCard';

const TournamentSection = ({
  tournament,
  challenges,
  userInfo,
  getChallengeContextFromUserInfo,
  onChallengeAction,
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
                context={getChallengeContextFromUserInfo(challenge.id, userInfo)}
                onAction={onChallengeAction}
                session={session}
                isStarting={startingChallenge}
              />
            ))}
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