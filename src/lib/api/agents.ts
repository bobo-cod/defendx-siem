// src/lib/api/agents.ts (UPDATED - REPLACE EXISTING)
import { WazuhAgent, WazuhAPIResponse, SyscollectorData } from '@/types/wazuh';

export interface AgentsParams {
  limit?: number;
  offset?: number;
  search?: string;
  status?: 'active' | 'disconnected' | 'never_connected' | 'pending';
  sort?: string;
  select?: string;
  q?: string;
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

export const agentsAPI = {
  async getAgents(params?: AgentsParams): Promise<WazuhAPIResponse<WazuhAgent>> {
    return fetchFromAPI('/agents', params);
  },

  async getAgent(agentId: string): Promise<WazuhAgent> {
    const response = await fetchFromAPI('/agents', {
      agents_list: agentId,
    });
    return response.data.affected_items[0];
  },

  async getAgentsSummary() {
    return fetchFromAPI('/agents/summary');
  },

  async getAgentsByStatus(
    status: 'active' | 'disconnected' | 'never_connected' | 'pending'
  ) {
    return this.getAgents({ status, limit: 500 });
  },

  async searchAgents(query: string) {
    return this.getAgents({ search: query, limit: 100 });
  },

  async getAgentsOS() {
    return fetchFromAPI('/agents/os');
  },

  async restartAgent(agentId: string) {
    const response = await fetch(`/api/wazuh/agents/${agentId}/restart`, {
      method: 'PUT',
    });
    return response.json();
  },

  async deleteAgent(agentId: string) {
    const response = await fetch(`/api/wazuh/agents/${agentId}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  async getAgentConfig(agentId: string, component?: string) {
    return fetchFromAPI(`/agents/${agentId}/config/${component || ''}`);
  },

  async getAgentGroups(agentId: string) {
    return fetchFromAPI(`/agents/${agentId}/group`);
  },

  async addAgentToGroup(agentId: string, groupId: string) {
    const response = await fetch(`/api/wazuh/agents/${agentId}/group/${groupId}`, {
      method: 'PUT',
    });
    return response.json();
  },

  async removeAgentFromGroup(agentId: string, groupId: string) {
    const response = await fetch(`/api/wazuh/agents/${agentId}/group/${groupId}`, {
      method: 'DELETE',
    });
    return response.json();
  },

  async getAgentKey(agentId: string) {
    return fetchFromAPI(`/agents/${agentId}/key`);
  },

  async upgradeAgent(agentId: string) {
    const response = await fetch(`/api/wazuh/agents/${agentId}/upgrade`, {
      method: 'PUT',
    });
    return response.json();
  },

  async getOutdatedAgents() {
    return fetchFromAPI('/agents/outdated');
  },

  async getAgentHardware(agentId: string) {
    return fetchFromAPI(`/agents/${agentId}/hardware`);
  },

  async getAgentOSInfo(agentId: string) {
    return fetchFromAPI(`/agents/${agentId}/os`);
  },

  async getAgentNetworkInterfaces(agentId: string) {
    return fetchFromAPI(`/agents/${agentId}/network`);
  },

  async getAgentPackages(agentId: string, params?: any) {
    return fetchFromAPI(`/agents/${agentId}/packages`, params);
  },

  async getAgentProcesses(agentId: string, params?: any) {
    return fetchFromAPI(`/agents/${agentId}/processes`, params);
  },

  async getAgentPorts(agentId: string) {
    return fetchFromAPI(`/agents/${agentId}/ports`);
  },

  async getAgentStats(agentId: string) {
    return fetchFromAPI(`/agents/${agentId}/stats`);
  },

  async getDistinctValues(field: string) {
    return fetchFromAPI(`/agents/stats/${field}`);
  },
};
