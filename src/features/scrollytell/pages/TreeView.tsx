import React, { useMemo } from 'react';
import { useScrollyTell } from '../context/ScrollyTellContext';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useApiData } from '../../../shared/hooks/useApiData';
import { ensureChatContextChatContextsEnsurePost } from '../../../backend_client/sdk.gen';
import type { EnsureChatContextResponse, MessageContainer } from '../../../backend_client/types.gen';
import { calculateTreeLayout, calculateBoundingBox } from '../utils/treeLayout';
import TreeConnections from '../components/TreeConnections';
import LLMUIMessage from '../components/LLMUIMessage';
import './ScrollyTell.css';

const TreeView: React.FC = () => {
  const {
    currentChatLeafId,
    setCurrentChatLeafId,
    scrollyTellData
  } = useScrollyTell();
  const { session } = useAuth();

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

  // Extract message tree from user context
  const userMessageTree = useMemo(() => {
    return (contextData?.chat_context?.message_tree as MessageContainer[]) || [];
  }, [contextData]);

  // Calculate layout once when userMessageTree changes
  const layout = useMemo(() => calculateTreeLayout(userMessageTree), [userMessageTree]);

  // Get dimensions for container
  const { width, height } = useMemo(() => calculateBoundingBox(layout), [layout]);

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
        <h2>Tree View</h2>
        <p className="view-description">
          Visualizes the entire MessageTree structure with branching conversations.
        </p>

        <div className="tree-visualization">
          <div className="tree-canvas" style={{ width, height, position: 'relative' }}>
            {/* SVG layer for connections */}
            <TreeConnections layout={layout} currentLeafId={currentChatLeafId} />

            {/* Nodes positioned absolutely */}
            {userMessageTree.map(container => {
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
          <p>Total messages: {userMessageTree.length}</p>
          <p>Current selection: Message #{currentChatLeafId}</p>
          <p>Click on any message to update the current chat path</p>
        </div>
      </div>
    </div>
  );
};

export default TreeView;