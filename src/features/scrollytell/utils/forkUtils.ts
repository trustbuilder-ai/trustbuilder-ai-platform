import { MessageContainer, MessageTree } from '../types';
import { Message } from '../../../backend_client/types.gen';

/**
 * IMPORTANT: Message IDs are generated server-side in production.
 * This temporary ID generator is for client-side composition only.
 * Temporary IDs use negative numbers to distinguish them from server-generated positive IDs.
 */
export function generateTemporaryMessageId(existingTree: MessageTree): number {
  // Collect all existing IDs to prevent conflicts
  const existingIds = new Set(existingTree.map(m => m.id));
  
  // Start with -1 and decrement to find an unused ID
  let tempId = -1;
  while (existingIds.has(tempId)) {
    tempId--;
  }
  
  return tempId;
}

/**
 * Creates a new forked message from an existing message.
 * The new message will have:
 * - A temporary negative ID (to be replaced by server)
 * - The forked message as its parent
 * - Empty content ready for user input
 */
export function createForkedMessage(
  parentMessage: MessageContainer,
  existingTree: MessageTree,
  role: 'user' | 'assistant' | 'system' = 'user'
): MessageContainer {
  const newId = generateTemporaryMessageId(existingTree);
  
  const newMessage: Message = {
    role,
    content: '', // Empty content for new message
  };
  
  return {
    id: newId,
    parent_message_id: parentMessage.id,
    message: newMessage,
  };
}

/**
 * Finds all sibling messages (messages with the same parent).
 * Useful for understanding branch points and alternative paths.
 */
export function findSiblings(
  messageId: number,
  messageTree: MessageTree
): MessageContainer[] {
  const message = messageTree.find(m => m.id === messageId);
  if (!message) return [];
  
  return messageTree.filter(
    m => m.parent_message_id === message.parent_message_id && m.id !== messageId
  );
}

/**
 * Checks if a message ID is temporary (client-generated).
 * Temporary IDs are negative numbers.
 */
export function isTemporaryId(id: number): boolean {
  return id < 0;
}

/**
 * Gets a display string for a message ID, indicating if it's temporary.
 */
export function getMessageIdDisplay(id: number): string {
  if (isTemporaryId(id)) {
    return `${id} (draft)`;
  }
  return String(id);
}

/**
 * Counts the number of direct children a message has.
 * Useful for showing fork indicators.
 */
export function countChildren(
  messageId: number,
  messageTree: MessageTree
): number {
  return messageTree.filter(m => m.parent_message_id === messageId).length;
}

/**
 * Gets all descendant messages from a given message.
 * Returns all messages in the subtree rooted at the given message.
 */
export function getDescendants(
  messageId: number,
  messageTree: MessageTree
): MessageContainer[] {
  const descendants: MessageContainer[] = [];
  const queue = [messageId];
  
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const children = messageTree.filter(m => m.parent_message_id === currentId);
    descendants.push(...children);
    queue.push(...children.map(c => c.id));
  }
  
  return descendants;
}