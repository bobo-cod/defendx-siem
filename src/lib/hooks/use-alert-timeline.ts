// src/lib/hooks/use-alert-timeline.ts
import { useQuery } from '@tanstack/react-query';

export function useAlertTimeline(hours: number = 24, interval: string = '4h') {
  return useQuery({
    queryKey: ['alert-timeline', hours, interval],
    queryFn: async () => {
      const response = await fetch(`/api/wazuh/alerts/timeline?hours=${hours}&interval=${interval}`);
      if (!response.ok) throw new Error('Failed to fetch timeline');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
