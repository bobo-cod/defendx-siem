
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agentsAPI, AgentsParams } from '@/lib/api/agents';
import { WazuhAgent } from '@/types/wazuh';

export const useAgents = (params?: AgentsParams) => {
  return useQuery({
    queryKey: ['agents', params],
    queryFn: () => agentsAPI.getAgents(params),
  });
};

export const useAgent = (agentId: string) => {
  return useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => agentsAPI.getAgent(agentId),
    enabled: !!agentId,
  });
};

export const useAgentsSummary = () => {
  return useQuery({
    queryKey: ['agents', 'summary'],
    queryFn: () => agentsAPI.getAgentsSummary(),
    refetchInterval: 30000,
  });
};

export const useAgentsByStatus = (
  status: 'active' | 'disconnected' | 'never_connected' | 'pending'
) => {
  return useQuery({
    queryKey: ['agents', 'status', status],
    queryFn: () => agentsAPI.getAgentsByStatus(status),
  });
};

export const useAgentHardware = (agentId: string) => {
  return useQuery({
    queryKey: ['agent', agentId, 'hardware'],
    queryFn: () => agentsAPI.getAgentHardware(agentId),
    enabled: !!agentId,
  });
};

export const useAgentOSInfo = (agentId: string) => {
  return useQuery({
    queryKey: ['agent', agentId, 'os'],
    queryFn: () => agentsAPI.getAgentOSInfo(agentId),
    enabled: !!agentId,
  });
};

export const useAgentPackages = (agentId: string, params?: any) => {
  return useQuery({
    queryKey: ['agent', agentId, 'packages', params],
    queryFn: () => agentsAPI.getAgentPackages(agentId, params),
    enabled: !!agentId,
  });
};

export const useAgentProcesses = (agentId: string, params?: any) => {
  return useQuery({
    queryKey: ['agent', agentId, 'processes', params],
    queryFn: () => agentsAPI.getAgentProcesses(agentId, params),
    enabled: !!agentId,
  });
};

export const useRestartAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentId: string) => agentsAPI.restartAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
};

export const useDeleteAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentId: string) => agentsAPI.deleteAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
};

export const useUpgradeAgent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (agentId: string) => agentsAPI.upgradeAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    },
  });
};

