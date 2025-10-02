import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, TextArea, Button, Callout, DropdownMenu, Text } from '@radix-ui/themes';
import { InfoCircledIcon, ChevronDownIcon } from '@radix-ui/react-icons';
import { useScrollyTell } from '../context/ScrollyTellContext';
import { useAuth } from '../../../shared/hooks/useAuth';
import { updateChatContextMessageTreeChatContextsChatContextIdMessageTreePatch } from '../../../backend_client/sdk.gen';
import type { MessageContainer, ChatMessage } from '../../../backend_client/types.gen';
import LLMUIMessage from '../components/LLMUIMessage';
import SelectedModelsDisplay from '../components/SelectedModelsDisplay';
import SiblingMessagesGroup from '../components/SiblingMessagesGroup';
import EvaluationResultsTable from '../components/EvaluationResultsTable';
import { useChatCompletion, useAvailableModels, useUserContext, useEvaluation } from '../hooks';
import './ScrollyTell.css';

// Utility function to get sibling messages (same parent, different models)
const getSiblings = (messageId: number, tree: MessageContainer[]): MessageContainer[] => {
  const message = tree.find(m => m.id_in_tree === messageId);
  if (!message) return [];

  const siblings = tree.filter(m =>
    m.parent_id_in_tree === message.parent_id_in_tree &&
    m.id_in_tree !== messageId &&
    m.message.model // Only include messages with a model field (multi-model responses)
  );

  // Include the original message if it has a model
  if (message.message.model) {
    return [message, ...siblings];
  }

  return siblings;
};

const ChatView: React.FC = () => {
  const {
    currentChatLeafId,
    setCurrentChatLeafId,
    setCurrentView
  } = useScrollyTell();
  const { session } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State for message input and streaming
  const [messageInput, setMessageInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streamingMessages, setStreamingMessages] = useState<MessageContainer[]>([]);

  // Track saved message IDs (only show eval buttons after tree saved to DB)
  const [savedMessageIds, setSavedMessageIds] = useState<Set<number>>(new Set());

  // Track which sibling groups to display
  const [activeSiblingGroups, setActiveSiblingGroups] = useState<Set<number>>(new Set());

  // Evaluation table state
  const [showEvalTable, setShowEvalTable] = useState(false);
  const [currentEvalSiblings, setCurrentEvalSiblings] = useState<MessageContainer[]>([]);

  // Fetch available models
  const { models, loading: modelsLoading, error: modelsError } = useAvailableModels();

  // Multi-model selection with localStorage persistence
  const [selectedModels, setSelectedModels] = useState<string[]>(() => {
    const saved = localStorage.getItem('chatview-selected-models');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return ['gpt-4o-mini'];
      }
    }
    return ['gpt-4o-mini'];
  });

  // Update localStorage when models change
  useEffect(() => {
    localStorage.setItem('chatview-selected-models', JSON.stringify(selectedModels));
  }, [selectedModels]);

  // Toggle model selection
  const toggleModel = (modelId: string, checked: boolean) => {
    setSelectedModels(prev => {
      if (checked) {
        return [...prev, modelId];
      } else {
        const filtered = prev.filter(id => id !== modelId);
        return filtered.length > 0 ? filtered : prev; // Prevent empty selection
      }
    });
  };

  // Chat completion hook for streaming (model will be overridden per request)
  const { streamCompletion, isStreaming, error: streamError } = useChatCompletion({
    model: selectedModels[0] || 'gpt-4o-mini', // Default model
    temperature: 0.7,
    maxTokens: 2000,
  });

  // Use shared context hook
  const {
    contextData,
    loading,
    error,
    userMessageTree,
    setUserMessageTree
  } = useUserContext();

  // Use shared message tree
  const messageTree = userMessageTree || [];

  // Use shared evaluation hook
  const { evalResults, evaluatingNodes, evaluateMessage } = useEvaluation(contextData?.chat_context?.id);

  // Initialize savedMessageIds from messageTree when context loads
  useEffect(() => {
    if (messageTree.length > 0) {
      const allMessageIds = new Set(messageTree.map(m => m.id_in_tree));
      setSavedMessageIds(allMessageIds);
    }
  }, [messageTree.length]); // Only re-run when tree size changes

  // Calculate message path
  const messagePath = useMemo(() => {
    const path: MessageContainer[] = [];
    let currentMessage = messageTree.find(m => m.id_in_tree === currentChatLeafId);

    while (currentMessage) {
      path.unshift(currentMessage);
      if (currentMessage.parent_id_in_tree === null || currentMessage.parent_id_in_tree === 0) {
        break;
      }
      currentMessage = messageTree.find(m => m.id_in_tree === currentMessage?.parent_id_in_tree);
    }

    return path;
  }, [messageTree, currentChatLeafId]);

  // Auto-scroll to bottom when messages change or during streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagePath, streamingMessages]);

  const handleFork = (messageId: number) => {
    // TODO: Implement fork functionality with PATCH to backend
    console.log(`Fork requested for message ${messageId} - not yet implemented`);
  };

  const handleTreeView = (messageId: number) => {
    setCurrentChatLeafId(messageId);
    setCurrentView('tree');
    navigate(`/scrollytell/tree?messageId=${messageId}`);
  };

  // Handle evaluate all siblings - show table dialog
  const handleEvaluateAll = async (siblings: MessageContainer[]) => {
    setCurrentEvalSiblings(siblings);
    setShowEvalTable(true);

    // Trigger evaluations for all siblings that don't have results
    for (const sibling of siblings) {
      if (!evalResults[sibling.id_in_tree]) {
        await evaluateMessage(sibling.id_in_tree);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !contextData?.chat_context?.id || isSubmitting || selectedModels.length === 0) {
      return;
    }

    setIsSubmitting(true);
    const userInput = messageInput.trim();
    setMessageInput('');

    try {
      // 1. Calculate new IDs for user and assistant messages
      const maxId = Math.max(...messageTree.map(m => m.id_in_tree), 0);
      const userMessageId = maxId + 1;

      // 2. Create user message container
      const userMessage: MessageContainer = {
        id_in_tree: userMessageId,
        parent_id_in_tree: currentChatLeafId,
        message: {
          role: 'user',
          content: userInput,
        },
      };

      // 3. Add user message to tree immediately so user sees it while streaming
      const treeWithUserMessage = [...messageTree, userMessage];
      setUserMessageTree(treeWithUserMessage);

      // 4. Convert message path to ChatMessage format for LLM API
      const chatMessages: ChatMessage[] = messagePath.map(container => ({
        role: container.message.role as 'user' | 'assistant' | 'system',
        content: container.message.content,
      }));

      // Add the new user message
      chatMessages.push({
        role: 'user',
        content: userInput,
      });

      // 5. Stream to all selected models in parallel
      const streamPromises = selectedModels.map((modelId, idx) => {
        const assistantId = maxId + 2 + idx;

        return streamCompletion({
          messages: chatMessages,
          model: modelId, // Override model for each stream
          onChunk: (content) => {
            // Update streaming message for this model in real-time
            setStreamingMessages(prev => {
              const existing = prev.find(m => m.id_in_tree === assistantId);
              if (existing) {
                return prev.map(m =>
                  m.id_in_tree === assistantId
                    ? { ...m, message: { ...m.message, content } }
                    : m
                );
              } else {
                return [...prev, {
                  id_in_tree: assistantId,
                  parent_id_in_tree: userMessageId,
                  message: {
                    role: 'assistant',
                    content,
                    model: modelId,
                  },
                }];
              }
            });
          },
        }).then(({ content }) => ({
          id_in_tree: assistantId,
          parent_id_in_tree: userMessageId,
          message: {
            role: 'assistant',
            content,
            model: modelId, // Populate model field
          },
        }));
      });

      // 6. Wait for all streams to complete
      const assistantMessages = await Promise.all(streamPromises);

      // 7. Build final tree with user message and all assistant messages
      const finalTree = [...treeWithUserMessage, ...assistantMessages];

      // 8. PATCH complete tree to backend (saves after all streaming done)
      await updateChatContextMessageTreeChatContextsChatContextIdMessageTreePatch({
        path: { chat_context_id: contextData.chat_context.id },
        body: { message_tree: finalTree },
        throwOnError: false,
      });

      // 9. Mark new messages as saved (enables eval buttons)
      const newMessageIds = new Set([userMessageId, ...assistantMessages.map(m => m.id_in_tree)]);
      setSavedMessageIds(prev => new Set([...prev, ...newMessageIds]));

      // 10. Update current leaf to the first assistant message
      setCurrentChatLeafId(assistantMessages[0].id_in_tree);

      // 11. Update shared tree state with final complete tree
      setUserMessageTree(finalTree);

      // 12. Auto-activate sibling group if multiple models were used
      if (selectedModels.length > 1) {
        setActiveSiblingGroups(prev => new Set([...prev, assistantMessages[0].id_in_tree]));
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Show error toast notification
    } finally {
      setIsSubmitting(false);
      setStreamingMessages([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auth gate
  if (!session) {
    return (
      <div className="chat-view">
        <div className="view-container">
          <h2>Chat View</h2>
          <p className="view-description">
            Please sign in to view and edit your personal message tree.
          </p>
          <div className="auth-gate">
            <p>This view requires authentication to load your personal conversation history.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="chat-view">
        <div className="view-container">
          <h2>Chat View</h2>
          <p className="view-description">Loading your conversation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-view">
        <div className="view-container">
          <h2>Chat View</h2>
          <p className="view-description error">
            Error loading your context: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-view">
      <div className="view-container">
        <h2>Chat View</h2>
        <p className="view-description">
          Linear display of LLM messages in a chat-like interface.
        </p>

        <div className="chat-messages">
          <div className="messages-container">
            {messagePath.map((container) => {
              const siblings = getSiblings(container.id_in_tree, messageTree);
              const showSiblingGroup = activeSiblingGroups.has(container.id_in_tree) && siblings.length > 1;
              const hasSiblings = siblings.length > 1;

              return (
                <React.Fragment key={container.id_in_tree}>
                  {showSiblingGroup ? (
                    // Show sibling group
                    <SiblingMessagesGroup
                      siblings={siblings}
                      onContinueFrom={(id) => setCurrentChatLeafId(id)}
                      onEvaluate={evaluateMessage}
                      onEvaluateAll={() => handleEvaluateAll(siblings)}
                      evalResults={evalResults}
                      evaluatingNodes={evaluatingNodes}
                      showEvalButtons={siblings.every(s => savedMessageIds.has(s.id_in_tree))}
                      currentLeafId={currentChatLeafId}
                    />
                  ) : (
                    // Show single message
                    <>
                      <LLMUIMessage
                        message={container}
                        showActions={true}
                        onFork={() => handleFork(container.id_in_tree)}
                        onTreeView={() => handleTreeView(container.id_in_tree)}
                        showEvalButton={savedMessageIds.has(container.id_in_tree)}
                        evalResult={evalResults[container.id_in_tree]}
                        isEvaluating={evaluatingNodes.has(container.id_in_tree)}
                        onEvaluate={() => evaluateMessage(container.id_in_tree)}
                      />
                      {/* Show sibling indicator link if siblings exist */}
                      {hasSiblings && !showSiblingGroup && (
                        <Button
                          size="1"
                          variant="ghost"
                          color="purple"
                          onClick={() => setActiveSiblingGroups(prev => new Set([...prev, container.id_in_tree]))}
                          className="sibling-indicator-link"
                          style={{ marginTop: '-0.5rem', marginBottom: '0.5rem' }}
                        >
                          View {siblings.length - 1} other response{siblings.length - 1 !== 1 ? 's' : ''} from different models
                        </Button>
                      )}
                    </>
                  )}
                </React.Fragment>
              );
            })}

            {/* Display streaming messages */}
            {streamingMessages.map((streamingMsg) => (
              <LLMUIMessage
                key={`streaming-${streamingMsg.id_in_tree}`}
                message={streamingMsg}
                showActions={false}
              />
            ))}
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat Controls Container */}
        <Box mt="4">
          {/* Metadata row: Selected models + Conversation stats */}
          <Flex mb="3" justify="between" align="center">
            {/* Left: Selected models */}
            <SelectedModelsDisplay
              selectedModels={selectedModels}
              models={models}
              loading={modelsLoading}
            />

            {/* Right: Conversation stats */}
            <Flex gap="3" align="center">
              <Text size="2" color="gray">
                Path to #{currentChatLeafId}
              </Text>
              <Text size="2" color="gray">
                •
              </Text>
              <Text size="2" color="gray">
                {messagePath.length} messages
              </Text>
            </Flex>
          </Flex>

          {/* Show model loading error if any */}
          {modelsError && (
            <Callout.Root color="red" mb="3">
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                Failed to load models: {modelsError.message}
              </Callout.Text>
            </Callout.Root>
          )}

          {/* Message input area */}
          <Flex gap="3" align="end">
            <Box style={{ flex: 1 }}>
              <TextArea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (Shift+Enter for new line)"
                disabled={isSubmitting || isStreaming}
                rows={3}
                size="3"
                resize="vertical"
              />
            </Box>

            {/* Split Button: Send + Model Selection Dropdown */}
            <Flex gap="0" style={{ display: 'inline-flex' }}>
              <Button
                onClick={handleSendMessage}
                disabled={isSubmitting || isStreaming || !messageInput.trim() || selectedModels.length === 0}
                size="3"
                style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
              >
                {isSubmitting || isStreaming ? 'Sending...' : 'Send'}
              </Button>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  <Button
                    size="3"
                    disabled={isSubmitting || isStreaming}
                    style={{
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      borderLeft: '1px solid var(--gray-6)',
                      paddingLeft: '8px',
                      paddingRight: '8px'
                    }}
                  >
                    <ChevronDownIcon />
                  </Button>
                </DropdownMenu.Trigger>
                <DropdownMenu.Content>
                  {models.map((model) => (
                    <DropdownMenu.CheckboxItem
                      key={model.id}
                      checked={selectedModels.includes(model.id)}
                      onCheckedChange={(checked) => toggleModel(model.id, checked)}
                    >
                      {model.display_name || model.id}
                    </DropdownMenu.CheckboxItem>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </Flex>
          </Flex>

          {/* Show error if streaming failed */}
          {streamError && (
            <Callout.Root color="red" mt="3">
              <Callout.Icon>
                <InfoCircledIcon />
              </Callout.Icon>
              <Callout.Text>
                Error: {streamError.message}
              </Callout.Text>
            </Callout.Root>
          )}
        </Box>

        {/* Evaluation Results Table Dialog */}
        <EvaluationResultsTable
          siblings={currentEvalSiblings}
          evalResults={evalResults}
          evaluatingNodes={evaluatingNodes}
          onEvaluate={evaluateMessage}
          isOpen={showEvalTable}
          onClose={() => setShowEvalTable(false)}
        />
      </div>
    </div>
  );
};

export default ChatView;
