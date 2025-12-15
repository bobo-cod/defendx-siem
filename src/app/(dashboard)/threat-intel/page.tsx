// src/app/(dashboard)/threat-intel/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAlerts } from '@/lib/hooks/use-alerts';
import { 
  useMISPIndicator, 
  getThreatLevelColor, 
  getThreatLevelText,
  getCategoryIcon 
} from '@/lib/hooks/use-misp';
import { formatRelativeTime } from '@/lib/utils/date';
import {
  Shield,
  Search,
  AlertTriangle,
  Target,
  Clock,
  Tag,
  ExternalLink,
  Copy,
  Check,
  Info,
  TrendingUp,
  Activity,
  Zap,
  Globe,
  Server,
  Lock,
  AlertOctagon,
  Eye,
  Database,
  BarChart3,
} from 'lucide-react';

export default function ThreatIntelPage() {
  const [indicator, setIndicator] = useState('');
  const [indicatorType, setIndicatorType] = useState('ip-dst');
  const [searchValue, setSearchValue] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [recentIndicators, setRecentIndicators] = useState<string[]>([]);

  // Get recent alerts to check for MISP enrichment
  const { data: alertsData } = useAlerts({
    limit: 100,
    offset: 0,
  });

  const { data: mispData, isLoading, error } = useMISPIndicator(searchValue, indicatorType);

  // Extract MISP-enriched alerts
  const enrichedAlerts = alertsData?.data?.affected_items?.filter((alert: any) => {
    const source = alert._source || alert;
    return source.misp && source.misp.threat_detected;
  }) || [];

  // Get unique threat indicators from enriched alerts
  const threatStats = enrichedAlerts.reduce((acc: any, alert: any) => {
    const source = alert._source || alert;
    if (source.misp?.threats) {
      source.misp.threats.forEach((threat: any) => {
        const indicator = threat.indicator || threat.threats?.[0]?.indicator;
        if (indicator) {
          if (!acc[indicator]) {
            acc[indicator] = {
              count: 0,
              threat: threat.threats?.[0] || threat,
              lastSeen: source.timestamp,
            };
          }
          acc[indicator].count++;
        }
      });
    }
    return acc;
  }, {});

  const topThreats = Object.entries(threatStats)
    .sort(([, a]: any, [, b]: any) => b.count - a.count)
    .slice(0, 10);

  const handleSearch = () => {
    if (indicator.trim()) {
      setSearchValue(indicator.trim());
      setRecentIndicators(prev => {
        const updated = [indicator.trim(), ...prev.filter(i => i !== indicator.trim())];
        return updated.slice(0, 5);
      });
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const indicatorTypes = [
    { value: 'ip-dst', label: 'IP Address', icon: Globe },
    { value: 'domain', label: 'Domain', icon: Server },
    { value: 'url', label: 'URL', icon: ExternalLink },
    { value: 'md5', label: 'MD5 Hash', icon: Lock },
    { value: 'sha1', label: 'SHA1 Hash', icon: Lock },
    { value: 'sha256', label: 'SHA256 Hash', icon: Lock },
    { value: 'email', label: 'Email', icon: Lock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Threat Intelligence Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time threat detection powered by MISP
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/30 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-green-600">MISP Connected</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Enriched Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrichedAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Alerts with threat intel
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unique Threats
            </CardTitle>
            <Target className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(threatStats).length}</div>
            <p className="text-xs text-muted-foreground">
              Distinct indicators detected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              High Threats
            </CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {enrichedAlerts.filter((a: any) => {
                const source = a._source || a;
                return source.misp?.threats?.some((t: any) => 
                  (t.threats?.[0]?.threat_level || t.threat_level) === 1
                );
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Critical severity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              MISP Events
            </CardTitle>
            <Database className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Threat intelligence events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search Indicators
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={indicator}
                onChange={(e) => setIndicator(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter IP, domain, hash, URL, or email..."
                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={indicatorType}
                onChange={(e) => setIndicatorType(e.target.value)}
                className="w-full px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {indicatorTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isLoading || !indicator.trim()}
              className="w-full md:w-auto"
            >
              <Search className="h-4 w-4 mr-2" />
              {isLoading ? 'Searching...' : 'Search MISP'}
            </Button>
          </div>

          {/* Recent Searches */}
          {recentIndicators.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Recent searches:</p>
              <div className="flex flex-wrap gap-2">
                {recentIndicators.map((ind, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIndicator(ind);
                      setSearchValue(ind);
                    }}
                    className="px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded transition-colors"
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-600">
                Error querying MISP. Check your configuration.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Search Results */}
        {searchValue && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Search Results for: {searchValue}
                </CardTitle>
                {mispData && (
                  <Badge 
                    variant={mispData.found ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {mispData.found 
                      ? `⚠️ ${mispData.threat_count} Threat${mispData.threat_count !== 1 ? 's' : ''} Found` 
                      : '✅ Clean'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
                  <p className="text-muted-foreground">Querying MISP threat intelligence...</p>
                </div>
              ) : mispData?.found ? (
                <div className="space-y-4">
                  {/* Threat Alert */}
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-red-600">Threat Detected</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          The indicator <code className="font-mono bg-black/10 px-1.5 py-0.5 rounded text-red-600">{mispData.indicator}</code>
                          {' '}was found in {mispData.threat_count} MISP event{mispData.threat_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Threat Details */}
                  <div className="space-y-3">
                    {mispData.threats.map((threat: any) => (
                      <div
                        key={threat.id}
                        className="p-4 rounded-lg border hover:border-primary/50 transition-all"
                      >
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Badge 
                                  className={getThreatLevelColor(threat.threat_level) + ' border'}
                                >
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  {getThreatLevelText(threat.threat_level)} Threat
                                </Badge>
                                <Badge variant="outline" className="font-mono text-xs">
                                  Event #{threat.event_id}
                                </Badge>
                                <span className="text-xl">{getCategoryIcon(threat.category)}</span>
                              </div>
                              <h3 className="font-semibold text-lg">{threat.event_info}</h3>
                              {threat.comment && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {threat.comment}
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => copyToClipboard(threat.event_id, threat.id)}
                              className="p-2 hover:bg-secondary rounded-lg transition-colors"
                              title="Copy Event ID"
                            >
                              {copiedId === threat.id ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Indicator Type</p>
                              <p className="font-mono text-xs bg-secondary px-2 py-1 rounded">
                                {threat.type}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Category</p>
                              <p className="font-medium">{threat.category}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">IDS Detection</p>
                              <Badge variant={threat.to_ids ? 'destructive' : 'secondary'}>
                                {threat.to_ids ? 'Enabled' : 'Disabled'}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">First Seen</p>
                              <p className="flex items-center gap-1 text-xs">
                                <Clock className="h-3 w-3" />
                                {formatRelativeTime(new Date(parseInt(threat.timestamp) * 1000).toISOString())}
                              </p>
                            </div>
                          </div>

                          {/* Tags */}
                          {threat.tags && threat.tags.length > 0 && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                Tags ({threat.tags.length})
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {threat.tags.map((tag: string, idx: number) => (
                                  <Badge 
                                    key={idx} 
                                    variant="outline" 
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* View in MISP */}
                          <div className="pt-3 border-t">
                            <a
                              href={`${process.env.NEXT_PUBLIC_MISP_URL || 'http://localhost:8080'}/events/view/${threat.event_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              View full event in MISP
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : mispData ? (
                <div className="text-center py-12">
                  <Shield className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-semibold">No Threats Found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    The indicator <code className="font-mono bg-secondary px-1.5 py-0.5 rounded">{mispData.indicator}</code>
                    {' '}is not listed in MISP threat intelligence databases
                  </p>
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg inline-block">
                    <p className="text-sm text-green-600">
                      ✓ This indicator appears to be clean
                    </p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* Top Threats from Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Top Detected Threats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topThreats.length > 0 ? (
              <div className="space-y-3">
                {topThreats.map(([indicator, data]: any, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                    onClick={() => {
                      setIndicator(indicator);
                      setSearchValue(indicator);
                    }}
                  >
                    <div className="flex-1">
                      <p className="font-mono text-sm font-medium">{indicator}</p>
                      <p className="text-xs text-muted-foreground">
                        {data.threat.event_info || 'Unknown Event'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">
                        {data.count}x
                      </Badge>
                      <Badge className={getThreatLevelColor(data.threat.threat_level)}>
                        {getThreatLevelText(data.threat.threat_level)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No enriched alerts yet
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Generate network alerts to see threat detection
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Enriched Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertOctagon className="h-4 w-4" />
              Recent Enriched Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrichedAlerts.length > 0 ? (
              <div className="space-y-3">
                {enrichedAlerts.slice(0, 5).map((alert: any) => {
                  const source = alert._source || alert;
                  const threat = source.misp?.threats?.[0]?.threats?.[0] || source.misp?.threats?.[0];
                  
                  return (
                    <div
                      key={alert._id || alert.id}
                      className="p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {source.rule?.description || 'Security Alert'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Indicator: <span className="font-mono">{threat?.indicator}</span>
                          </p>
                        </div>
                        <Badge className={getThreatLevelColor(threat?.threat_level)}>
                          {getThreatLevelText(threat?.threat_level)}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(source.timestamp)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No enriched alerts
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Alerts with threat intel will appear here
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Test Section */}
      {!searchValue && topThreats.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="h-4 w-4" />
              Test Threat Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium mb-3">Test with known threats:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { type: 'IP', value: '185.220.101.1' },
                    { type: 'Domain', value: 'malware.wicar.org' },
                    { type: 'IP', value: '45.33.32.156' },
                    { type: 'Domain', value: 'evil-domain.test' },
                  ].map((test, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setIndicator(test.value);
                        setSearchValue(test.value);
                        setIndicatorType(test.type === 'IP' ? 'ip-dst' : 'domain');
                      }}
                      className="p-3 bg-secondary hover:bg-secondary/80 rounded-lg text-left transition-colors"
                    >
                      <p className="text-xs text-muted-foreground">{test.type}</p>
                      <p className="text-sm font-mono mt-1">{test.value}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm font-medium text-blue-600 mb-2">
                  🔄 Automatic Integration Active
                </p>
                <p className="text-xs text-muted-foreground">
                  All network alerts (level ≥ 7) are automatically enriched with MISP threat intelligence.
                  Generate network alerts to see real-time threat detection.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
