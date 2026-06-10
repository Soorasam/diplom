/** Общие опции React Query для экранов, где данные должны жить без ручного рефреша */
export const liveQueryOptions = {
  staleTime: 0,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchIntervalInBackground: true,
} as const
