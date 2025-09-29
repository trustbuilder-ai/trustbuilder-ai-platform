import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box, Container, Flex, Grid, Heading, Text, Button, Badge,
  Card, Spinner, Callout
} from "@radix-ui/themes";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { ChevronLeftIcon, ChevronRightIcon, Cross2Icon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useApiData, usePaginatedData } from "../../../shared/hooks";
import { ProtectedCard } from "../../../shared/components/ProtectedCard";
import { DataCard } from "../components/DataCard";
import {
  listChatTemplateContainersChatTemplateContainersGet,
  getChatTemplateContainerChatTemplateContainersChatTemplateContainerIdGet,
  listChatTemplatesChatTemplatesGet,
  startChatTemplateChatTemplatesChatTemplateIdStartPost,
  getCurrentUserInfoUsersMeGet,
  getChatTemplateContextChatTemplatesChatTemplateIdContextGet,
  addMessageToChatTemplateChatTemplatesChatTemplateIdAddMessagePost,
} from "../../../backend_client/sdk.gen";
import { WARGAMES_CONSTANTS } from "../../../shared/constants/wargames";

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
    if (userInfo.data?.active_chat_template_containers) {
      const joinedIds = new Set(
        userInfo.data.active_chat_template_containers.map((t: any) => t.id)
      );
      setJoinedTournaments(joinedIds);
    }
  }, [userInfo.data]);

  // Fetch challenge contexts for active challenges
  useEffect(() => {
    const fetchChallengeContexts = async () => {
      if (userInfo.data?.active_chat_template_contexts) {
        const contexts = {};
        for (const context of userInfo.data.active_chat_template_contexts) {
          try {
            const response = await getChatTemplateContextChatTemplatesChatTemplateIdContextGet({
              path: { chat_template_id: context.chat_template_id },
              requiresAuth: true,
            });
            if (response.data?.user_chat_template_context) {
              contexts[context.chat_template_id] = response.data.user_chat_template_context;
            }
          } catch (error) {
            console.error(`Failed to fetch context for challenge ${context.chat_template_id}:`, error);
          }
        }
        setChallengeContexts(contexts);
      }
    };

    void fetchChallengeContexts();
  }, [userInfo.data?.active_chat_template_contexts]);

  // Paginated tournaments list
  const tournaments = usePaginatedData(listChatTemplateContainersChatTemplateContainersGet, {
    pageSize: 12,
    initialParams: {
      query: {
        selection_filter: tournamentFilter,
      },
    },
  });

  // Selected tournament details
  const tournamentDetails = useApiData(
    getChatTemplateContainerChatTemplateContainersChatTemplateContainerIdGet,
    {
      requiresAuth: true,
      enabled: !!selectedTournament,
      initialParams: selectedTournament
        ? {
            path: {
              chat_template_container_id: selectedTournament.id,
            },
          }
        : undefined,
    }
  );
  // Challenges for selected tournament
  const challenges = useApiData(listChatTemplatesChatTemplatesGet, {
    requiresAuth: true,
    enabled: !!selectedTournament,
    initialParams: {
      query: {
        chat_template_container_id: selectedTournament?.id || 0,
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
          chat_template_container_id: selectedTournament.id,
          page_index: 0,
          count: 50,
        },
      });
    }
  }, [selectedTournament?.id]);

  // Fetch context for active challenge (including messages)
  const challengeMessages = useApiData(getChatTemplateContextChatTemplatesChatTemplateIdContextGet, {
    requiresAuth: true,
    enabled: !!activeChallenge,
    initialParams: activeChallenge
      ? {
          path: {
            chat_template_id: activeChallenge.id,
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
          chat_template_id: activeChallenge.id,
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

  // Tournament enrollment is no longer needed
  const handleJoinTournament = async (tournamentId, event) => {
    // Stop propagation to prevent card selection
    if (event) {
      event.stopPropagation();
    }
    // Tournaments are automatically associated when starting a challenge
    console.log('Tournament enrollment no longer required - challenges can be started directly');
  };

  // Handle starting a challenge
  const handleStartChallenge = async (challengeId) => {
    setStartingChallenge(challengeId);
    try {
      const response = await startChatTemplateChatTemplatesChatTemplateIdStartPost({
        path: {
          chat_template_id: challengeId,
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
      const response = await addMessageToChatTemplateChatTemplatesChatTemplateIdAddMessagePost({
        path: {
          chat_template_id: activeChallenge.id,
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
    <Box style={{ backgroundColor: "var(--gray-2)", minHeight: "100vh" }}>
      {/* Header */}
      <Box style={{ backgroundColor: "white", borderBottom: "1px solid var(--gray-5)" }} p="5">
        <Heading size="8" mb="1">Tournaments</Heading>
        <Text color="gray">Join tournaments and compete in cybersecurity challenges</Text>
      </Box>

      {/* Main Content */}
      <Container size="4" p="5">
        {/* Filter Controls */}
        <Card mb="4">
          <Flex gap="2" align="center" wrap="wrap">
            <Text weight="medium" size="2">Filter by status:</Text>
            <ToggleGroup.Root
              type="single"
              value={tournamentFilter}
              onValueChange={(value) => value && handleFilterChange(value)}
              style={{ display: "flex", gap: "0.5rem" }}
            >
              {["ACTIVE", "FUTURE", "PAST", "ACTIVE_AND_FUTURE"].map((filter) => (
                <ToggleGroup.Item
                  key={filter}
                  value={filter}
                  aria-label={`Filter by ${filter.toLowerCase().replace(/_/g, " ")} tournaments`}
                  style={{
                    padding: "0.5rem 1rem",
                    border: "1px solid var(--gray-7)",
                    borderRadius: "var(--radius-2)",
                    backgroundColor: tournamentFilter === filter ? "var(--accent-9)" : "var(--color-background)",
                    color: tournamentFilter === filter ? "white" : "var(--gray-12)",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {filter.replace(/_/g, " ").replace(/AND/g, "&")}
                </ToggleGroup.Item>
              ))}
            </ToggleGroup.Root>
          </Flex>
        </Card>

        {/* Tournament Grid */}
        <DataCard {...tournaments}>
          {(data) => (
            <>
              <Grid columns={{ initial: "1", sm: "2", md: "3" }} gap="3" mb="4">
                {data.map((tournament) => {
                  const status = getTournamentStatus(tournament);
                  const isJoined = joinedTournaments.has(tournament.id);
                  const statusColor = status === "ACTIVE" ? "green" : status === "FUTURE" ? "blue" : "gray";

                  return (
                    <Card
                      key={tournament.id}
                      onClick={() => handleTournamentSelect(tournament)}
                      style={{
                        cursor: "pointer",
                        border: selectedTournament?.id === tournament.id
                          ? "2px solid var(--accent-9)"
                          : "1px solid var(--gray-6)",
                        transition: "all 0.2s",
                      }}
                    >
                      <Flex direction="column" gap="3">
                        <Flex justify="between" align="start">
                          <Heading size="4">{tournament.name}</Heading>
                          {isJoined && (
                            <Badge color="green" size="2">✓ Joined</Badge>
                          )}
                        </Flex>

                        {tournament.description && (
                          <Text size="2" color="gray" style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}>
                            {tournament.description}
                          </Text>
                        )}

                        <Grid columns="2" gap="3" pt="2" style={{ borderTop: "1px solid var(--gray-5)" }}>
                          <Flex direction="column" gap="1">
                            <Text size="1" color="gray" weight="medium">STARTS</Text>
                            <Text size="2">{new Date(tournament.start_date).toLocaleDateString()}</Text>
                          </Flex>
                          <Flex direction="column" gap="1">
                            <Text size="1" color="gray" weight="medium">ENDS</Text>
                            <Text size="2">{new Date(tournament.end_date).toLocaleDateString()}</Text>
                          </Flex>
                        </Grid>

                        <Flex justify="between" align="center" pt="2" style={{ borderTop: "1px solid var(--gray-5)" }}>
                          <Badge color={statusColor}>{status}</Badge>
                          {!isJoined && status !== "PAST" && (
                            <Button
                              size="1"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleJoinTournament(tournament.id, e);
                              }}
                              disabled={joiningTournament === tournament.id}
                            >
                              {joiningTournament === tournament.id ? (
                                <><Spinner size="1" /> Joining...</>
                              ) : (
                                "Join"
                              )}
                            </Button>
                          )}
                        </Flex>
                      </Flex>
                    </Card>
                  );
                })}
              </Grid>

              {/* Pagination */}
              <Card>
                <Flex justify="between" align="center">
                  <Text size="2" color="gray">
                    Showing {Math.min((tournaments.currentPage * 12) + 1, data.length || 1)} - {Math.min((tournaments.currentPage + 1) * 12, (tournaments.currentPage * 12) + data.length)} tournaments
                  </Text>
                  <Flex gap="2" align="center">
                    <Button
                      variant="soft"
                      size="2"
                      onClick={tournaments.prevPage}
                      disabled={!tournaments.hasPrevPage}
                    >
                      <ChevronLeftIcon /> Previous
                    </Button>
                    <Text size="2">Page {tournaments.currentPage + 1}</Text>
                    <Button
                      variant="soft"
                      size="2"
                      onClick={tournaments.nextPage}
                      disabled={!tournaments.hasNextPage}
                    >
                      Next <ChevronRightIcon />
                    </Button>
                  </Flex>
                </Flex>
              </Card>
            </>
          )}
        </DataCard>

        {/* Tournament Details */}
        {selectedTournament && !activeChallenge && (
          <Box mt="5">
            <ProtectedCard>
              <Flex direction="column" gap="4">
                {/* Header */}
                <Flex justify="between" align="center">
                  <Heading size="6">{selectedTournament.name}</Heading>
                  {!joinedTournaments.has(selectedTournament.id) ? (
                    <Button
                      onClick={() => handleJoinTournament(selectedTournament.id)}
                      disabled={joiningTournament === selectedTournament.id}
                    >
                      {joiningTournament === selectedTournament.id ? (
                        <><Spinner size="1" /> Joining...</>
                      ) : (
                        "Join Tournament"
                      )}
                    </Button>
                  ) : (
                    <Badge color="green" size="2">✓ Joined</Badge>
                  )}
                </Flex>

                {/* Description */}
                {selectedTournament.description && (
                  <Text color="gray" style={{ borderBottom: "1px solid var(--gray-5)", paddingBottom: "var(--space-4)" }}>
                    {selectedTournament.description}
                  </Text>
                )}

                {/* Challenges Section */}
                <Box>
                  <Heading size="4" mb="3">Challenges</Heading>
                  {!joinedTournaments.has(selectedTournament.id) ? (
                    <Callout.Root color="amber">
                      <Callout.Text>
                        Join this tournament to view and start challenges
                      </Callout.Text>
                    </Callout.Root>
                  ) : (
                    <DataCard {...challenges}>
                      {(data) => (
                        data.length === 0 ? (
                          <Text color="gray" style={{ textAlign: "center", padding: "var(--space-6)" }}>
                            No challenges available yet
                          </Text>
                        ) : (
                          <Flex direction="column" gap="3">
                            {data.map((item) => {
                              const challenge = item.chat_template;
                              const isActive = userInfo.data?.active_chat_template_contexts?.some(
                                (c) => c.chat_template_id === challenge.id
                              );
                              const context = challengeContexts[challenge.id];
                              const canContribute = context?.can_contribute !== false;
                              const isCompleted = context?.succeeded_at != null;

                              return (
                                <Card key={challenge.id} style={{ backgroundColor: "var(--gray-2)" }}>
                                  <Flex direction="column" gap="3">
                                    {/* Challenge Header */}
                                    <Flex justify="between" align="start">
                                      <Heading size="3">{challenge.name}</Heading>
                                      <Flex gap="1" wrap="wrap">
                                        {isCompleted && <Badge color="green">✓ Completed</Badge>}
                                        {isActive && !isCompleted && <Badge color="blue">Started</Badge>}
                                        {isActive && !canContribute && !isCompleted && (
                                          <Badge color="red">Locked</Badge>
                                        )}
                                      </Flex>
                                    </Flex>

                                    {/* Description */}
                                    {challenge.description && (
                                      <Text size="2" color="gray">{challenge.description}</Text>
                                    )}

                                    {/* Tools */}
                                    {challenge.tools_available && (
                                      <Flex gap="2" align="center">
                                        <Text size="1" color="gray" weight="medium">Available tools:</Text>
                                        <Badge variant="soft">{challenge.tools_available}</Badge>
                                      </Flex>
                                    )}

                                    {/* Started date */}
                                    {context?.started_at && (
                                      <Flex gap="2" align="center">
                                        <Text size="1" color="gray" weight="medium">Started:</Text>
                                        <Text size="2">{new Date(context.started_at).toLocaleDateString()}</Text>
                                      </Flex>
                                    )}

                                    {/* Action buttons */}
                                    <Flex justify="end">
                                      {!isCompleted && !isActive && (
                                        <Button
                                          size="2"
                                          color="green"
                                          onClick={() => canContribute && handleStartChallenge(challenge.id)}
                                          disabled={startingChallenge === challenge.id || !canContribute}
                                        >
                                          {startingChallenge === challenge.id ? (
                                            <><Spinner size="1" /> Starting...</>
                                          ) : !canContribute ? (
                                            "Challenge Locked"
                                          ) : (
                                            "Start Challenge"
                                          )}
                                        </Button>
                                      )}
                                      {!isCompleted && isActive && (
                                        <Button
                                          size="2"
                                          onClick={() => handleJoinChallenge(challenge)}
                                        >
                                          Join Challenge
                                        </Button>
                                      )}
                                      {isCompleted && (
                                        <Button size="2" variant="soft" disabled>
                                          View Results
                                        </Button>
                                      )}
                                    </Flex>
                                  </Flex>
                                </Card>
                              );
                            })}
                          </Flex>
                        )
                      )}
                    </DataCard>
                  )}
                </Box>
              </Flex>
            </ProtectedCard>
          </Box>
        )}

        {/* Chat Interface */}
        {activeChallenge && (
          <Card mt="5">
            <Flex direction="column" style={{ height: "600px" }}>
              {/* Chat Header */}
              <Flex
                justify="between"
                align="center"
                p="4"
                style={{ borderBottom: "1px solid var(--gray-5)" }}
              >
                <Heading size="4">Challenge: {activeChallenge.name}</Heading>
                <Button
                  variant="ghost"
                  onClick={() => setActiveChallenge(null)}
                >
                  <Cross2Icon /> Close Chat
                </Button>
              </Flex>

              {/* Messages Area */}
              <ScrollArea.Root
                type="auto"
                style={{ flex: 1 }}
              >
                <ScrollArea.Viewport style={{ width: "100%", height: "100%" }}>
                  <Box p="4">
                    {challengeMessages.loading && (
                      <Flex align="center" justify="center" py="6">
                        <Spinner size="3" />
                        <Text color="gray" ml="2">Loading messages...</Text>
                      </Flex>
                    )}

                    {challengeMessages.error && (
                      <Callout.Root color="red">
                        <Callout.Icon>
                          <ExclamationTriangleIcon />
                        </Callout.Icon>
                        <Callout.Text>Failed to load messages</Callout.Text>
                      </Callout.Root>
                    )}

                    {challengeMessages.data && (() => {
                      const messages = challengeMessages.data.messages ||
                                     challengeMessages.data?.user_chat_template_context?.messages ||
                                     [];

                      if (messages.length > 0) {
                        return (
                          <Flex direction="column" gap="3">
                            {messages.map((message, index) => {
                              const role = message.role?.toLowerCase();
                              const isUser = role === 'user';
                              const displayRole = isUser ? 'You' : 'Assistant';

                              return (
                                <Flex
                                  key={index}
                                  justify={isUser ? "end" : "start"}
                                >
                                  <Card
                                    style={{
                                      maxWidth: "80%",
                                      backgroundColor: isUser
                                        ? "var(--accent-9)"
                                        : "var(--gray-3)",
                                    }}
                                  >
                                    <Flex direction="column" gap="1">
                                      <Badge size="1" variant="soft">
                                        {displayRole}
                                      </Badge>
                                      <Text
                                        size="2"
                                        style={{
                                          color: isUser ? "white" : "inherit",
                                          whiteSpace: "pre-wrap",
                                        }}
                                      >
                                        {message.content || message.text || message.message || '[No content]'}
                                      </Text>
                                      {message.tool_name && (
                                        <Badge size="1" color="gray">
                                          Tool: {message.tool_name}
                                        </Badge>
                                      )}
                                    </Flex>
                                  </Card>
                                </Flex>
                              );
                            })}
                            <div ref={messagesEndRef} />
                          </Flex>
                        );
                      } else {
                        return (
                          <Text color="gray" style={{ textAlign: "center", fontStyle: "italic" }}>
                            No messages yet. Start the conversation!
                          </Text>
                        );
                      }
                    })()}
                  </Box>
                </ScrollArea.Viewport>
                <ScrollArea.Scrollbar orientation="vertical">
                  <ScrollArea.Thumb />
                </ScrollArea.Scrollbar>
              </ScrollArea.Root>

              {/* Input Area */}
              <Flex
                gap="2"
                p="4"
                style={{ borderTop: "1px solid var(--gray-5)" }}
              >
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      void handleSendMessage();
                    }
                  }}
                  disabled={sendingMessage}
                  style={{
                    flex: 1,
                    padding: "var(--space-2)",
                    border: "1px solid var(--gray-7)",
                    borderRadius: "var(--radius-2)",
                    fontSize: "var(--font-size-2)",
                    fontFamily: "var(--default-font-family)",
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={sendingMessage || !messageInput.trim()}
                >
                  {sendingMessage ? <Spinner size="1" /> : "Send"}
                </Button>
              </Flex>
            </Flex>
          </Card>
        )}
      </Container>
    </Box>
  );
}

export default Tournaments;