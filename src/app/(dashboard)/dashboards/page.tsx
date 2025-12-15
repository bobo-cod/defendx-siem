// src/app/(dashboard)/dashboards/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAlerts } from '@/lib/hooks/use-alerts';
import { useAgents } from '@/lib/hooks/use-agents';
import { useVulnerabilities, useVulnerabilityStats } from '@/lib/hooks/use-vulnerabilities';
import { useNetworkEvents, useNetworkStats } from '@/lib/hooks/use-network';
import { useFimEvents, useFimStats } from '@/lib/hooks/use-fim';
import { useMitreCoverage } from '@/lib/hooks/use-mitre';
import { formatRelativeTime } from '@/lib/utils/date';
import { formatNumber } from '@/lib/utils/format';
import { getSeverityFromLevel, getSeverityBgColor } from '@/lib/utils/severity';
import Link from 'next/link';
import {
  Shield,
  AlertTriangle,
  Activity,
  Server,
  Bug,
  Network,
  FileText,
  Target,
  TrendingUp,
  TrendingDown,
  Clock,
  Eye,
  ArrowRight,
  Zap,
  BarChart3,
  PieChart,
  LineChart,
} from 'lucide-react';

export default function DashboardsPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedAlert, setSelectedAlert] = useState<any>(null);

  // Fetch all data with real-time refresh
  const { data: alertsData } = useAlerts({ limit: 10, offset: 0 });
  const { data: agentsData } = useAgents({ limit: 100 });
  const { data: vulnData } = useVulnerabilities({ limit: 10, days: 7 });
  const { data: vulnStats } = useVulnerabilityStats(7);
  const { data: networkData } = useNetworkEvents({ limit: 10, days: 1 });
  const { data: networkStats } = useNetworkStats(1);
  const { data: fimData } = useFimEvents({ limit: 10, days: 1 });
  const { data: fimStats } = useFimStats(1);
  const { data: mitreData } = useMitreCoverage();

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

    // Process data - Handle Elasticsearch structure with _source wrapper
  const rawAlerts = alertsData?.data?.affected_items || [];
  const alerts = rawAlerts.map((alert: any) => {
    // Elasticsearch wraps data in _source
    const source = alert._source || alert;
    return {
      ...source,
      _id: alert._id || alert.id || source.id,
      _index: alert._index,
    };
  });
  const totalAlerts = alertsData?.data?.total_affected_items || 0;
  
  const agents = agentsData?.data?.affected_items || [];
  const totalAgents = agents.length;
  const activeAgents = agents.filter((a: any) => a.status === 'active').length;
  const disconnectedAgents = agents.filter((a: any) => a.status === 'disconnected').length;

  const vulnerabilities = vulnData?.data || [];
  const totalVulns = vulnData?.total || 0;
  const criticalVulns = vulnStats?.by_severity?.find((s: any) => s.severity === 'Critical')?.count || 0;
  const highVulns = vulnStats?.by_severity?.find((s: any) => s.severity === 'High')?.count || 0;

  const networkEvents = networkData?.data || [];
  const totalNetwork = networkData?.total || 0;
  const protocols = networkStats?.by_protocol || [];

  const fimEvents = fimData?.data || [];
  const totalFim = fimData?.total || 0;
  const fimByType = fimStats?.by_event_type || [];

  const mitreTechniques = mitreData?.techniques || [];
  const mitreTactics = mitreData?.tactics || [];
  const totalMitreAlerts = mitreData?.total_alerts || 0;

  // Calculate severity distribution
  const criticalAlerts = alerts.filter((a: any) => a.rule?.level >= 12).length;
  const highAlerts = alerts.filter((a: any) => a.rule?.level >= 7 && a.rule?.level < 12).length;
  const mediumAlerts = alerts.filter((a: any) => a.rule?.level >= 4 && a.rule?.level < 7).length;
  const lowAlerts = alerts.filter((a: any) => a.rule?.level < 4).length;

  return (
    <div className="space-y-6">
      {/* Header with Real-Time Clock */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Security Dashboards
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time security monitoring and threat intelligence
          </p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 text-2xl font-mono font-bold">
            <Clock className="h-6 w-6 text-primary animate-pulse" />
            {currentTime.toLocaleTimeString()}
          </div>
          <p className="text-sm text-muted-foreground">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Key Metrics - Top Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Alerts */}
        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(totalAlerts)}</div>
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-600">Critical</span>
                <span className="font-bold">{criticalAlerts}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-orange-600">High</span>
                <span className="font-bold">{highAlerts}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-yellow-600">Medium</span>
                <span className="font-bold">{mediumAlerts}</span>
              </div>
            </div>
            <Link href="/alerts" className="text-xs text-primary hover:underline mt-3 inline-flex items-center gap-1">
              View all alerts <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Active Agents */}
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitored Agents</CardTitle>
            <Server className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {activeAgents}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {totalAgents} total agents
            </p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-600">● Active</span>
                <span className="font-bold">{activeAgents}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-600">● Disconnected</span>
                <span className="font-bold">{disconnectedAgents}</span>
              </div>
            </div>
            <Link href="/agents" className="text-xs text-primary hover:underline mt-3 inline-flex items-center gap-1">
              Manage agents <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Critical Vulnerabilities */}
        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vulnerabilities</CardTitle>
            <Bug className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">
              {formatNumber(criticalVulns + highVulns)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Critical & High severity
            </p>
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-600">Critical</span>
                <span className="font-bold">{formatNumber(criticalVulns)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-orange-600">High</span>
                <span className="font-bold">{formatNumber(highVulns)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">{formatNumber(totalVulns)}</span>
              </div>
            </div>
            <Link href="/vulnerabilities" className="text-xs text-primary hover:underline mt-3 inline-flex items-center gap-1">
              View CVEs <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>

        {/* Network Connections */}
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Traffic</CardTitle>
            <Network className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">
              {formatNumber(totalNetwork)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Connections (24h)
            </p>
            <div className="mt-3 space-y-1">
              {protocols.slice(0, 3).map((proto: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground uppercase">{proto.protocol}</span>
                  <span className="font-bold">{formatNumber(proto.count)}</span>
                </div>
              ))}
            </div>
            <Link href="/network" className="text-xs text-primary hover:underline mt-3 inline-flex items-center gap-1">
              Monitor traffic <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Security Intelligence Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* MITRE ATT&CK Coverage */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              MITRE ATT&CK Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{mitreTechniques.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Techniques Detected</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-secondary rounded-lg">
                  <div className="text-2xl font-bold">{mitreTactics.length}</div>
                  <p className="text-xs text-muted-foreground">Tactics</p>
                </div>
                <div className="text-center p-3 bg-secondary rounded-lg">
                  <div className="text-2xl font-bold">{formatNumber(totalMitreAlerts)}</div>
                  <p className="text-xs text-muted-foreground">Alerts</p>
                </div>
              </div>

              <Link href="/mitre" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm">
                <Target className="h-4 w-4" />
                View Heatmap
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* File Integrity Monitoring */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              File Integrity (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{formatNumber(totalFim)}</div>
                <p className="text-xs text-muted-foreground mt-1">File Changes</p>
              </div>

              <div className="space-y-2">
                {fimByType.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-secondary rounded">
                    <span className="text-xs capitalize flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        item.event_type === 'added' ? 'bg-green-500' :
                        item.event_type === 'modified' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      {item.event_type}
                    </span>
                    <span className="text-sm font-bold">{formatNumber(item.count)}</span>
                  </div>
                ))}
              </div>

              <Link href="/fim" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm">
                <FileText className="h-4 w-4" />
                Monitor Files
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Network Protocols */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Network Protocols (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">{formatNumber(totalNetwork)}</div>
                <p className="text-xs text-muted-foreground mt-1">Total Connections</p>
              </div>

              <div className="space-y-2">
                {protocols.slice(0, 5).map((proto: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-secondary rounded">
                    <span className="text-xs uppercase font-mono">{proto.protocol}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${(proto.count / totalNetwork) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold w-12 text-right">{formatNumber(proto.count)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/network" className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors text-sm">
                <Network className="h-4 w-4" />
                View Traffic
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - Full Width */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Alerts */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Recent Security Alerts
              </CardTitle>
              <Link href="/alerts" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">No recent alerts</p>
                  <p className="text-xs text-muted-foreground">Your systems are secure</p>
                </div>
              ) : (
                alerts.slice(0, 5).map((alert: any) => {
                  const severity = getSeverityFromLevel(alert.rule?.level || 0);
                  const ruleId = alert.rule?.id;
                  
                  return (
                    <Link
                      key={alert.id || alert._id || Math.random()}
                      href={`/alerts?rule=${alert.rule?.id || ''}`}
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant={severity as any}
                            className={getSeverityBgColor(severity)}
                          >
                            {severity.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            #{ruleId}
                          </span>
                        </div>
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {alert.rule?.description || 'Security Alert'}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Server className="h-3 w-3" />
                          <span>{alert.agent?.name}</span>
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          <span>{formatRelativeTime(alert.timestamp)}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 p-2 rounded-lg group-hover:bg-primary/10 transition-colors">
                        <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Network Activity */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Network className="h-4 w-4 text-blue-500" />
                Recent Network Connections
              </CardTitle>
              <Link href="/network" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {networkEvents.length === 0 ? (
                <div className="text-center py-8">
                  <Network className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">No recent connections</p>
                  <p className="text-xs text-muted-foreground">Network monitoring active</p>
                </div>
              ) : (
                networkEvents.slice(0, 5).map((event: any) => {
                  const data = event.data || {};
                  const srcIp = data.src_ip || data.srcip || 'N/A';
                  const dstIp = data.dst_ip || data.dstip || event.agent?.ip || 'N/A';
                  const protocol = data.protocol || 'unknown';
                  const srcPort = data.src_port || data.srcport;
                  const dstPort = data.dst_port || data.dstport;
                  
                  return (
                    <Link
                      key={event.id}
                      href="/network"
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs uppercase font-mono group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            {protocol}
                          </Badge>
                          {srcPort && dstPort && (
                            <span className="text-xs text-muted-foreground">
                              :{srcPort} → :{dstPort}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-mono truncate group-hover:text-primary transition-colors">
                          {srcIp} <ArrowRight className="h-3 w-3 inline" /> {dstIp}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Server className="h-3 w-3" />
                          <span>{event.agent?.name}</span>
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          <span>{formatRelativeTime(event.timestamp)}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 p-2 rounded-lg group-hover:bg-primary/10 transition-colors">
                        <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Vulnerabilities and File Changes */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Vulnerabilities */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bug className="h-4 w-4 text-red-500" />
                Critical Vulnerabilities (7d)
              </CardTitle>
              <Link href="/vulnerabilities" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vulnerabilities.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">No vulnerabilities detected</p>
                  <p className="text-xs text-muted-foreground">Systems are up to date</p>
                </div>
              ) : (
                vulnerabilities.slice(0, 5).map((vuln: any) => {
                  const v = vuln.vulnerability;
                  const severity = v?.severity?.toLowerCase() || 'unknown';
                  const cvssScore = v?.cvss?.cvss3?.base_score || v?.cvss?.cvss2?.base_score || 0;
                  
                  return (
                    <Link
                      key={vuln.id}
                      href="/vulnerabilities"
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="secondary"
                            className={
                              severity === 'critical' ? 'bg-red-500/10 text-red-500 border-red-500/30 group-hover:bg-red-500/20' :
                              severity === 'high' ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 group-hover:bg-orange-500/20' :
                              severity === 'medium' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30 group-hover:bg-yellow-500/20' :
                              'bg-blue-500/10 text-blue-500 border-blue-500/30 group-hover:bg-blue-500/20'
                            }
                          >
                            {severity.toUpperCase()}
                          </Badge>
                          {cvssScore > 0 && (
                            <Badge variant="outline" className="text-xs font-mono group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                              CVSS {cvssScore.toFixed(1)}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-mono font-medium group-hover:text-primary transition-colors">{v?.cve}</p>
                        {v?.package?.name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Package: {v.package.name} {v.package.version}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Server className="h-3 w-3" />
                          <span>{vuln.agent?.name}</span>
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          <span>{formatRelativeTime(vuln.timestamp)}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 p-2 rounded-lg group-hover:bg-primary/10 transition-colors">
                        <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent File Changes */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" />
                Recent File Changes (24h)
              </CardTitle>
              <Link href="/fim" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fimEvents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">No file changes detected</p>
                  <p className="text-xs text-muted-foreground">File integrity monitoring active</p>
                </div>
              ) : (
                fimEvents.slice(0, 5).map((event: any) => {
                  const eventType = event.syscheck?.event || 'modified';
                  const path = event.syscheck?.path || 'Unknown';
                  
                  return (
                    <Link
                      key={event.id}
                      href="/fim"
                      className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge 
                            variant="secondary"
                            className={
                              eventType === 'added' ? 'bg-green-500/10 text-green-500 border-green-500/30 group-hover:bg-green-500/20' :
                              eventType === 'modified' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30 group-hover:bg-yellow-500/20' :
                              'bg-red-500/10 text-red-500 border-red-500/30 group-hover:bg-red-500/20'
                            }
                          >
                            {eventType.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm font-mono truncate group-hover:text-primary transition-colors">{path}</p>
                        {event.syscheck?.size && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Size: {(event.syscheck.size / 1024).toFixed(2)} KB
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Server className="h-3 w-3" />
                          <span>{event.agent?.name}</span>
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          <span>{formatRelativeTime(event.timestamp)}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 p-2 rounded-lg group-hover:bg-primary/10 transition-colors">
                        <Eye className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
