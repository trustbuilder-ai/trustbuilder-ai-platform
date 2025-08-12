import React from 'react';

const ChallengeCard = ({ 
  challenge, 
  context, 
  onAction, 
  session,
  isStarting 
}) => {
  // Determine challenge status
  const evalStatus = context?.eval_result?.status;
  const canContribute = context?.user_challenge_context?.can_contribute;
  const hasContext = context && context !== null;
  
  // Determine button text and status
  const getActionText = () => {
    if (!session) return 'Sign in to start';
    if (isStarting) return 'Starting...';
    
    if (evalStatus === 'SUCCEEDED' || evalStatus === 'FAILED' || evalStatus === 'ERRORED') {
      return 'View';
    } else if (hasContext) {
      return 'Resume';
    }
    return 'Start';
  };

  const getStatusBadge = () => {
    if (!evalStatus) return null;
    
    const statusClasses = {
      'SUCCEEDED': 'status-badge status-success',
      'FAILED': 'status-badge status-failed',
      'ERRORED': 'status-badge status-error',
      'PENDING': 'status-badge status-pending',
      'NOT_EVALUATED': 'status-badge status-not-evaluated'
    };

    return (
      <span className={statusClasses[evalStatus] || 'status-badge'}>
        {evalStatus}
      </span>
    );
  };

  return (
    <div className="challenge-card">
      <div className="challenge-card-header">
        <h4 className="challenge-card-title">{challenge.name}</h4>
        {getStatusBadge()}
      </div>
      
      <div className="challenge-card-body">
        <p className="challenge-card-description">
          {challenge.description || 'No description available'}
        </p>
        
        {challenge.points && (
          <div className="challenge-card-points">
            <span className="points-label">Points:</span>
            <span className="points-value">{challenge.points}</span>
          </div>
        )}
        
        {challenge.difficulty && (
          <div className="challenge-card-difficulty">
            <span className="difficulty-label">Difficulty:</span>
            <span className={`difficulty-value difficulty-${challenge.difficulty.toLowerCase()}`}>
              {challenge.difficulty}
            </span>
          </div>
        )}
      </div>
      
      <div className="challenge-card-footer">
        <button 
          className="challenge-card-action"
          onClick={() => onAction(challenge.id)}
          disabled={isStarting}
        >
          {getActionText()}
        </button>
      </div>
    </div>
  );
};

export default ChallengeCard;