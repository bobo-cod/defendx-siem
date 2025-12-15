
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatPercentage(value: number, total: number): string {
  if (total === 0) return '0%';
  return ((value / total) * 100).toFixed(1) + '%';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function getAgentStatusColor(
  status: 'active' | 'disconnected' | 'never_connected' | 'pending'
): string {
  const colors = {
    active: 'text-green-500',
    disconnected: 'text-red-500',
    never_connected: 'text-gray-500',
    pending: 'text-yellow-500',
  };
  return colors[status] || 'text-gray-500';
}

export function getAgentStatusBadge(
  status: 'active' | 'disconnected' | 'never_connected' | 'pending'
): string {
  const badges = {
    active: 'bg-green-500/10 text-green-500 border-green-500/20',
    disconnected: 'bg-red-500/10 text-red-500 border-red-500/20',
    never_connected: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  };
  return badges[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
}

