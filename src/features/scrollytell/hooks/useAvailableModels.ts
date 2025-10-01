import { useApiData } from '../../../shared/hooks/useApiData';
import { listAvailableModelsLlmModelsGet } from '../../../backend_client/sdk.gen';
import type { ModelsResponse } from '../../../backend_client/types.gen';

/**
 * Hook to fetch and manage available LLM models
 *
 * @returns Object containing models data, loading state, and error
 */
export const useAvailableModels = () => {
  const { data, loading, error } = useApiData<ModelsResponse>(
    listAvailableModelsLlmModelsGet,
    {
      requiresAuth: true,
      enabled: true,
    }
  );

  return {
    models: data?.data || [],
    loading,
    error,
  };
};
