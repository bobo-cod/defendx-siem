// src/app/(dashboard)/mitre/page.tsx (UPDATED - With View Details)
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMitreCoverage } from '@/lib/hooks/use-mitre';
import { formatNumber } from '@/lib/utils/format';
import MitreTechniqueDetailsModal from '@/components/mitre/MitreTechniqueDetailsModal';
import {
  Shield,
  Target,
  TrendingUp,
  Eye,
  ExternalLink,
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Activity,
  Info,
  RefreshCw,
} from 'lucide-react';

// MITRE ATT&CK Tactics in order
const MITRE_TACTICS = [
  { id: 'reconnaissance', name: 'Reconnaissance', color: '#8b5cf6' },
  { id: 'resource-development', name: 'Resource Development', color: '#7c3aed' },
  { id: 'initial-access', name: 'Initial Access', color: '#6366f1' },
  { id: 'execution', name: 'Execution', color: '#3b82f6' },
  { id: 'persistence', name: 'Persistence', color: '#0ea5e9' },
  { id: 'privilege-escalation', name: 'Privilege Escalation', color: '#06b6d4' },
  { id: 'defense-evasion', name: 'Defense Evasion', color: '#14b8a6' },
  { id: 'credential-access', name: 'Credential Access', color: '#10b981' },
  { id: 'discovery', name: 'Discovery', color: '#22c55e' },
  { id: 'lateral-movement', name: 'Lateral Movement', color: '#84cc16' },
  { id: 'collection', name: 'Collection', color: '#eab308' },
  { id: 'command-and-control', name: 'Command and Control', color: '#f59e0b' },
  { id: 'exfiltration', name: 'Exfiltration', color: '#f97316' },
  { id: 'impact', name: 'Impact', color: '#ef4444' },
];

export default function MitrePage() {
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const [selectedTactic, setSelectedTactic] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTechnique, setSelectedTechnique] = useState<any>(null);

  const { data: mitreData, isLoading, refetch } = useMitreCoverage(selectedPeriod);

  const techniques = mitreData?.techniques || [];
  const tactics = mitreData?.tactics || [];
  const totalAlerts = mitreData?.total_alerts || 0;

  // Filter techniques by selected tactic
  const filteredTechniques = techniques.filter((tech: any) => {
    const matchesTactic = !selectedTactic || tech.tactics.some((t: string) => 
      t.toLowerCase().includes(selectedTactic.toLowerCase())
    );
    const matchesSearch = !searchQuery || 
      tech.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesTactic && matchesSearch;
  });

  // Get heat color based on count
  const getHeatColor = (count: number) => {
    if (count === 0) return 'bg-gray-800 text-gray-400 border-gray-700';
    if (count < 5) return 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30';
    if (count < 20) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30';
    if (count < 50) return 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30';
  };

  const getCoveragePercentage = () => {
    const totalPossibleTechniques = 200;
    return Math.min(100, (techniques.length / totalPossibleTechniques) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner h-8 w-8 border-4 rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading MITRE ATT&CK coverage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Target className="h-8 w-8" />
          MITRE ATT&CK Coverage
        </h1>
        <p className="text-muted-foreground mt-1">
          Threat detection coverage across the MITRE ATT&CK framework
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Techniques Detected</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(techniques.length)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique MITRE techniques
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {getCoveragePercentage().toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Of MITRE matrix
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tactics Covered</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatNumber(tactics.length)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of 14 total tactics
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {formatNumber(totalAlerts)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              With MITRE mapping
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Debug Card */}
      {totalAlerts === 0 && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-500 text-base">
              <Info className="h-5 w-5" />
              No MITRE-Mapped Alerts Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              No alerts with MITRE ATT&CK mappings were found in the selected time period.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedPeriod(90)}
                className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded transition-colors"
              >
                Try 90 Days
              </button>
              <button
                onClick={() => refetch()}
                className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded transition-colors flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Eye className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search techniques..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                className="px-4 py-2 pr-10 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
                <option value={365}>Last Year</option>
              </select>
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>

            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Tactics Filter Pills */}
      {tactics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Filter by Tactic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTactic(null)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  selectedTactic === null
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                }`}
              >
                All Tactics
              </button>
              {MITRE_TACTICS.map((tactic) => {
                const tacticData = tactics.find((t: any) => 
                  t.name.toLowerCase().includes(tactic.id)
                );
                const count = tacticData?.count || 0;

                if (count === 0) return null;

                return (
                  <button
                    key={tactic.id}
                    onClick={() => setSelectedTactic(tactic.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-2 ${
                      selectedTactic === tactic.id
                        ? 'ring-2 ring-offset-2 ring-primary'
                        : 'hover:bg-secondary/80'
                    }`}
                    style={{
                      backgroundColor: selectedTactic === tactic.id ? tactic.color : undefined,
                      color: selectedTactic === tactic.id ? 'white' : undefined,
                    }}
                  >
                    <span>{tactic.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {count}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Techniques Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Detected Techniques
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({filteredTechniques.length} {filteredTechniques.length === 1 ? 'technique' : 'techniques'})
              </span>
            </CardTitle>
            <a
              href="https://attack.mitre.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View Full Matrix
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTechniques.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No techniques detected</p>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedTactic 
                  ? 'Try selecting a different tactic or time period'
                  : searchQuery
                  ? 'No techniques match your search'
                  : 'No MITRE-mapped alerts in this time period'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTechniques.map((technique: any) => (
                <div
                  key={technique.id}
                  className={`p-4 rounded-lg border transition-all hover:shadow-lg group ${getHeatColor(technique.count)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-mono text-sm font-bold mb-1">
                        {technique.id}
                      </p>
                      <p className="text-xs font-medium line-clamp-2">
                        {technique.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-current/10">
                    <div className="flex flex-wrap gap-1">
                      {technique.tactics.slice(0, 2).map((tactic: string, idx: number) => {
                        const tacticInfo = MITRE_TACTICS.find(t => 
                          tactic.toLowerCase().includes(t.id)
                        );
                        return (
                          <div
                            key={idx}
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: tacticInfo?.color || '#666' }}
                            title={tactic}
                          />
                        );
                      })}
                      {technique.tactics.length > 2 && (
                        <span className="text-xs">+{technique.tactics.length - 2}</span>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {formatNumber(technique.count)}
                    </Badge>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => setSelectedTechnique(technique)}
                    className="w-full mt-3 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors flex items-center justify-center gap-1 text-xs font-medium"
                  >
                    <Eye className="h-3 w-3" />
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      {techniques.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Heat Map Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-gray-800 border border-gray-700" />
                <span className="text-sm text-muted-foreground">No alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-blue-500/20 border border-blue-500/30" />
                <span className="text-sm text-muted-foreground">1-4 alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-yellow-500/20 border border-yellow-500/30" />
                <span className="text-sm text-muted-foreground">5-19 alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-orange-500/20 border border-orange-500/30" />
                <span className="text-sm text-muted-foreground">20-49 alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-red-500/20 border border-red-500/30" />
                <span className="text-sm text-muted-foreground">50+ alerts</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details Modal */}
      {selectedTechnique && (
        <MitreTechniqueDetailsModal
          isOpen={!!selectedTechnique}
          onClose={() => setSelectedTechnique(null)}
          techniqueId={selectedTechnique.id}
          techniqueName={selectedTechnique.name}
          count={selectedTechnique.count}
          tactics={selectedTechnique.tactics}
        />
      )}
    </div>
  );
}
