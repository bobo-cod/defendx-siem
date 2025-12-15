// src/app/(dashboard)/agents/[id]/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  useAgent, 
  useAgentHardware, 
  useAgentPackages,
  useRestartAgent 
} from '@/lib/hooks/use-agents';
import { useAlertsByAgent } from '@/lib/hooks/use-alerts';
import { formatRelativeTime, formatDate } from '@/lib/utils/date';
import { formatBytes, getAgentStatusBadge } from '@/lib/utils/format';
import {
  ArrowLeft,
  Server,
  Activity,
  Power,
  Trash2,
  Download,
  AlertTriangle,
  Cpu,
  Package,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import DeleteAgentModal from '@/components/agents/DeleteAgentModal';

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const { data: agent, isLoading: agentLoading } = useAgent(id);
  const { data: hardware } = useAgentHardware(id);
  const { data: packages } = useAgentPackages(id, { limit: 10 });
  const { data: recentAlerts } = useAlertsByAgent(id, { limit: 5 });
  
  const restartMutation = useRestartAgent();

  if (agentLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner h-8 w-8 border-4 rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading agent details...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium">Agent not found</p>
      </div>
    );
  }

  const handleRestart = async () => {
    try {
      await restartMutation.mutateAsync(id);
      toast.success('Agent restart command sent');
    } catch (error) {
      toast.error('Failed to restart agent');
    }
  };

  const handleAgentDeleted = () => {
    toast.success('Agent deleted successfully');
    router.push('/agents');
  };

  const hwData = hardware?.data?.affected_items?.[0];
  const packagesList = packages?.data?.affected_items || [];
  const alerts = recentAlerts?.data?.affected_items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/agents"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Agents
        </Link>
        
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{agent.name}</h1>
              <Badge className={getAgentStatusBadge(agent.status)}>
                {agent.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Agent ID: <span className="font-mono">{agent.id}</span> • IP: {agent.ip || 'N/A'}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRestart}
              disabled={restartMutation.isPending || agent.status !== 'active'}
              className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Power className="h-4 w-4" />
              Restart
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors">
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Delete Agent
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{agent.status}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {agent.lastKeepAlive && `Last seen ${formatRelativeTime(agent.lastKeepAlive)}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Version</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{agent.version || 'N/A'}</div>
            <p className="text-xs text-muted-foreground mt-1">Wazuh agent version</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registered</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">{formatDate(agent.dateAdd)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatRelativeTime(agent.dateAdd)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {agent.os && (
              <div>
                <p className="text-sm font-medium mb-2">Operating System</p>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Name:</span> {agent.os.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Version:</span> {agent.os.version}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Platform:</span> {agent.os.platform}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Architecture:</span> {agent.os.arch}
                  </p>
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Network</p>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">IP Address:</span>{' '}
                  <span className="font-mono">{agent.ip || 'N/A'}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Node:</span> {agent.node_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Manager:</span> {agent.manager}
                </p>
              </div>
            </div>

            {agent.group && agent.group.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Groups</p>
                <div className="flex flex-wrap gap-2">
                  {agent.group.map((group: string) => (
                    <Badge key={group} variant="secondary">
                      {group}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hardware Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              Hardware Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hwData ? (
              <>
                {hwData.cpu && (
                  <div>
                    <p className="text-sm font-medium mb-2">CPU</p>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Name:</span> {hwData.cpu.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Cores:</span> {hwData.cpu.cores}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Speed:</span> {hwData.cpu.mhz} MHz
                      </p>
                    </div>
                  </div>
                )}

                {hwData.ram && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Memory</p>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Total:</span>{' '}
                        {formatBytes(hwData.ram.total)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Free:</span>{' '}
                        {formatBytes(hwData.ram.free)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">Usage:</span> {hwData.ram.usage}%
                      </p>
                      <div className="w-full bg-secondary rounded-full h-2 mt-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${hwData.ram.usage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Hardware information not available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert: any) => (
                <div
                  key={alert._id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{alert._source.rule.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Level {alert._source.rule.level} •{' '}
                      {formatRelativeTime(alert._source.timestamp)}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    Level {alert._source.rule.level}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Installed Packages */}
      {packagesList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Installed Packages (Latest 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {packagesList.map((pkg: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded border border-border"
                >
                  <div>
                    <p className="text-sm font-medium font-mono">{pkg.name}</p>
                    <p className="text-xs text-muted-foreground">{pkg.description}</p>
                  </div>
                  <Badge variant="secondary" className="font-mono">
                    {pkg.version}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <DeleteAgentModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        agent={{
          id: id,
          name: agent?.name || 'Unknown',
          os: agent?.os,
        }}
        onDeleted={handleAgentDeleted}
      />
    </div>
  );
}
