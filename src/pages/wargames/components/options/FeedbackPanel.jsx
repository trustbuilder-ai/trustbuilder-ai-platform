import React from "react";
import { WARGAMES_CONSTANTS } from "../../../../constants/wargames";

const FeedbackPanel = () => {
  const handleFeedbackClick = (type) => {
    const url = type === 'evaluators' 
      ? WARGAMES_CONSTANTS.FEEDBACK_LINKS.EVALUATORS 
      : WARGAMES_CONSTANTS.FEEDBACK_LINKS.PROVIDERS;
    
    window.open(url, '_blank');
  };

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center">
        <i data-lucide="message-square" className="w-4 h-4 mr-2"></i>
        FEEDBACK
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <button 
          className="option-button"
          onClick={() => handleFeedbackClick('evaluators')}
        >
          Evaluators
        </button>
        <button 
          className="option-button"
          onClick={() => handleFeedbackClick('providers')}
        >
          Providers
        </button>
      </div>
    </div>
  );
};

export default FeedbackPanel;