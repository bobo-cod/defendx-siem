// src/app/(dashboard)/overview/page.tsx (LAYOUT FIXED - Agents Before Alerts)
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAgents, useAgentsSummary } from '@/lib/hooks/use-agents';
import { useRecentAlerts, useAlertCountBySeverity } from '@/lib/hooks/use-alerts';
import { useAlertTimeline } from '@/lib/hooks/use-alert-timeline';
import { formatRelativeTime } from '@/lib/utils/date';
import { formatNumber } from '@/lib/utils/format';
import { getSeverityFromLevel, getSeverityBgColor } from '@/lib/utils/severity';
import {
  Shield,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Server,
  Target,
  Zap,
  Eye,
  Home,
} from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function OverviewPage() {
  const { data: agentsSummary } = useAgentsSummary();
  const { data: agentsData } = useAgents({ limit: 1000 });
  const { data: recentAlertsData } = useRecentAlerts(10);
  const { data: severityCounts } = useAlertCountBySeverity();
  const { data: timelineData } = useAlertTimeline(24, '4h');

  // Get all agents INCLUDING agent 000 (Wazuh Manager)
  const allAgents = agentsData?.data?.affected_items || [];
  
  // Separate manager (000) from regular agents
  const wazuhManager = allAgents.find((agent: any) => agent.id === '000');
  const regularAgents = allAgents.filter((agent: any) => agent.id !== '000');
  
  // Show manager first, then regular agents
  const agents = wazuhManager ? [wazuhManager, ...regularAgents] : regularAgents;
  
  const recentAlerts = recentAlertsData?.data?.affected_items || [];

  // Stats - use actual agent count
  const totalAgents = agents.length;
  const activeAgents = agents.filter((a: any) => a.status === 'active').length;
  const disconnectedAgents = agents.filter((a: any) => a.status === 'disconnected').length;
  const neverConnectedAgents = agents.filter((a: any) => a.status === 'never_connected').length;

  const totalAlerts = severityCounts?.total || 0;
  const criticalAlerts = severityCounts?.critical || 0;
  const highAlerts = severityCounts?.high || 0;
  const mediumAlerts = severityCounts?.medium || 0;
  const lowAlerts = severityCounts?.low || 0;

  // Real timeline data from API
  const alertTrendData = (timelineData?.data || []).map((point: any) => {
    const date = new Date(point.timestamp);
    const hours = date.getHours();
    const timeLabel = `${hours.toString().padStart(2, '0')}:00`;
    
    return {
      time: timeLabel,
      alerts: point.count,
      timestamp: point.timestamp,
    };
  });

  // Chart Data
  const severityChartData = [
    { name: 'Critical', value: criticalAlerts, color: '#ef4444' },
    { name: 'High', value: highAlerts, color: '#f97316' },
    { name: 'Medium', value: mediumAlerts, color: '#eab308' },
    { name: 'Low', value: lowAlerts, color: '#22c55e' },
  ].filter(item => item.value > 0);

  const agentStatusData = [
    { name: 'Active', value: activeAgents, color: '#22c55e' },
    { name: 'Disconnected', value: disconnectedAgents, color: '#ef4444' },
    { name: 'Never Connected', value: neverConnectedAgents, color: '#6b7280' },
  ].filter(item => item.value > 0);

  // Calculate security score
  const calculateSecurityScore = () => {
    if (criticalAlerts > 0) return 45;
    if (highAlerts > 10) return 60;
    if (highAlerts > 5) return 72;
    if (mediumAlerts > 50) return 78;
    if (totalAlerts < 10) return 95;
    return 85;
  };

  const securityScore = calculateSecurityScore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security Overview</h1>
        <p className="text-muted-foreground">
          Real-time monitoring and threat intelligence
        </p>
      </div>

      {/* Top Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalAlerts)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Threats</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatNumber(criticalAlerts + highAlerts)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {criticalAlerts > 0 || highAlerts > 0 ? 'Requires immediate attention' : 'No critical threats'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatNumber(activeAgents)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {totalAgents} total agents
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Target className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {securityScore}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {securityScore >= 85 ? 'Excellent security posture' : 
               securityScore >= 70 ? 'Good standing' : 
               'Needs attention'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Alert Trend Chart - REAL DATA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Alert Activity Trend (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {alertTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={alertTrendData}>
                  <defs>
                    <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#888"
                    fontSize={12}
                  />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(value) => `Time: ${value}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="alerts"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorAlerts)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-center">
                  <div className="spinner h-8 w-8 border-4 rounded-full mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Loading timeline data...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Alert Severity Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {severityChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={severityChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {severityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <div className="flex flex-col items-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                  <p className="text-sm text-muted-foreground">No alerts in the last 24 hours</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent Status Chart */}
      {agentStatusData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Agent Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={agentStatusData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
                <XAxis type="number" stroke="#888" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#888" fontSize={12} width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {agentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ========== AGENTS SECTION (MOVED UP) ========== */}
      {agents.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Monitored Agents ({agents.length})
              </CardTitle>
              <Link
                href="/agents"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Manage All
                <Eye className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {agents.slice(0, 6).map((agent: any) => {
                const isManager = agent.id === '000';
                
                return (
                  <Link
                    key={agent.id}
                    href={`/agents/${agent.id}`}
                    className={`p-4 rounded-lg border transition-all hover:shadow-md group ${
                      isManager 
                        ? 'border-primary/30 bg-primary/5' 
                        : 'border-border hover:bg-accent/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {isManager && (
                          <Home className="h-4 w-4 text-primary" />
                        )}
                        <p className="font-medium text-sm group-hover:text-primary transition-colors">
                          {agent.name}
                        </p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        agent.status === 'active'
                          ? 'bg-green-500 animate-pulse'
                          : agent.status === 'disconnected'
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                      }`} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        ID: <span className="font-mono">{agent.id}</span>
                        {isManager && <Badge variant="secondary" className="ml-2 text-[10px] px-1 py-0">Manager</Badge>}
                      </p>
                      {agent.ip && (
                        <p className="text-xs text-muted-foreground">
                          IP: <span className="font-mono">{agent.ip}</span>
                        </p>
                      )}
                      {agent.os && (
                        <p className="text-xs text-muted-foreground">
                          {agent.os.name} {agent.os.version}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ========== ALERTS SECTION (MOVED DOWN) ========== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Recent Security Alerts
            </CardTitle>
            <Link
              href="/alerts"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View All
              <Eye className="h-3 w-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentAlerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No recent alerts - All systems operational
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAlerts.map((alert: any) => {
                const severity = getSeverityFromLevel(alert._source.rule.level);
                
                return (
                  <Link
                    key={alert._id}
                    href={`/alerts/${alert._id}`}
                    className="block p-4 rounded-lg border border-border hover:bg-accent/50 transition-all hover:shadow-md group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Severity Indicator */}
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={`w-2 h-2 rounded-full ${
                            severity === 'critical' ? 'bg-red-500 animate-pulse' :
                            severity === 'high' ? 'bg-orange-500' :
                            severity === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`} />
                        </div>

                        {/* Alert Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant={severity as any}
                              className={`${getSeverityBgColor(severity)} flex-shrink-0`}
                            >
                              {severity.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Rule {alert._source.rule.id}
                            </span>
                          </div>
                          <p className="text-sm font-medium group-hover:text-primary transition-colors">
                            {alert._source.rule.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Server className="h-3 w-3" />
                              {alert._source.agent.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(alert._source.timestamp)}
                            </span>
                            {alert._source.rule.mitre && alert._source.rule.mitre.id && (
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                MITRE: {alert._source.rule.mitre.id[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Arrow Indicator */}
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg
                          className="h-5 w-5 text-primary"
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
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
