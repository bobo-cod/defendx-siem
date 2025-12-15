// src/components/fim/FimEventDetailsModal.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  X,
  Copy,
  Check,
  FileText,
  Server,
  Clock,
  User,
  Shield,
  Hash,
  Key,
  Lock,
  File,
  Calendar,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils/date';
import { useState } from 'react';
import { toast } from 'sonner';

interface FimEventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
}

export default function FimEventDetailsModal({
  isOpen,
  onClose,
  event,
}: FimEventDetailsModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !event) return null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const renderField = (label: string, value: any, copyable: boolean = false) => {
    if (value === undefined || value === null || value === '') return null;

    const stringValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);

    return (
      <div className="py-3 border-b border-border last:border-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
            <p className="text-sm font-mono break-all">{stringValue}</p>
          </div>
          {copyable && (
            <button
              onClick={() => copyToClipboard(stringValue, label)}
              className="flex-shrink-0 p-1.5 hover:bg-secondary rounded transition-colors"
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

  const renderSection = (title: string, icon: any, fields: Array<{ label: string; value: any; copyable?: boolean }>) => {
    const validFields = fields.filter(f => f.value !== undefined && f.value !== null && f.value !== '');
    if (validFields.length === 0) return null;

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {validFields.map((field, idx) => (
            <div key={idx}>
              {renderField(field.label, field.value, field.copyable)}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  const eventType = event.syscheck?.event || 'unknown';
  const syscheck = event.syscheck || {};
  const agent = event.agent || {};
  const rule = event.rule || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6" />
              FIM Event Details
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Event ID: <span className="font-mono">{event.id}</span>
            </p>
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
          {/* Event Overview */}
          <Card className={
            eventType === 'added' ? 'border-green-500/30 bg-green-500/5' :
            eventType === 'modified' ? 'border-yellow-500/30 bg-yellow-500/5' :
            eventType === 'deleted' ? 'border-red-500/30 bg-red-500/5' : ''
          }>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-5 w-5" />
                Event Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant="secondary"
                  className={
                    eventType === 'added' ? 'bg-green-500/20 text-green-500' :
                    eventType === 'modified' ? 'bg-yellow-500/20 text-yellow-500' :
                    eventType === 'deleted' ? 'bg-red-500/20 text-red-500' : ''
                  }
                >
                  {eventType.toUpperCase()}
                </Badge>
                <Badge variant="secondary">
                  Rule: {rule.id}
                </Badge>
                {rule.level && (
                  <Badge variant="secondary">
                    Level: {rule.level}
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{rule.description}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">File Path</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-mono break-all flex-1">{syscheck.path}</p>
                  <button
                    onClick={() => copyToClipboard(syscheck.path, 'File Path')}
                    className="flex-shrink-0 p-1.5 hover:bg-secondary rounded transition-colors"
                  >
                    {copiedField === 'File Path' ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Timestamp</p>
                  <p className="text-sm">{new Date(event.timestamp).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{formatRelativeTime(event.timestamp)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Agent</p>
                  <p className="text-sm font-medium">{agent.name}</p>
                  <p className="text-xs text-muted-foreground">ID: {agent.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* File Information */}
          {renderSection(
            'File Information',
            <File className="h-5 w-5" />,
            [
              { label: 'File Size', value: syscheck.size ? `${(syscheck.size / 1024).toFixed(2)} KB (${syscheck.size} bytes)` : null },
              { label: 'File Type', value: syscheck.type },
              { label: 'Inode', value: syscheck.inode },
              { label: 'Device', value: syscheck.dev },
              { label: 'Modification Time', value: syscheck.mtime ? new Date(syscheck.mtime * 1000).toLocaleString() : null },
              { label: 'Attributes', value: syscheck.attrs },
            ]
          )}

          {/* Permissions & Ownership */}
          {renderSection(
            'Permissions & Ownership',
            <Lock className="h-5 w-5" />,
            [
              { label: 'Permissions', value: syscheck.perm, copyable: true },
              { label: 'User ID', value: syscheck.uid },
              { label: 'User Name', value: syscheck.uname },
              { label: 'Group ID', value: syscheck.gid },
              { label: 'Group Name', value: syscheck.gname },
            ]
          )}

          {/* Checksums - Before */}
          {(syscheck.md5_before || syscheck.sha1_before || syscheck.sha256_before) && renderSection(
            'Checksums (Before)',
            <Hash className="h-5 w-5" />,
            [
              { label: 'MD5', value: syscheck.md5_before, copyable: true },
              { label: 'SHA1', value: syscheck.sha1_before, copyable: true },
              { label: 'SHA256', value: syscheck.sha256_before, copyable: true },
            ]
          )}

          {/* Checksums - After */}
          {(syscheck.md5_after || syscheck.sha1_after || syscheck.sha256_after) && renderSection(
            'Checksums (After)',
            <Hash className="h-5 w-5" />,
            [
              { label: 'MD5', value: syscheck.md5_after, copyable: true },
              { label: 'SHA1', value: syscheck.sha1_after, copyable: true },
              { label: 'SHA256', value: syscheck.sha256_after, copyable: true },
            ]
          )}

          {/* Changed Attributes */}
          {syscheck.changed_attributes && syscheck.changed_attributes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Changed Attributes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {syscheck.changed_attributes.map((attr: string, idx: number) => (
                    <Badge key={idx} variant="secondary">
                      {attr}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Agent Information */}
          {renderSection(
            'Agent Information',
            <Server className="h-5 w-5" />,
            [
              { label: 'Agent ID', value: agent.id },
              { label: 'Agent Name', value: agent.name },
              { label: 'Agent IP', value: agent.ip },
            ]
          )}

          {/* Rule Information */}
          {renderSection(
            'Rule Information',
            <Shield className="h-5 w-5" />,
            [
              { label: 'Rule ID', value: rule.id },
              { label: 'Rule Description', value: rule.description },
              { label: 'Rule Level', value: rule.level },
              { label: 'Rule Groups', value: rule.groups?.join(', ') },
              { label: 'Rule GDPR', value: rule.gdpr?.join(', ') },
              { label: 'Rule HIPAA', value: rule.hipaa?.join(', ') },
              { label: 'Rule PCI DSS', value: rule.pci_dss?.join(', ') },
            ]
          )}

          {/* Decoder Information */}
          {event.decoder && renderSection(
            'Decoder Information',
            <Key className="h-5 w-5" />,
            [
              { label: 'Decoder Name', value: event.decoder.name },
              { label: 'Decoder Parent', value: event.decoder.parent },
            ]
          )}

          {/* Full Event Data (JSON) */}
          <Card>
            <CardHeader className="pb-3">
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
