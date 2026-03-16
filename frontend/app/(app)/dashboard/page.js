'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, ShoppingBag, IndianRupee, Users, ArrowUpRight, ChefHat, Package, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/utils/helpers';
import Link from 'next/link';

const COLORS = ['#E85D04', '#DC2626', '#2563EB', '#16A34A', '#7C3AED'];

export default function DashboardPage() {
  const [daily, setDaily]     = useState(null);
  const [monthly, setMonthly] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [inventory, setInventory] = useState({ lowStock: [] });
  const [kitchenOrders, setKitchenOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const year  = new Date().getFullYear();
    const month = new Date().getMonth() + 1;

    Promise.all([
      axios.get(`/reports/daily?date=${today}`),
      axios.get(`/reports/monthly?year=${year}&month=${month}`),
      axios.get('/reports/top-items?days=30'),
      axios.get('/orders?limit=8'),
      axios.get('/inventory'),
      axios.get('/kitchen/orders'),
    ]).then(([d, m, t, o, inv, k]) => {
      setDaily(d.data);
      setMonthly(m.data);
      setTopItems(t.data.topItems || []);
      setRecentOrders(o.data.orders || []);
      setInventory(inv.data);
      setKitchenOrders(k.data.orders || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Today's Revenue",
      value: formatCurrency(daily?.totalSales || 0),
      icon: IndianRupee,
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/30',
      sub: `${daily?.totalOrders || 0} orders`,
    },
    {
      label: "Today's Profit",
      value: formatCurrency((daily?.totalSales || 0) - (daily?.totalExpenses || 0)),
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      sub: `Expenses: ${formatCurrency(daily?.totalExpenses || 0)}`,
    },
    {
      label: 'Monthly Revenue',
      value: formatCurrency(monthly?.totalSales || 0),
      icon: ShoppingBag,
      color: 'text-orange-600',
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      sub: `${monthly?.totalOrders || 0} orders this month`,
    },
    {
      label: 'Kitchen Queue',
      value: kitchenOrders.length,
      icon: ChefHat,
      color: 'text-purple-600',
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      sub: 'Active orders',
      href: '/kitchen',
    },
  ];

  const paymentData = Object.entries(daily?.paymentBreakdown || {}).map(([name, value]) => ({ name: name.toUpperCase(), value }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Low Stock Alert */}
      {inventory.lowStock?.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Low Stock Alert</p>
            <p className="text-amber-700 dark:text-amber-400 text-xs">
              {inventory.lowStock.map((i) => i.name).join(', ')} — running low
            </p>
          </div>
          <Link href="/inventory" className="ml-auto text-xs text-amber-700 dark:text-amber-400 underline font-medium">View</Link>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Link key={s.label} href={s.href || '#'} className="bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>
                <s.icon size={20} className={s.color} />
              </div>
              <ArrowUpRight size={14} className="text-muted-foreground mt-1" />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">{s.sub}</p>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Sales Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Monthly Sales & Profit</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthly?.chartData || []}>
              <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E85D04" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#E85D04" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Area type="monotone" dataKey="sales" stroke="#E85D04" fill="url(#colorSales)" strokeWidth={2} name="Sales" />
              <Area type="monotone" dataKey="profit" stroke="#16A34A" fill="url(#colorProfit)" strokeWidth={2} name="Profit" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Breakdown */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Payment Modes Today</h2>
          {paymentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={paymentData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No sales yet today</div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Items */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Top Selling Items (30 days)</h2>
          <div className="space-y-3">
            {topItems.slice(0, 6).map((item, i) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="w-6 h-6 bg-orange-100 dark:bg-orange-950 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-orange-500 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, (item.qty / (topItems[0]?.qty || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-foreground">{item.qty} sold</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(item.revenue)}</p>
                </div>
              </div>
            ))}
            {topItems.length === 0 && <p className="text-muted-foreground text-sm text-center py-6">No data available</p>}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Recent Orders</h2>
            <Link href="/orders" className="text-xs text-orange-500 hover:underline font-medium">View all</Link>
          </div>
          <div className="space-y-2">
            {recentOrders.slice(0, 6).map((order) => (
              <div key={order._id} className="flex items-center justify-between p-3 bg-accent/50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-foreground">{order.billNumber}</p>
                  <p className="text-xs text-muted-foreground">{order.customerName} · {order.orderType}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{formatCurrency(order.finalTotal)}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${order.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' :
                      order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && <p className="text-muted-foreground text-sm text-center py-6">No orders today</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
