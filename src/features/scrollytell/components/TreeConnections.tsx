import React from 'react';
import { TreeNode, getPathToNode } from '../utils/treeLayout';

interface TreeConnectionsProps {
  layout: Map<number, TreeNode>;
  currentLeafId: number;
}

const TreeConnections: React.FC<TreeConnectionsProps> = ({ layout, currentLeafId }) => {
  // Get the active path for highlighting
  const activePath = getPathToNode(layout, currentLeafId);
  const activePathSet = new Set(activePath);
  
  // Generate SVG paths for all connections
  const connections: JSX.Element[] = [];
  
  layout.forEach((node, nodeId) => {
    node.children.forEach(childId => {
      const childNode = layout.get(childId);
      if (!childNode) return;
      
      const isActive = activePathSet.has(nodeId) && activePathSet.has(childId);
      
      // Calculate connection points
      const startX = node.x + node.width / 2;
      const startY = node.y + node.height;
      const endX = childNode.x + childNode.width / 2;
      const endY = childNode.y;
      
      // Create path with orthogonal lines (vertical then horizontal then vertical)
      let pathData: string;
      
      if (node.column === childNode.column) {
        // Same column - straight vertical line
        pathData = `M ${startX} ${startY} L ${endX} ${endY}`;
      } else {
        // Different columns - need orthogonal path
        const midY = startY + (endY - startY) / 2;
        pathData = `M ${startX} ${startY} L ${startX} ${midY} L ${endX} ${midY} L ${endX} ${endY}`;
      }
      
      connections.push(
        <path
          key={`${nodeId}-${childId}`}
          d={pathData}
          className={`tree-connection-line ${isActive ? 'active' : ''}`}
          strokeDasharray={isActive ? undefined : "5,5"}
        />
      );
    });
  });
  
  // Calculate SVG dimensions
  let maxX = 0;
  let maxY = 0;
  layout.forEach(node => {
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  });
  
  return (
    <svg 
      className="tree-connections"
      width={maxX + 50}
      height={maxY + 50}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      {connections}
    </svg>
  );
};

export default TreeConnections;