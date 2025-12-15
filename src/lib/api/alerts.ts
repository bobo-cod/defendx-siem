// src/lib/api/alerts.ts (FIXED - getAlert uses _id directly)
import { WazuhAlert, WazuhAPIResponse } from '@/types/wazuh';

export interface AlertsParams {
  limit?: number;
  offset?: number;
  search?: string;
  sort?: string;
  q?: string;
  select?: string;
  rule_id?: string;
  agent_id?: string;
  level?: number;
  date_from?: string;
  date_to?: string;
}

async function fetchFromAPI(endpoint: string, params?: any) {
  const queryString = params
    ? '?' + new URLSearchParams(params).toString()
    : '';
  
  const response = await fetch(`/api/wazuh${endpoint}${queryString}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }
  
  return response.json();
}

export const alertsAPI = {
  async getAlerts(params?: AlertsParams) {
    return fetchFromAPI('/alerts', params);
  },

  async getAlert(alertId: string): Promise<WazuhAlert> {
    // Fetch by _id directly from indexer
    const response = await fetchFromAPI(`/alerts/${alertId}`);
    return response.data;
  },

  async getAlertsSummary(params?: {
    date_from?: string;
    date_to?: string;
  }) {
    return fetchFromAPI('/alerts/summary', params);
  },

  async getAlertsByAgent(agentId: string, params?: AlertsParams) {
    return this.getAlerts({
      ...params,
      q: `agent.id:${agentId}`,
    });
  },

  async getAlertsByRule(ruleId: string, params?: AlertsParams) {
    return this.getAlerts({
      ...params,
      q: `rule.id:${ruleId}`,
    });
  },

  async getAlertsByLevel(level: number, params?: AlertsParams) {
    return this.getAlerts({
      ...params,
      q: `rule.level:${level}`,
    });
  },

  async getCriticalAlerts(params?: AlertsParams) {
    return this.getAlerts({
      ...params,
      q: 'rule.level>=12',
    });
  },

  async getHighAlerts(params?: AlertsParams) {
    return this.getAlerts({
      ...params,
      q: 'rule.level>=9 AND rule.level<12',
    });
  },

  async getMediumAlerts(params?: AlertsParams) {
    return this.getAlerts({
      ...params,
      q: 'rule.level>=5 AND rule.level<9',
    });
  },

  async getLowAlerts(params?: AlertsParams) {
    return this.getAlerts({
      ...params,
      q: 'rule.level<5',
    });
  },

  async searchAlerts(query: string, params?: AlertsParams) {
    return this.getAlerts({
      ...params,
      q: query,
    });
  },

  async getTopAgentsByAlerts(limit: number = 10, params?: {
    date_from?: string;
    date_to?: string;
  }) {
    return fetchFromAPI('/alerts/top-agents', {
      ...params,
      limit,
    });
  },

  async getTopRules(limit: number = 10, params?: {
    date_from?: string;
    date_to?: string;
  }) {
    return fetchFromAPI('/alerts/top-rules', {
      ...params,
      limit,
    });
  },

  async getAlertsTimeline(params: {
    date_from: string;
    date_to: string;
    interval?: '1h' | '1d' | '1w' | '1M';
  }) {
    return fetchFromAPI('/alerts/timeline', {
      ...params,
      interval: params.interval || '1h',
    });
  },

  async getAlertsByMitre(mitreId: string, params?: AlertsParams) {
    return this.getAlerts({
      ...params,
      q: `rule.mitre.id:${mitreId}`,
    });
  },

  async getAlertsByCompliance(
    standard: 'pci_dss' | 'gdpr' | 'hipaa' | 'nist_800_53',
    requirement: string,
    params?: AlertsParams
  ) {
    return this.getAlerts({
      ...params,
      q: `rule.${standard}:${requirement}`,
    });
  },

  async getRecentAlerts(limit: number = 50) {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    return this.getAlerts({
      limit,
      date_from: yesterday.toISOString(),
      date_to: now.toISOString(),
      sort: '-timestamp',
    });
  },

  async getAlertCountBySeverity(params?: {
    date_from?: string;
    date_to?: string;
  }) {
    const [critical, high, medium, low] = await Promise.all([
      this.getCriticalAlerts({ limit: 0, ...params }),
      this.getHighAlerts({ limit: 0, ...params }),
      this.getMediumAlerts({ limit: 0, ...params }),
      this.getLowAlerts({ limit: 0, ...params }),
    ]);

    return {
      critical: critical.data.total_affected_items,
      high: high.data.total_affected_items,
      medium: medium.data.total_affected_items,
      low: low.data.total_affected_items,
      total:
        critical.data.total_affected_items +
        high.data.total_affected_items +
        medium.data.total_affected_items +
        low.data.total_affected_items,
    };
  },
};
