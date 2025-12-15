// src/lib/hooks/use-mitre.ts
import { useQuery } from '@tanstack/react-query';

export function useMitreCoverage(days: number = 30) {
  return useQuery({
    queryKey: ['mitre-coverage', days],
    queryFn: async () => {
      const response = await fetch(`/api/wazuh/mitre/coverage?days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch MITRE coverage');
      return response.json();
    },
    refetchInterval: 300000, // Refresh every 5 minutes
  });
}
