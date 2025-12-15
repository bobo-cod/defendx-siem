// src/lib/hooks/use-alerts.ts (UPDATED WITH useAlert)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertsAPI, AlertsParams } from '@/lib/api/alerts';

export function useAlerts(params?: AlertsParams) {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: () => alertsAPI.getAlerts(params),
    staleTime: 30000, // 30 seconds
  });
}

export function useAlert(alertId: string) {
  return useQuery({
    queryKey: ['alert', alertId],
    queryFn: () => alertsAPI.getAlert(alertId),
    enabled: !!alertId,
  });
}

export function useAlertsSummary(params?: {
  date_from?: string;
  date_to?: string;
}) {
  return useQuery({
    queryKey: ['alerts', 'summary', params],
    queryFn: () => alertsAPI.getAlertsSummary(params),
    staleTime: 30000,
  });
}

export function useAlertsByAgent(
  agentId: string,
  params?: AlertsParams
) {
  return useQuery({
    queryKey: ['alerts', 'agent', agentId, params],
    queryFn: () => alertsAPI.getAlertsByAgent(agentId, params),
    enabled: !!agentId,
  });
}

export function useAlertsByRule(
  ruleId: string,
  params?: AlertsParams
) {
  return useQuery({
    queryKey: ['alerts', 'rule', ruleId, params],
    queryFn: () => alertsAPI.getAlertsByRule(ruleId, params),
    enabled: !!ruleId,
  });
}

export function useAlertsByLevel(level: number, params?: AlertsParams) {
  return useQuery({
    queryKey: ['alerts', 'level', level, params],
    queryFn: () => alertsAPI.getAlertsByLevel(level, params),
  });
}

export function useRecentAlerts(limit: number = 50) {
  return useQuery({
    queryKey: ['alerts', 'recent', limit],
    queryFn: () => alertsAPI.getRecentAlerts(limit),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useAlertCountBySeverity(params?: {
  date_from?: string;
  date_to?: string;
}) {
  return useQuery({
    queryKey: ['alerts', 'severity-count', params],
    queryFn: () => alertsAPI.getAlertCountBySeverity(params),
    refetchInterval: 60000, // Refresh every 60 seconds
  });
}

export function useTopAgentsByAlerts(limit: number = 10) {
  return useQuery({
    queryKey: ['alerts', 'top-agents', limit],
    queryFn: () => alertsAPI.getTopAgentsByAlerts(limit),
  });
}

export function useTopRules(limit: number = 10) {
  return useQuery({
    queryKey: ['alerts', 'top-rules', limit],
    queryFn: () => alertsAPI.getTopRules(limit),
  });
}

export function useAlertsTimeline(params: {
  date_from: string;
  date_to: string;
  interval?: '1h' | '1d' | '1w' | '1M';
}) {
  return useQuery({
    queryKey: ['alerts', 'timeline', params],
    queryFn: () => alertsAPI.getAlertsTimeline(params),
  });
}
