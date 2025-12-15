'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/auth-context';
import { LogOut, User, Settings, Shield } from 'lucide-react';

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
        <div className="text-left hidden md:block">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.role}</p>
        </div>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-background border rounded-lg shadow-lg z-50">
            <div className="p-3 border-b">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <div className="p-2">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-left">
                <Settings className="h-4 w-4" />
                <span className="text-sm">Settings</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary transition-colors text-left">
                <Shield className="h-4 w-4" />
                <span className="text-sm">Security</span>
              </button>
            </div>
            <div className="p-2 border-t">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors text-left"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
