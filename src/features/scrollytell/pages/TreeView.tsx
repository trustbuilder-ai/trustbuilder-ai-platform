import React, { useMemo, useState } from 'react';
import { Flex, Button, AlertDialog, Callout } from '@radix-ui/themes';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import { useScrollyTell } from '../context/ScrollyTellContext';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useUserContext } from '../hooks';
import { deleteChatContextChatContextsChatContextIdDelete } from '../../../backend_client/sdk.gen';
import { calculateTreeLayout, calculateBoundingBox } from '../utils/treeLayout';
import TreeConnections from '../components/TreeConnections';
import LLMUIMessage from '../components/LLMUIMessage';
import './ScrollyTell.css';

const TreeView: React.FC = () => {
  const {
    currentChatLeafId,
    setCurrentChatLeafId
  } = useScrollyTell();
  const { session } = useAuth();

  // Reset state
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Use shared context hook
  const {
    contextData,
    loading,
    error,
    refetch,
    userMessageTree,
    setUserMessageTree,
    setContextId
  } = useUserContext();

  // Use shared message tree (already extracted by useUserContext)
  const messageTree = userMessageTree || [];

  // Calculate layout once when messageTree changes
  const layout = useMemo(() => calculateTreeLayout(messageTree), [messageTree]);

  // Get dimensions for container
  const { width, height } = useMemo(() => calculateBoundingBox(layout), [layout]);

  // Handle reset conversation
  const handleResetConversation = async () => {
    if (!contextData?.chat_context?.id) return;

    console.log('[TreeView] Reset starting:', {
      contextId: contextData.chat_context.id,
      contextIdType: typeof contextData.chat_context.id,
      fullContext: contextData.chat_context
    });

    setIsResetting(true);
    setResetError(null);

    try {
      // Delete the current context
      await deleteChatContextChatContextsChatContextIdDelete({
        path: { chat_context_id: contextData.chat_context.id },
        throwOnError: true,
      });

      // Clear shared state immediately to reflect reset
      setUserMessageTree(null);
      setContextId(null);

      // Refetch to create a fresh context with template defaults
      // useUserContext will update the shared state when new data arrives
      refetch();
    } catch (err) {
      // Show actual error details from backend
      const errorMessage = err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'error' in err
        ? String((err as any).error)
        : 'Failed to reset conversation';
      setResetError(errorMessage);
      console.error('Reset failed:', err);
    } finally {
      setIsResetting(false);
    }
  };

  // Auth gate
  if (!session) {
    return (
      <div className="tree-view">
        <div className="view-container">
          <h2>Tree View</h2>
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
      <div className="tree-view">
        <div className="view-container">
          <h2>Tree View</h2>
          <p className="view-description">Loading your conversation tree...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tree-view">
        <div className="view-container">
          <h2>Tree View</h2>
          <p className="view-description error">
            Error loading your context: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="tree-view">
      <div className="view-container">
        {/* Header with Reset button */}
        <Flex justify="between" align="center" mb="2">
          <h2>Tree View</h2>
          <AlertDialog.Root>
            <AlertDialog.Trigger>
              <Button
                color="red"
                variant="soft"
                disabled={isResetting || loading}
              >
                {isResetting ? 'Resetting...' : 'Reset'}
              </Button>
            </AlertDialog.Trigger>
            <AlertDialog.Content maxWidth="450px">
              <AlertDialog.Title>Reset Conversation Tree?</AlertDialog.Title>
              <AlertDialog.Description size="2">
                This will delete your entire conversation history and reset to the default template state.
                This action cannot be undone.
              </AlertDialog.Description>

              <Flex gap="3" mt="4" justify="end">
                <AlertDialog.Cancel>
                  <Button variant="soft" color="gray">
                    Cancel
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action>
                  <Button
                    variant="solid"
                    color="red"
                    onClick={handleResetConversation}
                  >
                    Reset
                  </Button>
                </AlertDialog.Action>
              </Flex>
            </AlertDialog.Content>
          </AlertDialog.Root>
        </Flex>

        <p className="view-description">
          Visualizes the entire MessageTree structure with branching conversations.
        </p>

        {/* Error message if reset fails */}
        {resetError && (
          <Callout.Root color="red" mb="3">
            <Callout.Icon>
              <InfoCircledIcon />
            </Callout.Icon>
            <Callout.Text>
              Failed to reset: {resetError}
            </Callout.Text>
          </Callout.Root>
        )}

        <div className="tree-visualization">
          <div className="tree-canvas" style={{ width, height, position: 'relative' }}>
            {/* SVG layer for connections */}
            <TreeConnections layout={layout} currentLeafId={currentChatLeafId} />

            {/* Nodes positioned absolutely */}
            {messageTree.map(container => {
              const position = layout.get(container.id_in_tree);
              if (!position) return null;

              const isActive = container.id_in_tree === currentChatLeafId;

              return (
                <div
                  key={container.id_in_tree}
                  className={`tree-node ${isActive ? 'active' : ''}`}
                  style={{
                    position: 'absolute',
                    left: position.x,
                    top: position.y,
                    width: position.width
                  }}
                  onClick={() => setCurrentChatLeafId(container.id_in_tree)}
                >
                  <div className="tree-node-header">
                    <span className="node-id">#{container.id_in_tree}</span>
                  </div>
                  <div className="tree-node-content">
                    <LLMUIMessage
                      message={container}
                      truncate={true}
                      maxLength={50}
                      showActions={false}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="tree-info">
          <p>Total messages: {messageTree.length}</p>
          <p>Current selection: Message #{currentChatLeafId}</p>
          <p>Click on any message to update the current chat path</p>
        </div>
      </div>
    </div>
  );
};

export default TreeView;