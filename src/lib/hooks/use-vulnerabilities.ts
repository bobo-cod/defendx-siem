// src/lib/hooks/use-vulnerabilities.ts
import { useQuery } from '@tanstack/react-query';

export function useVulnerabilities(params: {
  limit?: number;
  offset?: number;
  agent_id?: string;
  severity?: string;
  cvss_score?: string;
  days?: number;
}) {
  const { limit = 100, offset = 0, agent_id, severity, cvss_score, days = 30 } = params;

  const queryParams = new URLSearchParams();
  queryParams.set('limit', limit.toString());
  queryParams.set('offset', offset.toString());
  queryParams.set('days', days.toString());
  if (agent_id) queryParams.set('agent_id', agent_id);
  if (severity) queryParams.set('severity', severity);
  if (cvss_score) queryParams.set('cvss_score', cvss_score);

  return useQuery({
    queryKey: ['vulnerabilities', limit, offset, agent_id, severity, cvss_score, days],
    queryFn: async () => {
      const response = await fetch(`/api/wazuh/vulnerabilities?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch vulnerabilities');
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useVulnerabilityStats(days: number = 30) {
  return useQuery({
    queryKey: ['vulnerability-stats', days],
    queryFn: async () => {
      const response = await fetch(`/api/wazuh/vulnerabilities/stats?days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch vulnerability stats');
      return response.json();
    },
    refetchInterval: 120000, // Refresh every 2 minutes
  });
}
