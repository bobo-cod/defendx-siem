// src/app/(dashboard)/agents/page.tsx (UPDATED - With Add Agent Modal)
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAgents } from '@/lib/hooks/use-agents';
import { formatRelativeTime } from '@/lib/utils/date';
import { formatNumber } from '@/lib/utils/format';
import { getAgentStatusBadge } from '@/lib/utils/format';
import {
  Server,
  Search,
  Filter,
  RefreshCw,
  Download,
  Plus,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import AddAgentModal from '@/components/agents/AddAgentModal';

type AgentStatus = 'all' | 'active' | 'disconnected' | 'never_connected' | 'pending';

export default function AgentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AgentStatus>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const { data: agentsData, isLoading, refetch } = useAgents({ limit: 1000 });
  
  const agents = agentsData?.data?.affected_items || [];
  
  // Filter agents
  const filteredAgents = agents.filter((agent: any) => {
    const matchesSearch = 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.id.includes(searchQuery) ||
      (agent.ip && agent.ip.includes(searchQuery));
    
    const matchesStatus = 
      statusFilter === 'all' || agent.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Count by status
  const statusCounts = {
    all: agents.length,
    active: agents.filter((a: any) => a.status === 'active').length,
    disconnected: agents.filter((a: any) => a.status === 'disconnected').length,
    never_connected: agents.filter((a: any) => a.status === 'never_connected').length,
    pending: agents.filter((a: any) => a.status === 'pending').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner h-8 w-8 border-4 rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading agents...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agents</h1>
            <p className="text-muted-foreground">
              Manage and monitor all connected agents
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Agent
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              statusFilter === 'all' ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setStatusFilter('all')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(statusCounts.all)}</div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              statusFilter === 'active' ? 'ring-2 ring-green-500' : ''
            }`}
            onClick={() => setStatusFilter('active')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {formatNumber(statusCounts.active)}
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              statusFilter === 'disconnected' ? 'ring-2 ring-red-500' : ''
            }`}
            onClick={() => setStatusFilter('disconnected')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disconnected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {formatNumber(statusCounts.disconnected)}
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all hover:shadow-lg ${
              statusFilter === 'never_connected' ? 'ring-2 ring-gray-500' : ''
            }`}
            onClick={() => setStatusFilter('never_connected')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Never Connected</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">
                {formatNumber(statusCounts.never_connected)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, ID, or IP address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors">
                <Filter className="h-4 w-4" />
                Filters
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Agents List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {statusFilter === 'all' ? 'All Agents' : `${statusFilter.replace('_', ' ').toUpperCase()} Agents`}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({formatNumber(filteredAgents.length)})
                </span>
              </CardTitle>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Clear search
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredAgents.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No agents found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery
                    ? 'Try adjusting your search criteria'
                    : 'Click "Add Agent" to register your first agent'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors inline-flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Your First Agent
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAgents.map((agent: any) => (
                  <Link
                    key={agent.id}
                    href={`/agents/${agent.id}`}
                    className="block p-4 rounded-lg border border-border hover:bg-accent/50 transition-all hover:shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Status Indicator */}
                        <div className="relative">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              agent.status === 'active'
                                ? 'bg-green-500'
                                : agent.status === 'disconnected'
                                ? 'bg-red-500'
                                : 'bg-gray-500'
                            }`}
                          />
                          {agent.status === 'active' && (
                            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping opacity-75" />
                          )}
                        </div>

                        {/* Agent Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{agent.name}</p>
                            <Badge className={getAgentStatusBadge(agent.status)}>
                              {agent.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            <p className="text-xs text-muted-foreground">
                              ID: <span className="font-mono">{agent.id}</span>
                            </p>
                            {agent.ip && (
                              <p className="text-xs text-muted-foreground">
                                IP: <span className="font-mono">{agent.ip}</span>
                              </p>
                            )}
                            {agent.os && (
                              <p className="text-xs text-muted-foreground">
                                OS: {agent.os.name} {agent.os.version}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Last Seen */}
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Last seen</p>
                          <p className="text-xs font-medium">
                            {agent.lastKeepAlive
                              ? formatRelativeTime(agent.lastKeepAlive)
                              : 'Never'}
                          </p>
                        </div>

                        {/* Version */}
                        {agent.version && (
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Version</p>
                            <p className="text-xs font-medium font-mono">{agent.version}</p>
                          </div>
                        )}
                      </div>

                      {/* Arrow */}
                      <div className="ml-4">
                        <svg
                          className="h-5 w-5 text-muted-foreground"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Agent Modal */}
      <AddAgentModal 
        isOpen={showAddModal} 
        onClose={() => {
          setShowAddModal(false);
          refetch(); // Refresh agents list after adding
        }} 
      />
    </>
  );
}
