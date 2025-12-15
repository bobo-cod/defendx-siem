// src/lib/hooks/use-misp.ts
// React hooks for MISP threat intelligence

import { useQuery } from '@tanstack/react-query';

export interface MISPThreat {
  id: string;
  indicator: string;
  type: string;
  category: string;
  event_id: string;
  event_info: string;
  threat_level: string;
  analysis: string;
  timestamp: string;
  tags: string[];
  comment: string;
  to_ids: boolean;
}

export interface MISPQueryResult {
  found: boolean;
  indicator: string;
  type: string;
  threat_count: number;
  threats: MISPThreat[];
  error?: string;
}

export interface BatchIndicator {
  value: string;
  type: string;
}

export interface BatchResult {
  indicator: string;
  type: string;
  found: boolean;
  threat_count?: number;
  threats?: any[];
  error?: string;
}

// Query single indicator
export function useMISPIndicator(indicator: string | null, type: string = 'ip-dst') {
  return useQuery<MISPQueryResult>({
    queryKey: ['misp', 'indicator', indicator, type],
    queryFn: async () => {
      if (!indicator) {
        throw new Error('No indicator provided');
      }

      const response = await fetch(
        `/api/misp/indicators?indicator=${encodeURIComponent(indicator)}&type=${type}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch MISP data');
      }

      return response.json();
    },
    enabled: !!indicator,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

// Query multiple indicators
export function useMISPBatch(indicators: BatchIndicator[]) {
  return useQuery<{
    results: BatchResult[];
    total: number;
    threats_found: number;
  }>({
    queryKey: ['misp', 'batch', JSON.stringify(indicators)],
    queryFn: async () => {
      const response = await fetch('/api/misp/indicators', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ indicators }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch MISP data');
      }

      return response.json();
    },
    enabled: indicators.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

// Helper: Get threat level color
export function getThreatLevelColor(level: string | number): string {
  const levelNum = typeof level === 'string' ? parseInt(level) : level;
  
  switch (levelNum) {
    case 1:
      return 'bg-red-500/10 text-red-600 border-red-500/30'; // High
    case 2:
      return 'bg-orange-500/10 text-orange-600 border-orange-500/30'; // Medium
    case 3:
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30'; // Low
    case 4:
      return 'bg-blue-500/10 text-blue-600 border-blue-500/30'; // Undefined
    default:
      return 'bg-gray-500/10 text-gray-600 border-gray-500/30';
  }
}

// Helper: Get threat level text
export function getThreatLevelText(level: string | number): string {
  const levelNum = typeof level === 'string' ? parseInt(level) : level;
  
  switch (levelNum) {
    case 1:
      return 'High';
    case 2:
      return 'Medium';
    case 3:
      return 'Low';
    case 4:
      return 'Undefined';
    default:
      return 'Unknown';
  }
}

// Helper: Get category icon
export function getCategoryIcon(category: string): string {
  const categoryLower = category.toLowerCase();
  
  if (categoryLower.includes('network')) return '🌐';
  if (categoryLower.includes('payload')) return '💣';
  if (categoryLower.includes('malware')) return '🦠';
  if (categoryLower.includes('social')) return '👥';
  if (categoryLower.includes('attribution')) return '🎯';
  
  return '⚠️';
}
