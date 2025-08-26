import React from "react";

const ToolsPanel = ({ onChallengesClick }) => {
  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center">
        <i data-lucide="wrench" className="w-4 h-4 mr-2"></i>
        TOOLS
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <button 
          className="option-button col-span-2"
          onClick={onChallengesClick}
        >
          Challenges
        </button>
      </div>
    </div>
  );
};

export default ToolsPanel;