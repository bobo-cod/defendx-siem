// src/app/(dashboard)/vulnerabilities/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useVulnerabilities, useVulnerabilityStats } from '@/lib/hooks/use-vulnerabilities';
import { useAgents } from '@/lib/hooks/use-agents';
import { formatRelativeTime } from '@/lib/utils/date';
import { formatNumber } from '@/lib/utils/format';
import VulnerabilityDetailsModal from '@/components/vulnerabilities/VulnerabilityDetailsModal';
import {
  Shield,
  Bug,
  AlertTriangle,
  Server,
  Clock,
  Package,
  Activity,
  TrendingUp,
  Eye,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
} from 'lucide-react';

export default function VulnerabilitiesPage() {
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [expandedVuln, setExpandedVuln] = useState<string | null>(null);
  const [selectedVuln, setSelectedVuln] = useState<any>(null);

  const { data: vulnData, isLoading } = useVulnerabilities({
    limit: 100,
    agent_id: selectedAgent || undefined,
    severity: selectedSeverity || undefined,
    days: selectedPeriod,
  });

  const { data: statsData } = useVulnerabilityStats(selectedPeriod);
  const { data: agentsData } = useAgents({ limit: 100 });

  const vulnerabilities = vulnData?.data || [];
  const total = vulnData?.total || 0;

  const agents = agentsData?.data?.affected_items || [];
  const severityCounts = statsData?.by_severity || [];
  const topPackages = statsData?.top_packages || [];
  const cvssAverage = statsData?.cvss_average || 0;
  const cvssMax = statsData?.cvss_max || 0;

  const criticalCount = severityCounts.find((s: any) => s.severity === 'Critical')?.count || 0;
  const highCount = severityCounts.find((s: any) => s.severity === 'High')?.count || 0;
  const mediumCount = severityCounts.find((s: any) => s.severity === 'Medium')?.count || 0;
  const lowCount = severityCounts.find((s: any) => s.severity === 'Low')?.count || 0;

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'high':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      case 'low':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
    }
  };

  const getCVSSColor = (score: number) => {
    if (score >= 9.0) return 'text-red-500';
    if (score >= 7.0) return 'text-orange-500';
    if (score >= 4.0) return 'text-yellow-500';
    return 'text-blue-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner h-8 w-8 border-4 rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading vulnerabilities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bug className="h-8 w-8" />
          Vulnerability Management
        </h1>
        <p className="text-muted-foreground mt-1">
          CVE tracking, CVSS scores, and patch recommendations
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vulnerabilities</CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(total)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last {selectedPeriod} days
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical & High</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatNumber(criticalCount + highCount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg CVSS Score</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getCVSSColor(cvssAverage)}`}>
              {cvssAverage.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Max: {cvssMax.toFixed(1)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affected Packages</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatNumber(topPackages.length)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique packages
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Agent Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Filter by Agent</label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Agents</option>
                {agents.map((agent: any) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Severity</label>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Period Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Time Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
                <option value={365}>Last Year</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Severity Distribution */}
      {severityCounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Vulnerability Distribution by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { severity: 'Critical', count: criticalCount, color: 'bg-red-500' },
                { severity: 'High', count: highCount, color: 'bg-orange-500' },
                { severity: 'Medium', count: mediumCount, color: 'bg-yellow-500' },
                { severity: 'Low', count: lowCount, color: 'bg-blue-500' },
              ].map((item) => (
                <div key={item.severity} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.severity}</span>
                    <Badge variant="secondary">{formatNumber(item.count)}</Badge>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Vulnerable Packages */}
      {topPackages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Package className="h-4 w-4" />
              Most Vulnerable Packages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topPackages.slice(0, 10).map((pkg: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-mono truncate">{pkg.package}</span>
                  </div>
                  <Badge variant="secondary">{formatNumber(pkg.count)} CVEs</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vulnerabilities List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Detected Vulnerabilities
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({vulnerabilities.length} of {total})
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {vulnerabilities.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">No vulnerabilities found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedAgent || selectedSeverity
                  ? 'Try adjusting your filters'
                  : 'Your systems are secure!'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {vulnerabilities.map((vuln: any) => {
                const isExpanded = expandedVuln === vuln.id;
                const v = vuln.vulnerability;
                const severity = v?.severity?.toLowerCase() || 'unknown';
                const cvssScore = v?.cvss?.cvss3?.base_score || v?.cvss?.cvss2?.base_score || 0;

                return (
                  <div
                    key={vuln.id}
                    className={`rounded-lg border p-4 transition-all ${getSeverityColor(severity)}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* CVE Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          <Bug className="h-5 w-5" />
                        </div>

                        {/* Vulnerability Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${getSeverityColor(severity)} border`}>
                              {severity.toUpperCase()}
                            </Badge>
                            {cvssScore > 0 && (
                              <Badge variant="secondary" className="font-mono">
                                CVSS: {cvssScore.toFixed(1)}
                              </Badge>
                            )}
                          </div>

                          <p className="font-mono text-sm font-bold mb-1">
                            {v?.cve}
                          </p>

                          {v?.title && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {v.title}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Server className="h-3 w-3" />
                              {vuln.agent.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(vuln.timestamp)}
                            </span>
                            {v?.package?.name && (
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {v.package.name} {v.package.version}
                              </span>
                            )}
                          </div>

                          {/* Expanded Quick View */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t space-y-3">
                              {v?.rationale && (
                                <div>
                                  <p className="text-xs font-medium mb-1">Description:</p>
                                  <p className="text-xs text-muted-foreground line-clamp-3">
                                    {v.rationale}
                                  </p>
                                </div>
                              )}

                              {/* External Links */}
                              <div className="flex flex-wrap gap-2">
                                <a
                                  href={`https://nvd.nist.gov/vuln/detail/${v?.cve}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded transition-colors"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  NVD
                                </a>
                                <a
                                  href={`https://cve.mitre.org/cgi-bin/cvename.cgi?name=${v?.cve}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded transition-colors"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  CVE.org
                                </a>
                              </div>

                              {/* View Full Details Button */}
                              <button
                                onClick={() => setSelectedVuln(vuln)}
                                className="w-full mt-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors flex items-center justify-center gap-2"
                              >
                                <Eye className="h-4 w-4" />
                                View Full Details
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expand Button */}
                      <button
                        onClick={() => setExpandedVuln(isExpanded ? null : vuln.id)}
                        className="flex-shrink-0 p-2 hover:bg-secondary rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <VulnerabilityDetailsModal
        isOpen={!!selectedVuln}
        onClose={() => setSelectedVuln(null)}
        vulnerability={selectedVuln}
      />
    </div>
  );
}
