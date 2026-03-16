'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, UtensilsCrossed, TrendingUp,
  CalendarDays, Package, ChefHat, Users, Settings, LogOut,
  Menu, X, QrCode, Warehouse,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'staff'] },
  { href: '/billing', label: 'New Bill / POS', icon: ShoppingCart, roles: ['admin', 'staff'] },
  { href: '/orders', label: 'Orders', icon: UtensilsCrossed, roles: ['admin', 'staff'] },
  { href: '/kitchen', label: 'Kitchen (KDS)', icon: ChefHat, roles: ['admin', 'staff'] },
  { href: '/menu', label: 'Menu', icon: UtensilsCrossed, roles: ['admin'] },
  { href: '/expenses', label: 'Expenses', icon: TrendingUp, roles: ['admin'] },
  { href: '/reports', label: 'Reports', icon: TrendingUp, roles: ['admin'] },
  { href: '/reservations', label: 'Reservations', icon: CalendarDays, roles: ['admin', 'staff'] },
  { href: '/inventory', label: 'Inventory', icon: Warehouse, roles: ['admin'] },
  { href: '/staff', label: 'Staff', icon: Users, roles: ['admin'] },
  { href: '/qr-menu', label: 'QR Menu', icon: QrCode, roles: ['admin'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = navItems.filter((i) => i.roles.includes(user?.role));

  const NavLink = ({ item }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
          ${isActive
            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
      >
        <item.icon size={18} className={isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'} />
        {item.label}
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-black text-white">JK</span>
        </div>
        <div>
          <p className="font-bold text-foreground text-sm leading-tight">JK Spicy Dosa</p>
          <p className="text-xs text-muted-foreground">POS System</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => <NavLink key={item.href} item={item} />)}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-950 rounded-full flex items-center justify-center">
            <span className="text-orange-600 font-bold text-sm">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 border-r border-border bg-card flex-col flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-card flex flex-col border-r border-border shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-accent flex items-center justify-center"
            >
              <X size={16} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
