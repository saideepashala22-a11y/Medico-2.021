import { useQuery, UseQueryOptions } from '@tanstack/react-query';

// Optimized query hook with smart defaults
export function useOptimizedQuery<T>(
  queryKey: (string | number)[],
  options?: Omit<UseQueryOptions<T>, 'queryKey'>
) {
  return useQuery<T>({
    queryKey,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    ...options,
  });
}

// For frequently changing data
export function useLiveQuery<T>(
  queryKey: (string | number)[],
  options?: Omit<UseQueryOptions<T>, 'queryKey'>
) {
  return useQuery<T>({
    queryKey,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refresh every minute
    ...options,
  });
}

// For static/rarely changing data
export function useStaticQuery<T>(
  queryKey: (string | number)[],
  options?: Omit<UseQueryOptions<T>, 'queryKey'>
) {
  return useQuery<T>({
    queryKey,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    ...options,
  });
}