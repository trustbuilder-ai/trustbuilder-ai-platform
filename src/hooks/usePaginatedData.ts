import { useState, useMemo } from "react";
import { useApiData } from "./useApiData";

interface PaginationParams {
  page_index?: number;
  count?: number;
}

// Import the SDK response type from useApiData
type SdkResponse<TData, TError> = 
  (| { data: TData; error: undefined }
   | { data: undefined; error: TError }) 
  & { request: Request; response: Response };

/**
 * Hook for handling paginated API data.
 * Built on top of useApiData with automatic page management.
 */
export function usePaginatedData<
  TData,
  TError = any,
  TFetcher extends (
    params?: any,
  ) => Promise<SdkResponse<TData, TError>> = any,
>(
  fetcher: TFetcher,
  options: Parameters<typeof useApiData<TData, TError, TFetcher>>[1] & {
    pageSize?: number;
  } = {},
) {
  const { pageSize = 10, ...apiOptions } = options;
  const [currentPage, setCurrentPage] = useState(0);

  // Merge pagination params with any existing params
  const params = useMemo(() => {
    const baseParams = apiOptions.initialParams || {};
    return {
      ...baseParams,
      query: {
        ...(baseParams as any)?.query,
        page_index: currentPage,
        count: pageSize,
      },
    };
  }, [currentPage, pageSize, apiOptions.initialParams]);

  const result = useApiData(fetcher, {
    ...apiOptions,
    initialParams: params as any,
  });

  // Navigation methods
  const nextPage = () => setCurrentPage((p) => p + 1);
  const prevPage = () => setCurrentPage((p) => Math.max(0, p - 1));
  const goToPage = (page: number) => setCurrentPage(Math.max(0, page));

  // Check if there's a next page (assumes full page means more data exists)
  const hasNextPage =
    Array.isArray(result.data) && result.data.length === pageSize;
  const hasPrevPage = currentPage > 0;

  return {
    ...result,
    currentPage,
    pageSize,
    nextPage,
    prevPage,
    goToPage,
    hasNextPage,
    hasPrevPage,
  };
}
