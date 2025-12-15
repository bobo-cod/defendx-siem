
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard,
  Server,
  AlertTriangle,
  Shield,
  FileSearch,
  Bug,
  Network,
  Search,
  BarChart3,
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { useState } from 'react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/overview' },
  { icon: Server, label: 'Agents', href: '/agents' },
  { icon: AlertTriangle, label: 'Alerts', href: '/alerts' },
  { icon: Shield, label: 'MITRE ATT&CK', href: '/mitre' },
  { icon: FileSearch, label: 'File Integrity', href: '/fim' },
  { icon: Bug, label: 'Vulnerabilities', href: '/vulnerabilities' },
  { icon: Network, label: 'Network', href: '/network' },
  { icon: Search, label: 'Threat Intelligence', href: '/threat-intel' },
  { icon: BarChart3, label: 'Dashboards', href: '/dashboards' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'bg-card border-r border-border transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="font-bold text-lg">DEFENDX</h1>
              <p className="text-xs text-muted-foreground">SIEM Platform</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
        >
          <ChevronLeft
            className={cn(
              'h-4 w-4 transition-transform',
              collapsed && 'rotate-180'
            )}
          />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                'hover:bg-accent',
                isActive && 'bg-primary text-primary-foreground',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors hover:bg-accent',
            collapsed && 'justify-center'
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Settings</span>}
        </Link>
      </div>
    </aside>
  );
}

