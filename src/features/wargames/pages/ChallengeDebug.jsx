import React, { useState } from "react";
import { useApiData } from "../../../shared/hooks";
import { getChallengeContextChallengesChallengeIdContextGet } from "../../../backend_client/sdk.gen";
import { ProtectedCard } from "../../../shared/components/ProtectedCard";
import "./ChallengeDebug.css";

export function ChallengeDebug() {
  const [challengeId, setChallengeId] = useState("");
  const [inputValue, setInputValue] = useState("");

  // Fetch challenge context
  const challengeContext = useApiData(getChallengeContextChallengesChallengeIdContextGet, {
    requiresAuth: true,
    enabled: !!challengeId && !isNaN(Number(challengeId)),
    initialParams: challengeId && !isNaN(Number(challengeId))
      ? {
          path: {
            challenge_id: Number(challengeId),
          },
        }
      : undefined,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isNaN(Number(inputValue))) {
      setChallengeId(inputValue.trim());
      // Update params to trigger fetch
      challengeContext.updateParams({
        path: {
          challenge_id: Number(inputValue.trim()),
        },
      });
    }
  };

  const handleClear = () => {
    setChallengeId("");
    setInputValue("");
  };

  return (
    <div className="challenge-debug-page">
      <div className="challenge-debug-header">
        <h1>Challenge Context Debugger</h1>
        <p>Enter a challenge ID to view its full context data</p>
      </div>

      <ProtectedCard className="challenge-debug-card">
        <form onSubmit={handleSubmit} className="challenge-debug-form">
          <div className="form-group">
            <label htmlFor="challenge-id">Challenge ID:</label>
            <input
              id="challenge-id"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter challenge ID (e.g., 1, 2, 3...)"
              className="challenge-input"
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="submit-btn">
              Fetch Context
            </button>
            <button type="button" onClick={handleClear} className="clear-btn">
              Clear
            </button>
          </div>
        </form>

        {challengeId && (
          <div className="debug-output">
            <h2>Challenge ID: {challengeId}</h2>
            
            {challengeContext.loading && (
              <div className="loading">Loading challenge context...</div>
            )}
            
            {challengeContext.error && (
              <div className="error">
                <strong>Error:</strong> {challengeContext.error.message}
              </div>
            )}
            
            {challengeContext.data && (
              <div className="context-data">
                <h3>User Challenge Context:</h3>
                <pre className="json-display">
                  {JSON.stringify(challengeContext.data.user_challenge_context, null, 2)}
                </pre>
                
                <h3>Messages ({challengeContext.data.messages?.length || 0}):</h3>
                {challengeContext.data.messages && challengeContext.data.messages.length > 0 ? (
                  <div className="messages-list">
                    {challengeContext.data.messages.map((message, index) => (
                      <div key={index} className="debug-message">
                        <div className="message-header">
                          <span className="message-index">#{index + 1}</span>
                          <span className="message-role">{message.role}</span>
                          {message.is_tool_call && (
                            <span className="tool-indicator">Tool Call</span>
                          )}
                          {message.tool_name && (
                            <span className="tool-name">{message.tool_name}</span>
                          )}
                        </div>
                        <div className="message-content-debug">
                          <pre>{message.content}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-messages">No messages found</div>
                )}
                
                <h3>Full Response Data:</h3>
                <pre className="json-display">
                  {JSON.stringify(challengeContext.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </ProtectedCard>
    </div>
  );
}

export default ChallengeDebug;