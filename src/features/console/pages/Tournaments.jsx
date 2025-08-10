import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApiData, usePaginatedData } from "../../../shared/hooks";
import { ProtectedCard } from "../../../shared/components/ProtectedCard";
import { DataCard } from "../components/DataCard";
import {
  listTournamentsTournamentsGet,
  getTournamentTournamentsTournamentIdGet,
  listChallengesChallengesGet,
  joinTournamentTournamentsTournamentIdJoinPost,
  startChallengeChallengesChallengeIdStartPost,
  getCurrentUserInfoUsersMeGet,
  getChallengeContextChallengesChallengeIdContextGet,
  addMessageToChallengeChallengesChallengeIdAddMessagePost,
} from "../../../backend_client/sdk.gen";
import { WARGAMES_CONSTANTS } from "../../../shared/constants/wargames";
import "./Tournaments.css";

export function Tournaments() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournamentFilter, setTournamentFilter] = useState("ACTIVE");
  const [joinedTournaments, setJoinedTournaments] = useState(new Set());
  const [joiningTournament, setJoiningTournament] = useState(null);
  const [startingChallenge, setStartingChallenge] = useState(null);
  const [challengeContexts, setChallengeContexts] = useState({});
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  // Fetch user info to get joined tournaments
  const userInfo = useApiData(getCurrentUserInfoUsersMeGet, {
    requiresAuth: true,
  });

  // Update joined tournaments when user info loads
  useEffect(() => {
    if (userInfo.data?.active_tournaments) {
      const joinedIds = new Set(
        userInfo.data.active_tournaments.map((t) => t.id)
      );
      setJoinedTournaments(joinedIds);
    }
  }, [userInfo.data]);

  // Fetch challenge contexts for active challenges
  useEffect(() => {
    const fetchChallengeContexts = async () => {
      if (userInfo.data?.active_challenges) {
        const contexts = {};
        for (const challenge of userInfo.data.active_challenges) {
          try {
            const response = await getChallengeContextChallengesChallengeIdContextGet({
              path: { challenge_id: challenge.id },
              requiresAuth: true,
            });
            if (response.data?.user_challenge_context) {
              contexts[challenge.id] = response.data.user_challenge_context;
            }
          } catch (error) {
            console.error(`Failed to fetch context for challenge ${challenge.id}:`, error);
          }
        }
        setChallengeContexts(contexts);
      }
    };

    fetchChallengeContexts();
  }, [userInfo.data?.active_challenges]);

  // Paginated tournaments list
  const tournaments = usePaginatedData(listTournamentsTournamentsGet, {
    pageSize: 12,
    initialParams: {
      query: {
        selection_filter: tournamentFilter,
      },
    },
  });

  // Selected tournament details
  const tournamentDetails = useApiData(
    getTournamentTournamentsTournamentIdGet,
    {
      requiresAuth: true,
      enabled: !!selectedTournament,
      initialParams: selectedTournament
        ? {
            path: {
              tournament_id: selectedTournament.id,
            },
          }
        : undefined,
    }
  );
  // Challenges for selected tournament
  const challenges = useApiData(listChallengesChallengesGet, {
    requiresAuth: true,
    enabled: !!selectedTournament,
    initialParams: {
      query: {
        tournament_id: selectedTournament?.id || 0,
        page_index: 0,
        count: WARGAMES_CONSTANTS.CHALLENGES_PAGE_SIZE,
      },
    },
  });

  // Update challenges when tournament selection changes
  useEffect(() => {
    if (selectedTournament && challenges.updateParams) {
      challenges.updateParams({
        query: {
          tournament_id: selectedTournament.id,
          page_index: 0,
          count: 50,
        },
      });
    }
  }, [selectedTournament?.id]);

  // Fetch context for active challenge (including messages)
  const challengeMessages = useApiData(getChallengeContextChallengesChallengeIdContextGet, {
    requiresAuth: true,
    enabled: !!activeChallenge,
    initialParams: activeChallenge
      ? {
          path: {
            challenge_id: activeChallenge.id,
          },
        }
      : undefined,
  });

  // Update challenge messages when active challenge changes
  useEffect(() => {
    if (activeChallenge && challengeMessages.updateParams) {
      console.log("Fetching messages for challenge:", activeChallenge.id);
      challengeMessages.updateParams({
        path: {
          challenge_id: activeChallenge.id,
        },
      });
    }
  }, [activeChallenge?.id]);

  // Debug log messages data
  useEffect(() => {
    if (challengeMessages.data) {
      console.log("Challenge messages data:", challengeMessages.data);
    }
  }, [challengeMessages.data]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [challengeMessages.data]);

  // Handle tournament filter change
  const handleFilterChange = (newFilter) => {
    setTournamentFilter(newFilter);
    setSelectedTournament(null);
    tournaments.updateParams({
      query: {
        selection_filter: newFilter,
        page_index: 0,
        count: 12,
      },
    });
  };

  // Handle tournament selection
  const handleTournamentSelect = (tournament) => {
    setSelectedTournament(tournament);
  };

  // Handle joining a tournament
  const handleJoinTournament = async (tournamentId, event) => {
    // Stop propagation to prevent card selection
    if (event) {
      event.stopPropagation();
    }
    
    setJoiningTournament(tournamentId);
    try {
      const response = await joinTournamentTournamentsTournamentIdJoinPost({
        path: {
          tournament_id: tournamentId,
        },
        requiresAuth: true,
      });

      if (response.data) {
        // Update joined tournaments
        setJoinedTournaments((prev) => new Set([...prev, tournamentId]));
        // Refetch user info
        userInfo.refetch();
      }
    } catch (error) {
      console.error("Failed to join tournament:", error);
    } finally {
      setJoiningTournament(null);
    }
  };

  // Handle starting a challenge
  const handleStartChallenge = async (challengeId) => {
    setStartingChallenge(challengeId);
    try {
      const response = await startChallengeChallengesChallengeIdStartPost({
        path: {
          challenge_id: challengeId,
        },
        requiresAuth: true,
      });

      if (response.data) {
        // Refresh user info to update active challenges
        userInfo.refetch();
        // Refresh challenge contexts
        const contexts = { ...challengeContexts };
        contexts[challengeId] = response.data;
        setChallengeContexts(contexts);
      }
    } catch (error) {
      console.error("Failed to start challenge:", error);
    } finally {
      setStartingChallenge(null);
    }
  };

  // Handle message submission
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !activeChallenge) return;

    setSendingMessage(true);
    try {
      const response = await addMessageToChallengeChallengesChallengeIdAddMessagePost({
        path: {
          challenge_id: activeChallenge.id,
        },
        query: {
          message: messageInput.trim(),
        },
        requiresAuth: true,
      });

      if (response.data) {
        // Clear input
        setMessageInput("");
        
        // Log the response to see what we're getting
        console.log("Submit message response:", response.data);
        
        // The response includes the full ChallengeContextResponse with updated messages
        // Force a refetch to get the latest messages from the response
        // This ensures the chat updates immediately with the new conversation
        challengeMessages.refetch();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle joining a challenge (opening chat)
  const handleJoinChallenge = (challenge) => {
    setActiveChallenge(challenge);
  };

  // Calculate tournament status
  const getTournamentStatus = (tournament) => {
    const now = new Date();
    const start = new Date(tournament.start_date);
    const end = new Date(tournament.end_date);

    if (now < start) return "FUTURE";
    if (now > end) return "PAST";
    return "ACTIVE";
  };

  return (
    <div className="tournaments-page">
      <div className="tournaments-header">
        <h1>Tournaments</h1>
        <p>Join tournaments and compete in cybersecurity challenges</p>
      </div>

      <div className="tournaments-content">
        {/* Tournament List */}
        <div className="tournaments-list-section">
          {/* Filter Controls */}
          <div className="filter-controls">
            <span className="filter-label">Filter by status:</span>
            {["ACTIVE", "FUTURE", "PAST", "ACTIVE_AND_FUTURE"].map(
              (filter) => (
                <button
                  key={filter}
                  onClick={() => handleFilterChange(filter)}
                  className={`filter-btn ${
                    tournamentFilter === filter ? "active" : ""
                  }`}
                >
                  {filter.replace(/_/g, " ").replace(/AND/g, "&")}
                </button>
              )
            )}
          </div>

          {/* Tournament Grid */}
          <DataCard
            data={tournaments.data}
            error={tournaments.error}
            loading={tournaments.loading}
            className="tournaments-grid-card"
          >
            {(data) => (
              <div className="tournaments-container">
                <div className="tournaments-grid">
                  {data.map((tournament) => {
                    const status = getTournamentStatus(tournament);
                    const isJoined = joinedTournaments.has(tournament.id);

                    return (
                      <div
                        key={tournament.id}
                        className={`tournament-card ${
                          selectedTournament?.id === tournament.id
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => handleTournamentSelect(tournament)}
                      >
                        <div className="tournament-card-header">
                          <h3>{tournament.name}</h3>
                          {isJoined && (
                            <span className="joined-badge">✓ Joined</span>
                          )}
                        </div>
                        <div className="tournament-card-body">
                          {tournament.description && (
                            <p className="tournament-description">
                              {tournament.description}
                            </p>
                          )}
                          <div className="tournament-dates">
                            <div className="date-item">
                              <span className="date-label">Starts</span>
                              <span className="date-value">
                                {new Date(
                                  tournament.start_date
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="date-item">
                              <span className="date-label">Ends</span>
                              <span className="date-value">
                                {new Date(
                                  tournament.end_date
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="tournament-footer">
                            <span className={`status-badge status-${status}`}>
                              {status}
                            </span>
                            {!isJoined && status !== "PAST" && (
                              <button
                                className="card-join-btn"
                                onClick={(e) => handleJoinTournament(tournament.id, e)}
                                disabled={joiningTournament === tournament.id}
                              >
                                {joiningTournament === tournament.id ? (
                                  <><span className="loading-spinner"></span>Joining...</>
                                ) : (
                                  "Join"
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                <div className="pagination">
                  <div className="pagination-summary">
                    Showing {Math.min((tournaments.currentPage * 12) + 1, data.length || 1)} - {Math.min((tournaments.currentPage + 1) * 12, (tournaments.currentPage * 12) + data.length)} tournaments
                  </div>
                  <div className="pagination-controls">
                    <button
                      onClick={tournaments.prevPage}
                      disabled={!tournaments.hasPrevPage}
                      className="pagination-btn"
                    >
                      <span>←</span>
                      Previous
                    </button>
                    <span className="pagination-info">
                      Page {tournaments.currentPage + 1}
                    </span>
                    <button
                      onClick={tournaments.nextPage}
                      disabled={!tournaments.hasNextPage}
                      className="pagination-btn"
                    >
                      Next
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </DataCard>
        </div>

        {/* Tournament Details */}
        {selectedTournament && (
          <div className="tournament-details-section">
            <ProtectedCard className="tournament-details-card">
              <div className="tournament-details-header">
                <h2>{selectedTournament.name}</h2>
                {!joinedTournaments.has(selectedTournament.id) && (
                  <button
                    className="join-tournament-btn"
                    onClick={() => handleJoinTournament(selectedTournament.id)}
                    disabled={joiningTournament === selectedTournament.id}
                  >
                    {joiningTournament === selectedTournament.id ? (
                      <><span className="loading-spinner"></span>Joining...</>
                    ) : (
                      "Join Tournament"
                    )}
                  </button>
                )}
                {joinedTournaments.has(selectedTournament.id) && (
                  <span className="joined-badge">✓ Joined</span>
                )}
              </div>

              {selectedTournament.description && (
                <p className="tournament-full-description">
                  {selectedTournament.description}
                </p>
              )}

              {/* Challenges List */}
              <div className="challenges-section">
                <h3>Challenges</h3>
                {!joinedTournaments.has(selectedTournament.id) ? (
                  <div className="join-prompt">
                    <p>Join this tournament to view and start challenges</p>
                  </div>
                ) : (
                  <DataCard
                    data={challenges.data}
                    error={challenges.error}
                    loading={challenges.loading}
                    className="challenges-list-card"
                  >
                    {(data) => (
                      <div className="challenges-list">
                        {data.length === 0 ? (
                          <p className="no-challenges">
                            No challenges available yet
                          </p>
                        ) : (
                          data.map((challenge) => {
                            const isActive =
                              userInfo.data?.active_challenges?.some(
                                (c) => c.id === challenge.id
                              );
                            const context = challengeContexts[challenge.id];
                            const canContribute = context?.can_contribute !== false;
                            const isCompleted = context?.succeeded_at != null;

                            return (
                              <div
                                key={challenge.id}
                                className="challenge-item"
                              >
                                <div className="challenge-header">
                                  <h4>{challenge.name}</h4>
                                  <div className="challenge-status-badges">
                                    {isCompleted && (
                                      <span className="completed-badge">
                                        ✓ Completed
                                      </span>
                                    )}
                                    {isActive && !isCompleted && (
                                      <span className="active-badge">
                                        Started
                                      </span>
                                    )}
                                    {isActive && !canContribute && !isCompleted && (
                                      <span className="locked-badge">
                                        Locked
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {challenge.description && (
                                  <p className="challenge-description">
                                    {challenge.description}
                                  </p>
                                )}
                                {challenge.tools_available && (
                                  <div className="challenge-tools">
                                    <span className="tools-label">
                                      Available tools:
                                    </span>
                                    <span className="tools-value">
                                      {challenge.tools_available}
                                    </span>
                                  </div>
                                )}
                                {context?.started_at && (
                                  <div className="challenge-meta">
                                    <span className="meta-label">Started:</span>
                                    <span className="meta-value">
                                      {new Date(context.started_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                                <div className="challenge-actions">
                                  {!isCompleted && !isActive && (
                                    <button
                                      className={`start-challenge-btn ${!canContribute ? 'disabled' : ''}`}
                                      onClick={() =>
                                        canContribute && handleStartChallenge(challenge.id)
                                      }
                                      disabled={startingChallenge === challenge.id || !canContribute}
                                      title={!canContribute ? "This challenge is locked and cannot be started" : ""}
                                    >
                                      {startingChallenge === challenge.id ? (
                                        <><span className="loading-spinner"></span>Starting...</>
                                      ) : !canContribute ? (
                                        "Challenge Locked"
                                      ) : (
                                        "Start Challenge"
                                      )}
                                    </button>
                                  )}
                                  {!isCompleted && isActive && (
                                    <button
                                      className="start-challenge-btn"
                                      onClick={() => handleJoinChallenge(challenge)}
                                    >
                                      Join Challenge
                                    </button>
                                  )}
                                  {isCompleted && (
                                    <button
                                      className="start-challenge-btn completed"
                                      disabled
                                    >
                                      View Results
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </DataCard>
                )}
              </div>
            </ProtectedCard>
          </div>
        )}
      </div>

      {/* Chat Interface - Inline below tournaments */}
      {activeChallenge && (
        <div className="challenge-chat-section">
          <div className="chat-container">
            <div className="chat-header">
              <h3>Challenge: {activeChallenge.name}</h3>
              <button 
                className="close-chat-btn"
                onClick={() => setActiveChallenge(null)}
              >
                Close Chat
              </button>
            </div>
            
            <div className="chat-messages">
              {challengeMessages.loading && (
                <div className="chat-loading">Loading messages...</div>
              )}
              
              {challengeMessages.error && (
                <div className="chat-error">Failed to load messages</div>
              )}
              
              {challengeMessages.data && (
                <>
                  {(() => {
                    // Check different possible message locations
                    const messages = challengeMessages.data.messages || 
                                   challengeMessages.data?.user_challenge_context?.messages || 
                                   [];
                    
                    console.log("Messages array:", messages);
                    
                    if (messages.length > 0) {
                      return messages.map((message, index) => {
                        // Normalize role to handle different formats
                        const role = message.role?.toLowerCase();
                        const isUser = role === 'user';
                        const displayRole = isUser ? 'You' : 'Assistant';
                        
                        return (
                          <div
                            key={index}
                            className={`chat-message ${isUser ? 'user' : 'assistant'}`}
                          >
                            <div className="message-role">
                              {displayRole}
                            </div>
                            <div className="message-content">
                              {message.content || message.text || message.message || '[No content]'}
                            </div>
                            {message.tool_name && (
                              <div className="message-tool">
                                Tool: {message.tool_name}
                              </div>
                            )}
                          </div>
                        );
                      });
                    } else {
                      return (
                        <div className="chat-empty">
                          No messages yet. Start the conversation!
                        </div>
                      );
                    }
                  })()}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            <div className="chat-input-container">
              <input
                type="text"
                className="chat-input"
                placeholder="Type your message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={sendingMessage}
              />
              <button
                className="chat-send-btn"
                onClick={handleSendMessage}
                disabled={sendingMessage || !messageInput.trim()}
              >
                {sendingMessage ? (
                  <span className="loading-spinner"></span>
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tournaments;