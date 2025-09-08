import React, { useMemo } from 'react';
import { useScrollyTell } from '../context/ScrollyTellContext';
import { calculateTreeLayout, calculateBoundingBox } from '../utils/treeLayout';
import TreeConnections from '../components/TreeConnections';
import './ScrollyTell.css';

const TreeView: React.FC = () => {
  const { messageTree, currentChatLeafId, setCurrentChatLeafId } = useScrollyTell();

  // Calculate layout once when messageTree changes
  const layout = useMemo(() => calculateTreeLayout(messageTree), [messageTree]);
  
  // Get dimensions for container
  const { width, height } = useMemo(() => calculateBoundingBox(layout), [layout]);

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
            {messageTree.map(container => {
              const position = layout.get(container.id);
              if (!position) return null;
              
              const isActive = container.id === currentChatLeafId;
              
              return (
                <div
                  key={container.id}
                  className={`tree-message role-${container.message.role} ${isActive ? 'active' : ''}`}
                  style={{
                    position: 'absolute',
                    left: position.x,
                    top: position.y,
                    width: position.width
                  }}
                  onClick={() => setCurrentChatLeafId(container.id)}
                >
                  <div className="message-header">
                    <span className="message-id">#{container.id}</span>
                    <span className="message-role">{container.message.role}</span>
                  </div>
                  <div className="message-text">
                    {container.message.content.substring(0, 50)}...
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