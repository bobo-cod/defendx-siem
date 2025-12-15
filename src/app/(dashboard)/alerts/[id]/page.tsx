// src/app/(dashboard)/alerts/[id]/page.tsx (WITH READ/UNREAD)
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAlert } from '@/lib/hooks/use-alerts';
import { formatDate } from '@/lib/utils/date';
import { getSeverityFromLevel, getSeverityBgColor } from '@/lib/utils/severity';
import {
  ArrowLeft,
  AlertTriangle,
  Shield,
  Server,
  FileText,
  Tag,
  Clock,
  MapPin,
  Info,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AlertDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: alert, isLoading } = useAlert(id);
  const [isRead, setIsRead] = useState(false);

  // Load read status from localStorage
  useEffect(() => {
    const readAlerts = JSON.parse(localStorage.getItem('readAlerts') || '[]');
    setIsRead(readAlerts.includes(id));
  }, [id]);

  const handleMarkAsRead = () => {
    const readAlerts = JSON.parse(localStorage.getItem('readAlerts') || '[]');
    
    if (!readAlerts.includes(id)) {
      readAlerts.push(id);
      localStorage.setItem('readAlerts', JSON.stringify(readAlerts));
      setIsRead(true);
      toast.success('Alert marked as read');
    }
  };

  const handleMarkAsUnread = () => {
    const readAlerts = JSON.parse(localStorage.getItem('readAlerts') || '[]');
    const filtered = readAlerts.filter((alertId: string) => alertId !== id);
    localStorage.setItem('readAlerts', JSON.stringify(filtered));
    setIsRead(false);
    toast.success('Alert marked as unread');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner h-8 w-8 border-4 rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading alert details...</p>
        </div>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium">Alert not found</p>
      </div>
    );
  }

  const severity = getSeverityFromLevel(alert._source.rule.level);
  const rule = alert._source.rule;
  const agent = alert._source.agent;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/alerts"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Alerts
        </Link>

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {rule.description}
              </h1>
              <Badge
                variant={severity as any}
                className={getSeverityBgColor(severity)}
              >
                Level {rule.level}
              </Badge>
              {isRead && (
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                  <Eye className="h-3 w-3 mr-1" />
                  Read
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Alert ID: <span className="font-mono">{alert._id}</span>
            </p>
          </div>

          <div className="flex gap-2">
            {isRead ? (
              <button
                onClick={handleMarkAsUnread}
                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
              >
                <EyeOff className="h-4 w-4" />
                Mark as Unread
              </button>
            ) : (
              <button
                onClick={handleMarkAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Mark as Read
              </button>
            )}
            <button className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors">
              Archive
            </button>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Severity</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{severity}</div>
            <p className="text-xs text-muted-foreground mt-1">Level {rule.level}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rule ID</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{rule.id}</div>
            <p className="text-xs text-muted-foreground mt-1">Rule identifier</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agent</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">{agent.name}</div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              ID: {agent.id}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Timestamp</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {formatDate(alert._source.timestamp)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Rule Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Rule Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Description</p>
              <p className="text-sm text-muted-foreground">{rule.description}</p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Rule Information</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rule ID:</span>
                  <span className="font-mono">{rule.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Level:</span>
                  <span>{rule.level}</span>
                </div>
                {rule.firedtimes && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fired Times:</span>
                    <span>{rule.firedtimes}</span>
                  </div>
                )}
              </div>
            </div>

            {rule.groups && rule.groups.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Rule Groups</p>
                <div className="flex flex-wrap gap-2">
                  {rule.groups.map((group: string, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {group}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Agent Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Agent Information</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Name:</span>
                  <Link
                    href={`/agents/${agent.id}`}
                    className="font-medium hover:underline"
                  >
                    {agent.name}
                  </Link>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono">{agent.id}</span>
                </div>
                {agent.ip && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">IP Address:</span>
                    <span className="font-mono">{agent.ip}</span>
                  </div>
                )}
              </div>
            </div>

            {alert._source.location && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-1">Location</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {alert._source.location}
                </p>
              </div>
            )}

            {alert._source.decoder && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-1">Decoder</p>
                <p className="text-sm text-muted-foreground">
                  {alert._source.decoder.name}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* MITRE ATT&CK */}
      {rule.mitre && rule.mitre.id && rule.mitre.id.length > 0 && (
        <Card className="border-orange-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-500" />
              MITRE ATT&CK Mapping
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rule.mitre.id.map((mitreId: string, idx: number) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-3 rounded-lg bg-orange-500/5 border border-orange-500/20"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{mitreId}</p>
                    {rule.mitre.technique && rule.mitre.technique[idx] && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {rule.mitre.technique[idx]}
                      </p>
                    )}
                    {rule.mitre.tactic && rule.mitre.tactic[idx] && (
                      <Badge variant="secondary" className="mt-2">
                        {rule.mitre.tactic[idx]}
                      </Badge>
                    )}
                  </div>
                  <a
                    href={`https://attack.mitre.org/techniques/${mitreId.replace('.', '/')}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 p-2 hover:bg-orange-500/10 rounded transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 text-orange-500" />
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compliance */}
      {(rule.pci_dss || rule.gdpr || rule.hipaa || rule.nist_800_53) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Compliance Standards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {rule.pci_dss && rule.pci_dss.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">PCI DSS</p>
                  <div className="flex flex-wrap gap-2">
                    {rule.pci_dss.map((item: string, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {rule.gdpr && rule.gdpr.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">GDPR</p>
                  <div className="flex flex-wrap gap-2">
                    {rule.gdpr.map((item: string, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {rule.hipaa && rule.hipaa.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">HIPAA</p>
                  <div className="flex flex-wrap gap-2">
                    {rule.hipaa.map((item: string, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {rule.nist_800_53 && rule.nist_800_53.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">NIST 800-53</p>
                  <div className="flex flex-wrap gap-2">
                    {rule.nist_800_53.map((item: string, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Log */}
      {alert._source.full_log && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Full Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto custom-scrollbar">
              {alert._source.full_log}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Additional Data */}
      {alert._source.data && Object.keys(alert._source.data).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Additional Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto custom-scrollbar">
              {JSON.stringify(alert._source.data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
