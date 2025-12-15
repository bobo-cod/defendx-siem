// src/app/(dashboard)/fim/page.tsx (UPDATED - With View Details Modal)
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFimEvents, useFimStats } from '@/lib/hooks/use-fim';
import { useAgents } from '@/lib/hooks/use-agents';
import { formatRelativeTime } from '@/lib/utils/date';
import { formatNumber } from '@/lib/utils/format';
import FimEventDetailsModal from '@/components/fim/FimEventDetailsModal';
import {
  FileText,
  FilePlus,
  FileEdit,
  FileX,
  Server,
  Calendar,
  Filter,
  Eye,
  Clock,
  Hash,
  User,
  Shield,
  Activity,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function FimPage() {
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedEventType, setSelectedEventType] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [selectedEventForDetails, setSelectedEventForDetails] = useState<any>(null);

  const { data: fimData, isLoading } = useFimEvents({
    limit: 100,
    agent_id: selectedAgent || undefined,
    event_type: selectedEventType || undefined,
    days: selectedPeriod,
  });

  const { data: statsData } = useFimStats(selectedPeriod);
  const { data: agentsData } = useAgents({ limit: 100 });

  const events = fimData?.data || [];
  const total = fimData?.total || 0;

  const agents = agentsData?.data?.affected_items || [];
  const eventTypeCounts = statsData?.by_event_type || [];
  const agentCounts = statsData?.by_agent || [];

  const addedCount = eventTypeCounts.find((e: any) => e.type === 'added')?.count || 0;
  const modifiedCount = eventTypeCounts.find((e: any) => e.type === 'modified')?.count || 0;
  const deletedCount = eventTypeCounts.find((e: any) => e.type === 'deleted')?.count || 0;

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'added':
        return <FilePlus className="h-4 w-4 text-green-500" />;
      case 'modified':
        return <FileEdit className="h-4 w-4 text-yellow-500" />;
      case 'deleted':
        return <FileX className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'added':
        return 'border-green-500/30 bg-green-500/5';
      case 'modified':
        return 'border-yellow-500/30 bg-yellow-500/5';
      case 'deleted':
        return 'border-red-500/30 bg-red-500/5';
      default:
        return 'border-border';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner h-8 w-8 border-4 rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading file integrity events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-8 w-8" />
          File Integrity Monitoring
        </h1>
        <p className="text-muted-foreground mt-1">
          Track file changes, modifications, and deletions across your infrastructure
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(total)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last {selectedPeriod} days
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Files Added</CardTitle>
            <FilePlus className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatNumber(addedCount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              New files detected
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Files Modified</CardTitle>
            <FileEdit className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {formatNumber(modifiedCount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Changed files
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Files Deleted</CardTitle>
            <FileX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatNumber(deletedCount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Removed files
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

            {/* Event Type Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Event Type</label>
              <select
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Events</option>
                <option value="added">Added</option>
                <option value="modified">Modified</option>
                <option value="deleted">Deleted</option>
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
                <option value={1}>Last 24 Hours</option>
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Agents */}
      {agentCounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Most Active Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {agentCounts.slice(0, 5).map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{item.agent}</span>
                  </div>
                  <Badge variant="secondary">{formatNumber(item.count)} events</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              File Change Events
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({events.length} of {total})
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No FIM events found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedAgent || selectedEventType
                  ? 'Try adjusting your filters'
                  : 'No file changes detected in this period'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event: any) => {
                const isExpanded = expandedEvent === event.id;
                const eventType = event.syscheck?.event || 'unknown';

                return (
                  <div
                    key={event.id}
                    className={`rounded-lg border p-4 transition-all ${getEventColor(eventType)}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Event Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getEventIcon(eventType)}
                        </div>

                        {/* Event Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="secondary"
                              className={
                                eventType === 'added'
                                  ? 'bg-green-500/10 text-green-500'
                                  : eventType === 'modified'
                                  ? 'bg-yellow-500/10 text-yellow-500'
                                  : eventType === 'deleted'
                                  ? 'bg-red-500/10 text-red-500'
                                  : ''
                              }
                            >
                              {eventType.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {event.rule?.description}
                            </span>
                          </div>

                          <p className="font-mono text-sm font-medium break-all">
                            {event.syscheck?.path}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Server className="h-3 w-3" />
                              {event.agent?.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(event.timestamp)}
                            </span>
                            {event.syscheck?.size && (
                              <span className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                {(event.syscheck.size / 1024).toFixed(2)} KB
                              </span>
                            )}
                            {event.syscheck?.uname && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {event.syscheck.uname}
                              </span>
                            )}
                          </div>

                          {/* Quick View - Expanded */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t space-y-3">
                              {/* Checksums */}
                              {(event.syscheck?.md5_before || event.syscheck?.md5_after) && (
                                <div>
                                  <p className="text-xs font-medium mb-2">MD5 Hash:</p>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    {event.syscheck?.md5_before && (
                                      <div className="bg-muted p-2 rounded">
                                        <p className="text-muted-foreground mb-1">Before:</p>
                                        <p className="font-mono break-all">{event.syscheck.md5_before}</p>
                                      </div>
                                    )}
                                    {event.syscheck?.md5_after && (
                                      <div className="bg-muted p-2 rounded">
                                        <p className="text-muted-foreground mb-1">After:</p>
                                        <p className="font-mono break-all">{event.syscheck.md5_after}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* View Full Details Button */}
                              <button
                                onClick={() => setSelectedEventForDetails(event)}
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
                        onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
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
      <FimEventDetailsModal
        isOpen={!!selectedEventForDetails}
        onClose={() => setSelectedEventForDetails(null)}
        event={selectedEventForDetails}
      />
    </div>
  );
}
