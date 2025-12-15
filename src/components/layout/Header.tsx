
'use client';

import { Bell, Moon, Sun, User } from 'lucide-react';
import { useThemeStore } from '@/lib/store/theme-store';

export default function Header() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold">Dashboard</h2>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-accent rounded-lg transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        <button className="p-2 hover:bg-accent rounded-lg transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
        </button>

        <button className="p-2 hover:bg-accent rounded-lg transition-colors">
          <User className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}

