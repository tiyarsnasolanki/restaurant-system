'use client';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Bell } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/billing': '🧾 New Bill',
  '/orders': '📋 Orders',
  '/kitchen': '👨‍🍳 Kitchen Display',
  '/menu': '🍽️ Menu Management',
  '/expenses': '💸 Expenses',
  '/reports': '📊 Reports',
  '/reservations': '📅 Reservations',
  '/inventory': '📦 Inventory',
  '/staff': '👥 Staff',
  '/qr-menu': '📱 QR Menu',
};

export default function TopBar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [todaySummary, setTodaySummary] = useState(null);

  useEffect(() => {
    axios.get('/orders/summary/today').then(({ data }) => setTodaySummary(data)).catch(() => {});
  }, [pathname]);

  const title = PAGE_TITLES[pathname] || 'JK Spicy Dosa';
  const now = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
      <div className="flex items-center gap-4 lg:gap-0">
        <div className="lg:block">
          <h1 className="text-lg font-bold text-foreground ml-12 lg:ml-0">{title}</h1>
          <p className="text-xs text-muted-foreground hidden sm:block">{now}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-3">
        {/* Today's quick stats */}
        {todaySummary && (
          <div className="hidden md:flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-3 py-1.5 rounded-lg">
              <span className="font-bold">₹{todaySummary.totalRevenue?.toLocaleString('en-IN')}</span>
              <span className="text-xs opacity-70">today</span>
            </div>
            <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 px-3 py-1.5 rounded-lg">
              <span className="font-bold">{todaySummary.totalOrders}</span>
              <span className="text-xs opacity-70">orders</span>
            </div>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl bg-accent hover:bg-accent/80 flex items-center justify-center transition-colors"
        >
          {theme === 'dark' ? <Sun size={16} className="text-foreground" /> : <Moon size={16} className="text-foreground" />}
        </button>
      </div>
    </header>
  );
}
