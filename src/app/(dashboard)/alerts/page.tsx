// src/app/(dashboard)/alerts/page.tsx (FIXED - No infinite loop)
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAlerts, useAlertCountBySeverity } from '@/lib/hooks/use-alerts';
import { formatRelativeTime, formatDate } from '@/lib/utils/date';
import { getSeverityFromLevel, getSeverityBgColor } from '@/lib/utils/severity';
import { formatNumber } from '@/lib/utils/format';
import {
  AlertTriangle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Clock,
  Shield,
  TrendingUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Server,
} from 'lucide-react';
import Link from 'next/link';

type TimeRange = '1h' | '24h' | '7d' | '30d' | 'custom';
type SeverityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';

export default function AlertsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const itemsPerPage = 100;

  // Memoize date range to prevent infinite loops
  const dateRange = useMemo(() => {
    if (timeRange === 'custom') {
      if (customDateFrom && customDateTo) {
        return {
          date_from: new Date(customDateFrom).toISOString(),
          date_to: new Date(customDateTo).toISOString(),
        };
      }
      // If custom but no dates set, default to 24h
      const now = new Date();
      const from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return {
        date_from: from.toISOString(),
        date_to: now.toISOString(),
      };
    }
    
    const now = new Date();
    let from = new Date();
    
    switch (timeRange) {
      case '1h':
        from = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        from = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    return {
      date_from: from.toISOString(),
      date_to: now.toISOString(),
    };
  }, [timeRange, customDateFrom, customDateTo]); // Recalculate when timeRange or custom dates change

  // Memoize query to prevent infinite loops
  const query = useMemo(() => {
    if (severityFilter === 'all') return '';
    
    const levelMap = {
      critical: 'rule.level>=12',
      high: 'rule.level>=9 AND rule.level<12',
      medium: 'rule.level>=5 AND rule.level<9',
      low: 'rule.level<5',
    };
    return levelMap[severityFilter];
  }, [severityFilter]); // Only recalculate when severityFilter changes

  // Reset to page 1 when filters change
  const offset = (currentPage - 1) * itemsPerPage;

  const { data: alertsData, isLoading, refetch } = useAlerts({
    limit: itemsPerPage,
    offset: offset,
    ...dateRange,
    q: query,
  });

  // Get real counts for each severity level
  const { data: severityCountsData } = useAlertCountBySeverity(dateRange);

  const alerts = alertsData?.data?.affected_items || [];
  const totalAlerts = alertsData?.data?.total_affected_items || 0;
  
  // Filter by search
  const filteredAlerts = useMemo(() => {
    if (!searchQuery) return alerts;
    
    const searchLower = searchQuery.toLowerCase();
    return alerts.filter((alert: any) =>
      alert._source.rule.description.toLowerCase().includes(searchLower) ||
      alert._source.agent.name.toLowerCase().includes(searchLower) ||
      alert._source.rule.id.includes(searchQuery)
    );
  }, [alerts, searchQuery]);

  // Use real counts from API, fallback to 0 if not loaded yet
  const severityCounts = {
    all: totalAlerts,
    critical: severityCountsData?.critical || 0,
    high: severityCountsData?.high || 0,
    medium: severityCountsData?.medium || 0,
    low: severityCountsData?.low || 0,
  };

  const handleSelectAll = () => {
    if (selectedAlerts.length === filteredAlerts.length) {
      setSelectedAlerts([]);
    } else {
      setSelectedAlerts(filteredAlerts.map((a: any) => a._id));
    }
  };

  const handleSelectAlert = (id: string) => {
    setSelectedAlerts(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Reset to page 1 when filters change
  const handleTimeRangeChange = (newRange: TimeRange) => {
    setTimeRange(newRange);
    setCurrentPage(1);
  };

  const handleSeverityFilterChange = (newFilter: SeverityFilter) => {
    setSeverityFilter(newFilter);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalAlerts / itemsPerPage);
  const startItem = offset + 1;
  const endItem = Math.min(offset + itemsPerPage, totalAlerts);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="spinner h-8 w-8 border-4 rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security Alerts</h1>
          <p className="text-muted-foreground">
            Monitor and investigate security events
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors">
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card
          className={`cursor-pointer transition-all hover:shadow-lg ${
            severityFilter === 'all' ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => handleSeverityFilterChange('all')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">All Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(severityCounts.all)}</div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-lg ${
            severityFilter === 'critical' ? 'ring-2 ring-red-500' : ''
          }`}
          onClick={() => handleSeverityFilterChange('critical')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {formatNumber(severityCounts.critical)}
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-lg ${
            severityFilter === 'high' ? 'ring-2 ring-orange-500' : ''
          }`}
          onClick={() => handleSeverityFilterChange('high')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {formatNumber(severityCounts.high)}
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-lg ${
            severityFilter === 'medium' ? 'ring-2 ring-yellow-500' : ''
          }`}
          onClick={() => handleSeverityFilterChange('medium')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {formatNumber(severityCounts.medium)}
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:shadow-lg ${
            severityFilter === 'low' ? 'ring-2 ring-green-500' : ''
          }`}
          onClick={() => handleSeverityFilterChange('low')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {formatNumber(severityCounts.low)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search alerts by description, agent, or rule ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              {/* Time Range Selector */}
              <div className="relative">
                <select
                  value={timeRange}
                  onChange={(e) => handleTimeRangeChange(e.target.value as TimeRange)}
                  className="px-4 py-2 pr-10 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                >
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
                <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
              >
                <Filter className="h-4 w-4" />
                More Filters
                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Custom Date Range */}
            {timeRange === 'custom' && (
              <div className="pt-4 border-t">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium mb-2 block">From Date & Time</label>
                    <input
                      type="datetime-local"
                      value={customDateFrom}
                      onChange={(e) => {
                        setCustomDateFrom(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">To Date & Time</label>
                    <input
                      type="datetime-local"
                      value={customDateTo}
                      onChange={(e) => {
                        setCustomDateTo(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Extended Filters */}
            {showFilters && (
              <div className="pt-4 border-t space-y-3">
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Rule ID</label>
                    <input
                      type="text"
                      placeholder="e.g., 5710"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Agent</label>
                    <input
                      type="text"
                      placeholder="Agent name or ID"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Min Level</label>
                    <input
                      type="number"
                      placeholder="0-15"
                      min="0"
                      max="15"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedAlerts.length > 0 && (
        <Card className="border-primary">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                {selectedAlerts.length} alert{selectedAlerts.length !== 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded transition-colors">
                  Mark as Read
                </button>
                <button className="px-3 py-1.5 text-sm bg-secondary hover:bg-secondary/80 rounded transition-colors">
                  Archive
                </button>
                <button className="px-3 py-1.5 text-sm bg-destructive/10 hover:bg-destructive/20 text-destructive rounded transition-colors">
                  Delete
                </button>
                <button
                  onClick={() => setSelectedAlerts([])}
                  className="px-3 py-1.5 text-sm hover:bg-secondary rounded transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Alerts
              <span className="text-sm font-normal text-muted-foreground ml-2">
                Showing {formatNumber(startItem)}-{formatNumber(endItem)} of {formatNumber(totalAlerts)} results
              </span>
            </CardTitle>
            {filteredAlerts.length > 0 && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedAlerts.length === filteredAlerts.length && filteredAlerts.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-border"
                />
                Select All
              </label>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No alerts found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your filters or time range
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAlerts.map((alert: any) => {
                const severity = getSeverityFromLevel(alert._source.rule.level);
                const isSelected = selectedAlerts.includes(alert._id);

                return (
                  <div
                    key={alert._id}
                    className={`flex items-start gap-4 p-4 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent/50'
                    }`}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectAlert(alert._id)}
                      className="mt-1 w-4 h-4 rounded border-border cursor-pointer"
                    />

                    {/* Severity Badge */}
                    <div className="flex-shrink-0 mt-0.5">
                      <Badge
                        variant={severity as any}
                        className={getSeverityBgColor(severity)}
                      >
                        {alert._source.rule.level}
                      </Badge>
                    </div>

                    {/* Alert Content */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/alerts/${alert._id}`}
                        className="block hover:underline"
                      >
                        <p className="text-sm font-semibold">
                          {alert._source.rule.description}
                        </p>
                      </Link>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Server className="h-3 w-3" />
                          {alert._source.agent.name}
                        </span>
                        <span>Rule: {alert._source.rule.id}</span>
                        {alert._source.rule.mitre && alert._source.rule.mitre.id && (
                          <span>MITRE: {alert._source.rule.mitre.id.join(', ')}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(alert._source.timestamp)}
                        </span>
                      </div>
                      {alert._source.full_log && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                            View full log
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {alert._source.full_log}
                          </pre>
                        </details>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(alert._source.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalAlerts > 0 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages || isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
