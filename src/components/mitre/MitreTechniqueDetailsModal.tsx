// src/components/mitre/MitreTechniqueDetailsModal.tsx (ENHANCED - Full Event Details)
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Copy,
  Check,
  Target,
  Shield,
  AlertTriangle,
  ExternalLink,
  FileText,
  Server,
  Clock,
  Eye,
  ChevronDown,
  ChevronUp,
  Info,
  Activity,
  Zap,
  Hash,
  User,
  Key,
  MapPin,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/date';
import { getSeverityFromLevel, getSeverityBgColor } from '@/lib/utils/severity';
import { toast } from 'sonner';
import Link from 'next/link';

interface MitreTechniqueDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  techniqueId: string;
  techniqueName: string;
  count: number;
  tactics: string[];
}

const MITRE_TACTICS_COLORS: { [key: string]: string } = {
  reconnaissance: '#8b5cf6',
  'resource-development': '#7c3aed',
  'initial-access': '#6366f1',
  execution: '#3b82f6',
  persistence: '#0ea5e9',
  'privilege-escalation': '#06b6d4',
  'defense-evasion': '#14b8a6',
  'credential-access': '#10b981',
  discovery: '#22c55e',
  'lateral-movement': '#84cc16',
  collection: '#eab308',
  'command-and-control': '#f59e0b',
  exfiltration: '#f97316',
  impact: '#ef4444',
};

export default function MitreTechniqueDetailsModal({
  isOpen,
  onClose,
  techniqueId,
  techniqueName,
  count,
  tactics,
}: MitreTechniqueDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'intelligence' | 'framework' | 'events'>('intelligence');
  const [events, setEvents] = useState<any[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'events') {
      fetchEvents();
    }
  }, [isOpen, activeTab, techniqueId]);

  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const response = await fetch(`/api/wazuh/alerts?limit=50&q=rule.mitre.id:${techniqueId}`);
      const data = await response.json();
      setEvents(data?.data?.affected_items || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      setEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderField = (label: string, value: any, copyable: boolean = false) => {
    if (value === undefined || value === null || value === '') return null;

    const stringValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);

    return (
      <div className="py-2 border-b border-border last:border-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
            <p className="text-sm break-all">{stringValue}</p>
          </div>
          {copyable && (
            <button
              onClick={() => copyToClipboard(stringValue, label)}
              className="flex-shrink-0 p-1 hover:bg-secondary rounded transition-colors"
            >
              {copiedField === label ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  const mitreUrl = `https://attack.mitre.org/techniques/${techniqueId.replace('.', '/')}/`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Target className="h-6 w-6" />
              {techniqueId}: {techniqueName}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {count} alerts
              </Badge>
              {tactics.map((tactic, idx) => {
                const tacticKey = Object.keys(MITRE_TACTICS_COLORS).find(key => 
                  tactic.toLowerCase().includes(key)
                );
                const color = tacticKey ? MITRE_TACTICS_COLORS[tacticKey] : '#666';
                return (
                  <Badge 
                    key={idx} 
                    variant="secondary"
                    style={{ backgroundColor: `${color}20`, color }}
                  >
                    {tactic}
                  </Badge>
                );
              })}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b bg-background px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('intelligence')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'intelligence'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                Intelligence
              </div>
            </button>
            <button
              onClick={() => setActiveTab('framework')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'framework'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Framework
              </div>
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'events'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Events ({count})
              </div>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Intelligence Tab */}
          {activeTab === 'intelligence' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Technique Information
                    </span>
                    <a
                      href={mitreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      View on MITRE
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Technique ID</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono font-bold">{techniqueId}</p>
                      <button
                        onClick={() => copyToClipboard(techniqueId, 'Technique ID')}
                        className="p-1.5 hover:bg-secondary rounded transition-colors"
                      >
                        {copiedField === 'Technique ID' ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Technique Name</p>
                    <p className="text-sm font-medium">{techniqueName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tactics</p>
                    <div className="flex flex-wrap gap-2">
                      {tactics.map((tactic, idx) => (
                        <Badge key={idx} variant="secondary">
                          {tactic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Detection Count</p>
                    <p className="text-2xl font-bold text-primary">{count} alerts</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Detection Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This technique has been detected <strong>{count} times</strong> across your 
                    monitored infrastructure. The technique is associated with {tactics.length} tactic(s) 
                    in the MITRE ATT&CK framework.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Review all related alerts to understand the attack pattern</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Check the MITRE ATT&CK framework for mitigation strategies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Verify if detections are false positives or legitimate threats</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Implement additional monitoring for related techniques</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Framework Tab */}
          {activeTab === 'framework' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    MITRE ATT&CK Framework Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Tactic Coverage</p>
                    <div className="grid gap-2">
                      {tactics.map((tactic, idx) => {
                        const tacticKey = Object.keys(MITRE_TACTICS_COLORS).find(key => 
                          tactic.toLowerCase().includes(key)
                        );
                        const color = tacticKey ? MITRE_TACTICS_COLORS[tacticKey] : '#666';
                        
                        return (
                          <div 
                            key={idx}
                            className="p-3 rounded-lg border"
                            style={{ borderColor: `${color}40`, backgroundColor: `${color}10` }}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm" style={{ color }}>
                                  {tactic}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  This technique is used in the {tactic.toLowerCase()} phase of an attack
                                </p>
                              </div>
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Framework Information</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span className="text-muted-foreground">Framework</span>
                        <span className="font-medium">MITRE ATT&CK</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span className="text-muted-foreground">Technique ID</span>
                        <span className="font-mono font-medium">{techniqueId}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span className="text-muted-foreground">Number of Tactics</span>
                        <span className="font-medium">{tactics.length}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted rounded">
                        <span className="text-muted-foreground">Detections</span>
                        <span className="font-medium">{count} alerts</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <a
                      href={mitreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Full Details on MITRE ATT&CK
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    About MITRE ATT&CK
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    MITRE ATT&CK® is a globally-accessible knowledge base of adversary tactics and 
                    techniques based on real-world observations. The ATT&CK knowledge base is used 
                    as a foundation for the development of specific threat models and methodologies 
                    in the private sector, in government, and in the cybersecurity product and service community.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Events Tab - FULL DETAILS */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              {isLoadingEvents ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="spinner h-8 w-8 border-4 rounded-full mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Loading events...</p>
                  </div>
                </div>
              ) : events.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-lg font-medium">No events found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Unable to load events for this technique
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {events.length} alerts
                    </p>
                  </div>

                  {events.map((event: any) => {
                    const isExpanded = expandedEvent === event._id;
                    const severity = getSeverityFromLevel(event._source.rule.level);

                    return (
                      <Card
                        key={event._id}
                        className="hover:shadow-md transition-all"
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0 space-y-3">
                              {/* Alert Header */}
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={severity as any}
                                  className={getSeverityBgColor(severity)}
                                >
                                  {severity.toUpperCase()}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  Rule {event._source.rule.id}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Level {event._source.rule.level}
                                </span>
                              </div>

                              <p className="text-sm font-medium">
                                {event._source.rule.description}
                              </p>

                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Server className="h-3 w-3" />
                                  {event._source.agent.name} ({event._source.agent.id})
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatRelativeTime(event._source.timestamp)}
                                </span>
                                {event._source.agent.ip && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {event._source.agent.ip}
                                  </span>
                                )}
                              </div>

                              {/* Expanded Details */}
                              {isExpanded && (
                                <div className="mt-4 pt-4 border-t space-y-4">
                                  {/* Alert Information */}
                                  <div>
                                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                      <Info className="h-4 w-4" />
                                      Alert Information
                                    </p>
                                    <div className="bg-muted rounded-lg p-3 space-y-0">
                                      {renderField('Alert ID', event._id, true)}
                                      {renderField('Timestamp', new Date(event._source.timestamp).toLocaleString())}
                                      {renderField('Rule Description', event._source.rule.description)}
                                      {renderField('Rule Level', event._source.rule.level)}
                                      {renderField('Rule ID', event._source.rule.id)}
                                    </div>
                                  </div>

                                  {/* Agent Information */}
                                  <div>
                                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                      <Server className="h-4 w-4" />
                                      Agent Information
                                    </p>
                                    <div className="bg-muted rounded-lg p-3 space-y-0">
                                      {renderField('Agent Name', event._source.agent.name)}
                                      {renderField('Agent ID', event._source.agent.id)}
                                      {renderField('Agent IP', event._source.agent.ip)}
                                    </div>
                                  </div>

                                  {/* MITRE ATT&CK */}
                                  {event._source.rule.mitre && (
                                    <div>
                                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                        <Target className="h-4 w-4" />
                                        MITRE ATT&CK
                                      </p>
                                      <div className="bg-muted rounded-lg p-3 space-y-0">
                                        {renderField('Technique ID', Array.isArray(event._source.rule.mitre.id) ? event._source.rule.mitre.id.join(', ') : event._source.rule.mitre.id, true)}
                                        {renderField('Technique', Array.isArray(event._source.rule.mitre.technique) ? event._source.rule.mitre.technique.join(', ') : event._source.rule.mitre.technique)}
                                        {renderField('Tactic', Array.isArray(event._source.rule.mitre.tactic) ? event._source.rule.mitre.tactic.join(', ') : event._source.rule.mitre.tactic)}
                                      </div>
                                    </div>
                                  )}

                                  {/* Rule Groups */}
                                  {event._source.rule.groups && event._source.rule.groups.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium mb-2">Rule Groups</p>
                                      <div className="flex flex-wrap gap-1">
                                        {event._source.rule.groups.map((group: string, idx: number) => (
                                          <Badge key={idx} variant="secondary" className="text-xs">
                                            {group}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Compliance */}
                                  {(event._source.rule.gdpr || event._source.rule.hipaa || event._source.rule.pci_dss) && (
                                    <div>
                                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        Compliance
                                      </p>
                                      <div className="bg-muted rounded-lg p-3 space-y-0">
                                        {event._source.rule.gdpr && renderField('GDPR', event._source.rule.gdpr.join(', '))}
                                        {event._source.rule.hipaa && renderField('HIPAA', event._source.rule.hipaa.join(', '))}
                                        {event._source.rule.pci_dss && renderField('PCI DSS', event._source.rule.pci_dss.join(', '))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Decoder */}
                                  {event._source.decoder && (
                                    <div>
                                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                        <Key className="h-4 w-4" />
                                        Decoder
                                      </p>
                                      <div className="bg-muted rounded-lg p-3 space-y-0">
                                        {renderField('Decoder Name', event._source.decoder.name)}
                                        {renderField('Parent', event._source.decoder.parent)}
                                      </div>
                                    </div>
                                  )}

                                  {/* Location */}
                                  {event._source.location && (
                                    <div>
                                      <p className="text-sm font-medium mb-2">Log Location</p>
                                      <div className="bg-muted rounded-lg p-3">
                                        <p className="text-sm font-mono break-all">{event._source.location}</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Full Message */}
                                  {event._source.full_log && (
                                    <div>
                                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Full Log
                                      </p>
                                      <div className="bg-muted rounded-lg p-3">
                                        <pre className="text-xs whitespace-pre-wrap break-all">{event._source.full_log}</pre>
                                      </div>
                                    </div>
                                  )}

                                  {/* View Full Alert Button */}
                                  <Link
                                    href={`/alerts/${event._id}`}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                                  >
                                    <Eye className="h-4 w-4" />
                                    View Full Alert Details
                                  </Link>
                                </div>
                              )}
                            </div>

                            {/* Expand Button */}
                            <button
                              onClick={() => setExpandedEvent(isExpanded ? null : event._id)}
                              className="flex-shrink-0 p-2 hover:bg-secondary rounded transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
