import { useEffect, useRef } from 'react';
import { useScrollyTell } from '../context/ScrollyTellContext';
import { useAuth } from '../../../shared/hooks/useAuth';
import { useApiData } from '../../../shared/hooks/useApiData';
import { ensureChatContextChatContextsEnsurePost } from '../../../backend_client/sdk.gen';
import type { EnsureChatContextResponse, MessageContainer } from '../../../backend_client/types.gen';

/**
 * Centralized hook for managing user chat context.
 * Fetches or creates the user's context and synchronizes it with ScrollyTellContext.
 * Both TreeView and ChatView should use this hook to share the same message tree.
 */
export function useUserContext() {
  const { session } = useAuth();
  const {
    scrollyTellData,
    userMessageTree,
    setUserMessageTree,
    contextId,
    setContextId
  } = useScrollyTell();

  // Track if we've done the initial sync from server
  const hasInitializedRef = useRef(false);

  // Fetch or create user context using the shared hook pattern
  const apiData = useApiData<EnsureChatContextResponse>(
    ensureChatContextChatContextsEnsurePost,
    {
      requiresAuth: true,
      enabled: !!scrollyTellData.chat_template_id,
      initialParams: scrollyTellData.chat_template_id ? {
        body: { chat_template_id: scrollyTellData.chat_template_id }
      } : undefined
    }
  );

  const { data: contextData, loading, error, refetch } = apiData;

  // Sync fetched data with shared context state
  // IMPORTANT: Always sync on initial page load, then only sync when contextId changes
  // Don't sync on every tree update - that would overwrite local changes from ChatView
  useEffect(() => {
    if (contextData?.chat_context) {
      const newContextId = contextData.chat_context.id;
      const newMessageTree = (contextData.chat_context.message_tree as MessageContainer[]) || [];

      // Sync if: (1) initial page load OR (2) context ID changed (reset, template switch)
      const shouldSync = !hasInitializedRef.current || contextId !== newContextId;

      if (shouldSync) {
        console.log('[useUserContext] Syncing context:', {
          previousContextId: contextId,
          newContextId,
          isInitialLoad: !hasInitializedRef.current,
          messageCount: newMessageTree.length
        });
        setContextId(newContextId);
        setUserMessageTree(newMessageTree);
        hasInitializedRef.current = true;
      }
    }
  }, [contextData, contextId, setContextId, setUserMessageTree]);

  return {
    contextData,
    loading,
    error,
    refetch,
    // Also expose the shared state directly for convenience
    userMessageTree,
    setUserMessageTree,
    contextId,
    setContextId
  };
}
