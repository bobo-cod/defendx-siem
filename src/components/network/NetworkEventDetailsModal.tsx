// src/components/network/NetworkEventDetailsModal.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Copy,
  Check,
  Network,
  Server,
  Clock,
  Activity,
  Shield,
  ArrowRight,
  Info,
  Hash,
  Globe,
  FileText,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/date';
import { useState } from 'react';
import { toast } from 'sonner';

interface NetworkEventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
}

export default function NetworkEventDetailsModal({
  isOpen,
  onClose,
  event,
}: NetworkEventDetailsModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const data = event.data || {};
  const srcIp = data.src_ip || data.srcip || 'N/A';
  
  // Get destination IP - fallback to agent IP if not available
  const rawDstIp = data.dst_ip || data.dstip;
  const dstIp = rawDstIp || event.agent?.ip || 'N/A';
  const isAgentDestination = !rawDstIp && event.agent?.ip;
  
  const srcPort = data.src_port || data.srcport;
  const dstPort = data.dst_port || data.dstport;
  const protocol = data.protocol || 'N/A';

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderField = (label: string, value: any, copyable: boolean = false) => {
    if (value === undefined || value === null || value === '' || value === 'N/A') return null;

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

  const getProtocolColor = (proto: string) => {
    switch (proto?.toLowerCase()) {
      case 'tcp':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'udp':
        return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'icmp':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between z-10">
          <div className="flex-1">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Network className="h-6 w-6" />
              Network Connection Details
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={`${getProtocolColor(protocol)} border`}>
                {protocol.toUpperCase()}
              </Badge>
              {event.rule?.level && (
                <Badge variant="secondary">
                  Level {event.rule.level}
                </Badge>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Connection Flow */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Connection Flow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center gap-4 py-4">
                {/* Source */}
                <div className="flex-1 text-center">
                  <p className="text-xs text-muted-foreground mb-2">Source</p>
                  <div className="p-4 bg-background rounded-lg border">
                    <Globe className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <p className="font-mono font-bold text-lg">{srcIp}</p>
                    {srcPort && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Port: {srcPort}
                      </p>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center gap-2">
                  <ArrowRight className="h-8 w-8 text-primary" />
                  <Badge className={`${getProtocolColor(protocol)} border`}>
                    {protocol.toUpperCase()}
                  </Badge>
                </div>

                {/* Destination */}
                <div className="flex-1 text-center">
                  <p className="text-xs text-muted-foreground mb-2">Destination</p>
                  <div className="p-4 bg-background rounded-lg border">
                    {isAgentDestination ? (
                      <Server className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                    ) : (
                      <Globe className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                    )}
                    <p className="font-mono font-bold text-lg">{dstIp}</p>
                    {isAgentDestination && (
                      <p className="text-xs text-primary mt-1 font-medium">
                        {event.agent?.name}
                      </p>
                    )}
                    {dstPort && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Port: {dstPort}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-5 w-5" />
                Event Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {renderField('Event ID', event.id, true)}
              {renderField('Timestamp', new Date(event.timestamp).toLocaleString())}
              {renderField('Time Ago', formatRelativeTime(event.timestamp))}
              {renderField('Rule Description', event.rule?.description)}
              {renderField('Rule ID', event.rule?.id)}
              {renderField('Rule Level', event.rule?.level)}
            </CardContent>
          </Card>

          {/* Source Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                Source Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {renderField('Source IP', srcIp, true)}
              {renderField('Source Port', srcPort)}
              {renderField('Source User', data.srcuser)}
              {renderField('Source MAC', data.src_mac)}
            </CardContent>
          </Card>

          {/* Destination Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-5 w-5 text-orange-500" />
                Destination Information
                {isAgentDestination && (
                  <Badge variant="secondary" className="text-xs">
                    Monitored Agent
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {renderField('Destination IP', dstIp, true)}
              {isAgentDestination && renderField('Agent Name', event.agent?.name)}
              {isAgentDestination && renderField('Agent ID', event.agent?.id)}
              {renderField('Destination Port', dstPort)}
              {renderField('Destination User', data.dstuser)}
              {renderField('Destination MAC', data.dst_mac)}
            </CardContent>
          </Card>

          {/* Protocol Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Network className="h-5 w-5" />
                Protocol Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {renderField('Protocol', protocol)}
              {renderField('Protocol Type', data.protocol_type)}
              {renderField('Action', data.action)}
              {renderField('Status', data.status)}
              {renderField('Connection State', data.state)}
            </CardContent>
          </Card>

          {/* Traffic Information */}
          {(data.bytes || data.packets || data.data_length) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Traffic Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                {renderField('Bytes Transferred', data.bytes ? `${data.bytes} bytes` : null)}
                {renderField('Packets', data.packets)}
                {renderField('Data Length', data.data_length)}
                {renderField('TTL', data.ttl)}
              </CardContent>
            </Card>
          )}

          {/* Agent Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="h-5 w-5" />
                Monitoring Agent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-0">
              {renderField('Agent Name', event.agent?.name)}
              {renderField('Agent ID', event.agent?.id)}
              {renderField('Agent IP', event.agent?.ip)}
            </CardContent>
          </Card>

          {/* Rule Information */}
          {event.rule && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Detection Rule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                {renderField('Rule ID', event.rule.id)}
                {renderField('Rule Description', event.rule.description)}
                {renderField('Rule Level', event.rule.level)}
                {renderField('Rule Groups', event.rule.groups?.join(', '))}
                {renderField('MITRE Technique', event.rule.mitre?.technique ? 
                  (Array.isArray(event.rule.mitre.technique) ? event.rule.mitre.technique.join(', ') : event.rule.mitre.technique) 
                  : null)}
                {renderField('MITRE Tactic', event.rule.mitre?.tactic ? 
                  (Array.isArray(event.rule.mitre.tactic) ? event.rule.mitre.tactic.join(', ') : event.rule.mitre.tactic) 
                  : null)}
              </CardContent>
            </Card>
          )}

          {/* Additional Data */}
          {data.data && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0">
                {renderField('Extra Data', data.data)}
              </CardContent>
            </Card>
          )}

          {/* Full Log */}
          {event.full_log && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Full Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-muted rounded text-xs overflow-x-auto whitespace-pre-wrap break-all">
                  {event.full_log}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Raw Event Data */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Raw Event Data (JSON)
                </CardTitle>
                <button
                  onClick={() => copyToClipboard(JSON.stringify(event, null, 2), 'Full Event JSON')}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded transition-colors"
                >
                  {copiedField === 'Full Event JSON' ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy All
                    </>
                  )}
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-muted rounded text-xs overflow-x-auto max-h-96">
                {JSON.stringify(event, null, 2)}
              </pre>
            </CardContent>
          </Card>
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
