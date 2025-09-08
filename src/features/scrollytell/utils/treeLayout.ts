import { MessageTree, MessageContainer } from '../types';

export interface TreeNode {
  id: number;
  x: number;  // Column position (pixels)
  y: number;  // Vertical position (pixels)
  width: number;
  height: number;
  children: number[];
  parent: number | null;
  column: number; // Column index
  depth: number;  // Depth in tree
}

const CARD_WIDTH = 250;
const CARD_HEIGHT = 100;
const COLUMN_SPACING = 300;
const VERTICAL_SPACING = 150;

/**
 * Transforms the MessageTree data structure into a spatial layout for visualization.
 * 
 * The MessageTree uses parent_message_id references to encode relationships - this is
 * consistent with backend storage where messages reference their predecessors. However,
 * for rendering a tree view, we need explicit spatial coordinates and a traversable
 * structure. This function bridges that gap.
 * 
 * The layout algorithm assigns vertical columns to conversation branches:
 * - The main conversation thread flows vertically down column 0
 * - When a message has multiple responses (a fork), the first child continues
 *   in the parent's column while additional children spawn new columns to the right
 * - This creates a layout where each conversation path is visually distinct and
 *   can be followed vertically, with horizontal separation only at decision points
 * 
 * @param messageTree - Array of messages with parent_message_id relationships
 * @returns Map of message IDs to TreeNode objects containing spatial positions
 */
export function calculateTreeLayout(messageTree: MessageTree): Map<number, TreeNode> {
  const layout = new Map<number, TreeNode>();
  
  if (messageTree.length === 0) return layout;
  
  // Build adjacency lists
  const childrenMap = new Map<number, number[]>();
  const roots: number[] = [];
  
  messageTree.forEach(container => {
    if (container.parent_message_id === null || container.parent_message_id === 0) {
      roots.push(container.id);
    }
    
    // Initialize children list for this node
    if (!childrenMap.has(container.id)) {
      childrenMap.set(container.id, []);
    }
    
    // Add this node as a child of its parent
    if (container.parent_message_id && container.parent_message_id !== 0) {
      const siblings = childrenMap.get(container.parent_message_id) || [];
      siblings.push(container.id);
      childrenMap.set(container.parent_message_id, siblings);
    }
  });
  
  // Track the next available column
  let nextColumn = 0;
  const columnDepths = new Map<number, number>(); // Track the current depth in each column
  
  // Recursive function to assign positions
  function assignPositions(nodeId: number, column: number, depth: number, parentId: number | null) {
    // Get or calculate the y position for this column at this depth
    let y = depth * VERTICAL_SPACING;
    
    // Calculate x position based on column
    const x = column * COLUMN_SPACING;
    
    // Create the tree node
    const node: TreeNode = {
      id: nodeId,
      x,
      y,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      children: childrenMap.get(nodeId) || [],
      parent: parentId,
      column,
      depth
    };
    
    layout.set(nodeId, node);
    
    // Update the depth for this column
    columnDepths.set(column, depth);
    
    // Process children
    const children = childrenMap.get(nodeId) || [];
    if (children.length > 0) {
      // First child continues in the same column
      assignPositions(children[0], column, depth + 1, nodeId);
      
      // Additional children get new columns to the right
      for (let i = 1; i < children.length; i++) {
        nextColumn++;
        assignPositions(children[i], nextColumn, depth + 1, nodeId);
      }
    }
  }
  
  // Process each root
  roots.forEach((rootId, index) => {
    if (index > 0) {
      nextColumn++;
    }
    assignPositions(rootId, nextColumn, 0, null);
  });
  
  return layout;
}

export function calculateBoundingBox(layout: Map<number, TreeNode>): { width: number; height: number } {
  let maxX = 0;
  let maxY = 0;
  
  layout.forEach(node => {
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  });
  
  return {
    width: maxX + COLUMN_SPACING / 2, // Add some padding
    height: maxY + VERTICAL_SPACING / 2
  };
}

export function getPathToNode(layout: Map<number, TreeNode>, leafId: number): number[] {
  const path: number[] = [];
  let currentId: number | null = leafId;
  
  while (currentId !== null) {
    path.unshift(currentId);
    const node = layout.get(currentId);
    currentId = node?.parent || null;
  }
  
  return path;
}