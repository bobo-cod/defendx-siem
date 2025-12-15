// src/lib/hooks/use-network.ts
import { useQuery } from '@tanstack/react-query';

export function useNetworkEvents(params: {
  limit?: number;
  offset?: number;
  agent_id?: string;
  protocol?: string;
  src_ip?: string;
  dst_ip?: string;
  port?: string;
  days?: number;
}) {
  const { limit = 100, offset = 0, agent_id, protocol, src_ip, dst_ip, port, days = 7 } = params;

  const queryParams = new URLSearchParams();
  queryParams.set('limit', limit.toString());
  queryParams.set('offset', offset.toString());
  queryParams.set('days', days.toString());
  if (agent_id) queryParams.set('agent_id', agent_id);
  if (protocol) queryParams.set('protocol', protocol);
  if (src_ip) queryParams.set('src_ip', src_ip);
  if (dst_ip) queryParams.set('dst_ip', dst_ip);
  if (port) queryParams.set('port', port);

  return useQuery({
    queryKey: ['network-events', limit, offset, agent_id, protocol, src_ip, dst_ip, port, days],
    queryFn: async () => {
      const response = await fetch(`/api/wazuh/network/events?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch network events');
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useNetworkStats(days: number = 7) {
  return useQuery({
    queryKey: ['network-stats', days],
    queryFn: async () => {
      const response = await fetch(`/api/wazuh/network/stats?days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch network stats');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
