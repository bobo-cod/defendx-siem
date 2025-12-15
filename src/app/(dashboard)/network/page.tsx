// src/app/(dashboard)/network/page.tsx (UPDATED - Pagination + Top 4)
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNetworkEvents, useNetworkStats } from '@/lib/hooks/use-network';
import { useAgents } from '@/lib/hooks/use-agents';
import { formatRelativeTime } from '@/lib/utils/date';
import { formatNumber } from '@/lib/utils/format';
import NetworkEventDetailsModal from '@/components/network/NetworkEventDetailsModal';
import {
  Network,
  Activity,
  Server,
  Clock,
  Globe,
  ArrowRight,
  Eye,
  ChevronDown,
  ChevronUp,
  Shield,
  TrendingUp,
  Wifi,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const ITEMS_PER_PAGE = 20;
const TOP_ITEMS_DISPLAY = 4;

export default function NetworkPage() {
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedProtocol, setSelectedProtocol] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const { data: networkData, isLoading } = useNetworkEvents({
    limit: ITEMS_PER_PAGE,
    offset,
    agent_id: selectedAgent || undefined,
    protocol: selectedProtocol || undefined,
    days: selectedPeriod,
  });

  const { data: statsData } = useNetworkStats(selectedPeriod);
  const { data: agentsData } = useAgents({ limit: 100 });

  const events = networkData?.data || [];
  const total = networkData?.total || 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const agents = agentsData?.data?.affected_items || [];
  const protocols = statsData?.by_protocol || [];
  const topSrcIps = statsData?.top_src_ips || [];
  const topDstIps = statsData?.top_dst_ips || [];
  const topSrcPorts = statsData?.top_src_ports || [];
  const topDstPorts = statsData?.top_dst_ports || [];

  const tcpCount = protocols.find((p: any) => p.protocol === 'tcp')?.count || 0;
  const udpCount = protocols.find((p: any) => p.protocol === 'udp')?.count || 0;
  const icmpCount = protocols.find((p: any) => p.protocol === 'icmp')?.count || 0;

  const getProtocolColor = (protocol: string) => {
    switch (protocol?.toLowerCase()) {
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

  // Helper to get destination IP (fallback to agent IP)
  const getDestinationIp = (event: any) => {
    const data = event.data || {};
    const dstIp = data.dst_ip || data.dstip;
    
    // If no destination IP, use agent IP (connection is TO the agent)
    if (!dstIp || dstIp === 'N/A') {
      return event.agent?.ip || 'N/A';
    }
    
    return dstIp;
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setExpandedEvent(null); // Collapse expanded items when changing page
  };

  // Reset to page 1 when filters change
  const handleFilterChange = (filterFn: () => void) => {
    filterFn();
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner h-8 w-8 border-4 rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading network events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Network className="h-8 w-8" />
          Network Monitoring
        </h1>
        <p className="text-muted-foreground mt-1">
          Connection tracking, traffic analysis, and port monitoring
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(total)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last {selectedPeriod} days
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TCP Connections</CardTitle>
            <Wifi className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {formatNumber(tcpCount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Transmission Control Protocol
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">UDP Connections</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatNumber(udpCount)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              User Datagram Protocol
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique IPs</CardTitle>
            <Globe className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {formatNumber(topSrcIps.length + topDstIps.length)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Source + Destination
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium mb-2 block">Filter by Agent</label>
              <select
                value={selectedAgent}
                onChange={(e) => handleFilterChange(() => setSelectedAgent(e.target.value))}
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

            <div>
              <label className="text-sm font-medium mb-2 block">Protocol</label>
              <select
                value={selectedProtocol}
                onChange={(e) => handleFilterChange(() => setSelectedProtocol(e.target.value))}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">All Protocols</option>
                <option value="tcp">TCP</option>
                <option value="udp">UDP</option>
                <option value="icmp">ICMP</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Time Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => handleFilterChange(() => setSelectedPeriod(parseInt(e.target.value)))}
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

      {/* Protocol Distribution */}
      {protocols.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Traffic Distribution by Protocol</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {protocols.slice(0, 6).map((proto: any) => {
                const percentage = total > 0 ? (proto.count / total) * 100 : 0;
                return (
                  <div key={proto.protocol} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium uppercase">{proto.protocol}</span>
                      <Badge variant="secondary">{formatNumber(proto.count)}</Badge>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          proto.protocol === 'tcp' ? 'bg-blue-500' :
                          proto.protocol === 'udp' ? 'bg-green-500' :
                          proto.protocol === 'icmp' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Source IPs - LIMITED TO 4 */}
        {topSrcIps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-500" />
                Top Source IPs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topSrcIps.slice(0, TOP_ITEMS_DISPLAY).map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Globe className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm font-mono truncate">{item.ip}</span>
                    </div>
                    <Badge variant="secondary">{formatNumber(item.count)}</Badge>
                  </div>
                ))}
                {topSrcIps.length > TOP_ITEMS_DISPLAY && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{topSrcIps.length - TOP_ITEMS_DISPLAY} more
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Destination IPs - LIMITED TO 4 */}
        {topDstIps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="h-4 w-4 text-orange-500" />
                Top Destination IPs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topDstIps.slice(0, TOP_ITEMS_DISPLAY).map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Globe className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <span className="text-sm font-mono truncate">{item.ip}</span>
                    </div>
                    <Badge variant="secondary">{formatNumber(item.count)}</Badge>
                  </div>
                ))}
                {topDstIps.length > TOP_ITEMS_DISPLAY && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{topDstIps.length - TOP_ITEMS_DISPLAY} more
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Source Ports - LIMITED TO 4 */}
        {topSrcPorts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Network className="h-4 w-4 text-green-500" />
                Most Active Source Ports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topSrcPorts.slice(0, TOP_ITEMS_DISPLAY).map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Network className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm font-mono">Port {item.port}</span>
                    </div>
                    <Badge variant="secondary">{formatNumber(item.count)}</Badge>
                  </div>
                ))}
                {topSrcPorts.length > TOP_ITEMS_DISPLAY && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{topSrcPorts.length - TOP_ITEMS_DISPLAY} more
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Destination Ports - LIMITED TO 4 */}
        {topDstPorts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Network className="h-4 w-4 text-purple-500" />
                Most Active Destination Ports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {topDstPorts.slice(0, TOP_ITEMS_DISPLAY).map((item: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Network className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      <span className="text-sm font-mono">Port {item.port}</span>
                    </div>
                    <Badge variant="secondary">{formatNumber(item.count)}</Badge>
                  </div>
                ))}
                {topDstPorts.length > TOP_ITEMS_DISPLAY && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{topDstPorts.length - TOP_ITEMS_DISPLAY} more
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Network Events List with Pagination */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Network Connections
              <span className="text-sm font-normal text-muted-foreground ml-2">
                ({events.length} of {total})
              </span>
            </CardTitle>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-12">
              <Network className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No network events found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedAgent || selectedProtocol
                  ? 'Try adjusting your filters'
                  : 'No network connections detected in this period'}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {events.map((event: any) => {
                  const isExpanded = expandedEvent === event.id;
                  const data = event.data || {};
                  const srcIp = data.src_ip || data.srcip || 'N/A';
                  const dstIp = getDestinationIp(event);
                  const srcPort = data.src_port || data.srcport;
                  const dstPort = data.dst_port || data.dstport;
                  const protocol = data.protocol || 'unknown';

                  return (
                    <div
                      key={event.id}
                      className={`rounded-lg border p-4 transition-all ${getProtocolColor(protocol)}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 mt-0.5">
                            <Network className="h-5 w-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={`${getProtocolColor(protocol)} border`}>
                                {protocol.toUpperCase()}
                              </Badge>
                              {event.rule?.level && (
                                <Badge variant="secondary">
                                  Level {event.rule.level}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="font-mono text-sm font-medium">{srcIp}</span>
                              {srcPort && <span className="text-xs text-muted-foreground">:{srcPort}</span>}
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                              <span className="font-mono text-sm font-medium">{dstIp}</span>
                              {dstPort && <span className="text-xs text-muted-foreground">:{dstPort}</span>}
                              {dstIp === event.agent?.ip && (
                                <Badge variant="secondary" className="text-xs">
                                  {event.agent?.name}
                                </Badge>
                              )}
                            </div>

                            {event.rule?.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {event.rule.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Server className="h-3 w-3" />
                                {event.agent?.name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatRelativeTime(event.timestamp)}
                              </span>
                              {data.dstuser && (
                                <span className="flex items-center gap-1">
                                  <Shield className="h-3 w-3" />
                                  User: {data.dstuser}
                                </span>
                              )}
                            </div>

                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t">
                                <button
                                  onClick={() => setSelectedEvent(event)}
                                  className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Full Details
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

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

              {/* Bottom Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 pt-6 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <NetworkEventDetailsModal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        event={selectedEvent}
      />
    </div>
  );
}
