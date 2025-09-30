import { useState, useCallback } from 'react';
import { createChatCompletionLlmChatCompletionsPost } from '../../../backend_client/sdk.gen';
import type { ChatMessage } from '../../../backend_client/types.gen';

interface UseChatCompletionOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
}

interface StreamCompletionParams {
  messages: ChatMessage[];
  onChunk?: (content: string) => void;
}

export const useChatCompletion = (options: UseChatCompletionOptions) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [streamingContent, setStreamingContent] = useState('');

  const streamCompletion = useCallback(async (params: StreamCompletionParams) => {
    setIsStreaming(true);
    setError(null);
    setStreamingContent('');

    try {
      // Call LLM API with streaming enabled
      const response = await createChatCompletionLlmChatCompletionsPost({
        body: {
          model: options.model,
          messages: params.messages,
          stream: true,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2000,
        },
        parseAs: 'stream',
        throwOnError: false,
      });

      // Check for API errors before attempting to read stream
      if ('error' in response && response.error !== undefined) {
        const errorMessage = typeof response.error === 'string'
          ? response.error
          : (response.error as any)?.message || 'LLM API request failed';
        throw new Error(errorMessage);
      }

      // Check HTTP status
      if (response.response?.status && response.response.status >= 400) {
        throw new Error(`HTTP ${response.response.status}: ${response.response.statusText || 'Request failed'}`);
      }

      if (!response.response?.body) {
        throw new Error('No response body received from LLM API');
      }

      // Parse SSE stream
      const reader = response.response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();

            if (data === '[DONE]') {
              break;
            }

            try {
              const chunk = JSON.parse(data);

              // Check for error in chunk
              if (chunk.error) {
                const errorMsg = typeof chunk.error === 'string'
                  ? chunk.error
                  : chunk.error.message || 'LLM streaming error';
                throw new Error(errorMsg);
              }

              const delta = chunk.choices?.[0]?.delta?.content;

              if (delta) {
                accumulatedContent += delta;
                setStreamingContent(accumulatedContent);

                // Call onChunk callback if provided
                if (params.onChunk) {
                  params.onChunk(accumulatedContent);
                }
              }
            } catch (parseError) {
              // Re-throw errors (including chunk.error)
              if (parseError instanceof Error) {
                throw parseError;
              }
              // For JSON parse errors, log and continue (might be malformed chunk)
              console.error('Failed to parse SSE chunk:', parseError);
            }
          }
        }
      }

      // Check if we got any content
      if (!accumulatedContent) {
        throw new Error('LLM streaming completed but no content was received. This may indicate a backend configuration error (e.g., missing API keys).');
      }

      return { content: accumulatedContent };

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      throw error;
    } finally {
      setIsStreaming(false);
    }
  }, [options.model, options.temperature, options.maxTokens]);

  const reset = useCallback(() => {
    setIsStreaming(false);
    setError(null);
    setStreamingContent('');
  }, []);

  return {
    streamCompletion,
    isStreaming,
    streamingContent,
    error,
    reset,
  };
};