
import { AlertSeverity } from '@/types/wazuh';

export function getSeverityFromLevel(level: number): AlertSeverity {
  if (level >= 12) return 'critical';
  if (level >= 9) return 'high';
  if (level >= 5) return 'medium';
  if (level >= 3) return 'low';
  return 'info';
}

export function getSeverityColor(severity: AlertSeverity): string {
  const colors = {
    critical: '#dc2626',
    high: '#f97316',
    medium: '#eab308',
    low: '#22c55e',
    info: '#3b82f6',
  };
  return colors[severity];
}

export function getSeverityBgColor(severity: AlertSeverity): string {
  const colors = {
    critical: 'bg-red-500/10 text-red-500 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    low: 'bg-green-500/10 text-green-500 border-green-500/20',
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };
  return colors[severity];
}

export function getSeverityLabel(severity: AlertSeverity): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

