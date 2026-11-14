import { QueryClient } from '@tanstack/react-query';
import { isApiError } from './errors';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      retry: (n, e) => !(isApiError(e) && e.status >= 400 && e.status < 500) && n < 1,
    },
    mutations: { retry: false },
  },
});
