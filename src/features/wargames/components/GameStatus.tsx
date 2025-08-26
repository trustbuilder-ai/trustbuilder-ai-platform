import React from "react";

const GameStatus = ({ status, remainingMessageCount }) => {
  return (
    <div className="cyber-card">
      <h2 className="text-xl font-semibold text-cyan-400 mb-6">
        GAME STATUS
      </h2>
      <div className="space-y-4 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-400">State:</span>
          <span className="text-green-400 font-semibold">{status.state}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Players:</span>
          <span>{status.players}/4</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Score:</span>
          <span>{status.score}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400">Messages Remaining:</span>
          <span className={remainingMessageCount !== null && remainingMessageCount <= 5 ? "text-yellow-400" : ""}>
            {remainingMessageCount !== null ? remainingMessageCount : "-"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GameStatus;