import { useState, useEffect } from 'react';
import {
  listEvaluationsByContextEvaluationsContextChatContextIdGet,
  evaluateChatContextEvaluationsChatContextsChatContextIdEvaluatePost,
} from '../../../backend_client/sdk.gen';
import { EvalResult } from '../../../backend_client/types.gen';

export const useEvaluation = (contextId?: number) => {
  const [evalResults, setEvalResults] = useState<Record<number, EvalResult>>({});
  const [evaluatingNodes, setEvaluatingNodes] = useState<Set<number>>(new Set());

  // Pre-load evaluations when context loads
  useEffect(() => {
    const loadEvaluations = async () => {
      if (!contextId) return;

      try {
        const response = await listEvaluationsByContextEvaluationsContextChatContextIdGet({
          path: { chat_context_id: contextId },
          throwOnError: false,
        });

        if (response.data) {
          const resultsMap: Record<number, EvalResult> = {};
          response.data.forEach((result) => {
            if (
              result.context_message_leaf_id !== null &&
              result.context_message_leaf_id !== undefined
            ) {
              resultsMap[result.context_message_leaf_id] = result;
            }
          });
          setEvalResults(resultsMap);
        }
      } catch (err) {
        console.error('Failed to load evaluations:', err);
      }
    };

    loadEvaluations();
  }, [contextId]);

  // Evaluate single message
  const evaluateMessage = async (messageId: number) => {
    if (!contextId) return;

    // If we already have a result, don't re-evaluate
    if (evalResults[messageId]) {
      return;
    }

    setEvaluatingNodes((prev) => new Set(prev).add(messageId));

    try {
      const response = await evaluateChatContextEvaluationsChatContextsChatContextIdEvaluatePost({
        path: { chat_context_id: contextId },
        body: { leaf_id: messageId },
        throwOnError: true,
      });

      if (response.data) {
        setEvalResults((prev) => ({
          ...prev,
          [messageId]: response.data as EvalResult,
        }));
      }
    } catch (err) {
      console.error('Evaluation failed:', err);
    } finally {
      setEvaluatingNodes((prev) => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
    }
  };

  return {
    evalResults,
    evaluatingNodes,
    evaluateMessage,
  };
};
