import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useScrollyTell } from '../context/ScrollyTellContext';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useApiData } from '../../../shared/hooks/useApiData';
import {
  ensureChatContextChatContextsEnsurePost,
  updateChatContextMessageTreeChatContextsChatContextIdMessageTreePatch
} from '../../../backend_client/sdk.gen';
import type { EnsureChatContextResponse, MessageContainer, ChatMessage } from '../../../backend_client/types.gen';
import LLMUIMessage from '../components/LLMUIMessage';
import { useChatCompletion } from '../hooks';
import './ScrollyTell.css';

const ChatView: React.FC = () => {
  const {
    currentChatLeafId,
    setCurrentChatLeafId,
    setCurrentView,
    scrollyTellData
  } = useScrollyTell();
  const { session } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State for message input and streaming
  const [messageInput, setMessageInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<MessageContainer | null>(null);
  const [selectedModel] = useState('gpt-4o-mini'); // TODO: Add model selection UI
  const [localMessageTree, setLocalMessageTree] = useState<MessageContainer[] | null>(null);

  // Chat completion hook for streaming
  const { streamCompletion, isStreaming, error: streamError } = useChatCompletion({
    model: selectedModel,
    temperature: 0.7,
    maxTokens: 2000,
  });

  // Fetch or create user context using the shared hook pattern
  const userContextData = useApiData<EnsureChatContextResponse>(
    ensureChatContextChatContextsEnsurePost,
    {
      requiresAuth: true,
      enabled: !!scrollyTellData.chat_template_id,
      initialParams: scrollyTellData.chat_template_id ? {
        body: { chat_template_id: scrollyTellData.chat_template_id }
      } : undefined
    }
  );

  const { data: contextData, loading, error } = userContextData;

  // Extract message tree from user context (with local override)
  const userMessageTree = useMemo(() => {
    if (localMessageTree) return localMessageTree;
    return (contextData?.chat_context?.message_tree as unknown as MessageContainer[]) || [];
  }, [localMessageTree, contextData]);

  // Calculate message path
  const messagePath = useMemo(() => {
    const path: MessageContainer[] = [];
    let currentMessage = userMessageTree.find(m => m.id_in_tree === currentChatLeafId);

    while (currentMessage) {
      path.unshift(currentMessage);
      if (currentMessage.parent_id_in_tree === null || currentMessage.parent_id_in_tree === 0) {
        break;
      }
      currentMessage = userMessageTree.find(m => m.id_in_tree === currentMessage?.parent_id_in_tree);
    }

    return path;
  }, [userMessageTree, currentChatLeafId]);

  // Auto-scroll to bottom when messages change or during streaming
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagePath, streamingMessage]);

  const handleFork = (messageId: number) => {
    // TODO: Implement fork functionality with PATCH to backend
    console.log(`Fork requested for message ${messageId} - not yet implemented`);
  };

  const handleTreeView = (messageId: number) => {
    setCurrentChatLeafId(messageId);
    setCurrentView('tree');
    navigate(`/scrollytell/tree?messageId=${messageId}`);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !contextData?.chat_context?.id || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const userInput = messageInput.trim();
    setMessageInput('');

    try {
      // 1. Calculate new IDs for user and assistant messages
      const maxId = Math.max(...userMessageTree.map(m => m.id_in_tree), 0);
      const userMessageId = maxId + 1;
      const assistantMessageId = maxId + 2;

      // 2. Create user message container
      const userMessage: MessageContainer = {
        id_in_tree: userMessageId,
        parent_id_in_tree: currentChatLeafId,
        message: {
          role: 'user',
          content: userInput,
        },
      };

      // 3. Convert message path to ChatMessage format for LLM API
      const chatMessages: ChatMessage[] = messagePath.map(container => ({
        role: container.message.role as 'user' | 'assistant' | 'system',
        content: container.message.content,
      }));

      // Add the new user message
      chatMessages.push({
        role: 'user',
        content: userInput,
      });

      // 4. Stream LLM response
      const { content: assistantContent } = await streamCompletion({
        messages: chatMessages,
        onChunk: (content) => {
          // Update streaming message display in real-time
          setStreamingMessage({
            id_in_tree: assistantMessageId,
            parent_id_in_tree: userMessageId,
            message: {
              role: 'assistant',
              content,
            },
          });
        },
      });

      // 5. Create assistant message container with complete content
      const assistantMessage: MessageContainer = {
        id_in_tree: assistantMessageId,
        parent_id_in_tree: userMessageId,
        message: {
          role: 'assistant',
          content: assistantContent,
        },
      };

      // 6. Update message tree with both new messages
      const updatedTree = [...userMessageTree, userMessage, assistantMessage];

      // 7. PATCH updated tree to backend
      await updateChatContextMessageTreeChatContextsChatContextIdMessageTreePatch({
        path: { chat_context_id: contextData.chat_context.id },
        body: { message_tree: updatedTree },
        throwOnError: false,
      });

      // 8. Update current leaf to the new assistant message
      setCurrentChatLeafId(assistantMessageId);

      // 9. Update local tree state (avoids refetch and loading flicker)
      setLocalMessageTree(updatedTree);

    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Show error toast notification
    } finally {
      setIsSubmitting(false);
      setStreamingMessage(null);
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
            {messagePath.map((container) => (
              <LLMUIMessage
                key={container.id_in_tree}
                message={container}
                showActions={true}
                onFork={() => handleFork(container.id_in_tree)}
                onTreeView={() => handleTreeView(container.id_in_tree)}
              />
            ))}

            {/* Display streaming message */}
            {streamingMessage && (
              <LLMUIMessage
                key="streaming"
                message={streamingMessage}
                showActions={false}
              />
            )}
            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message input area */}
        <div className="chat-input-container">
          <textarea
            className="chat-input"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            disabled={isSubmitting || isStreaming}
            rows={3}
          />
          <button
            type="button"
            className="chat-send-button"
            onClick={handleSendMessage}
            disabled={isSubmitting || isStreaming || !messageInput.trim()}
          >
            {isSubmitting || isStreaming ? 'Sending...' : 'Send'}
          </button>
        </div>

        {/* Show error if streaming failed */}
        {streamError && (
          <div className="chat-error">
            Error: {streamError.message}
          </div>
        )}

        <div className="chat-info">
          <p>Showing path to message {currentChatLeafId}</p>
          <p>{messagePath.length} messages in current conversation</p>
        </div>
      </div>
    </div>
  );
};

export default ChatView;
