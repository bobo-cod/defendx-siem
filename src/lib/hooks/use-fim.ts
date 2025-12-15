// src/lib/hooks/use-fim.ts
import { useQuery } from '@tanstack/react-query';

export function useFimEvents(params: {
  limit?: number;
  offset?: number;
  agent_id?: string;
  event_type?: string;
  days?: number;
}) {
  const { limit = 50, offset = 0, agent_id, event_type, days = 7 } = params;

  const queryParams = new URLSearchParams();
  queryParams.set('limit', limit.toString());
  queryParams.set('offset', offset.toString());
  queryParams.set('days', days.toString());
  if (agent_id) queryParams.set('agent_id', agent_id);
  if (event_type) queryParams.set('event_type', event_type);

  return useQuery({
    queryKey: ['fim-events', limit, offset, agent_id, event_type, days],
    queryFn: async () => {
      const response = await fetch(`/api/wazuh/fim/events?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch FIM events');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useFimStats(days: number = 7) {
  return useQuery({
    queryKey: ['fim-stats', days],
    queryFn: async () => {
      const response = await fetch(`/api/wazuh/fim/stats?days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch FIM stats');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
