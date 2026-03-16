'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { formatCurrency } from '@/utils/helpers';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function ReportsPage() {
  const [tab, setTab]         = useState('monthly');
  const [year, setYear]       = useState(new Date().getFullYear());
  const [month, setMonth]     = useState(new Date().getMonth() + 1);
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData]       = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const fetchers = {
      daily:   () => axios.get(`/reports/daily?date=${dailyDate}`),
      monthly: () => axios.get(`/reports/monthly?year=${year}&month=${month}`),
      yearly:  () => axios.get(`/reports/yearly?year=${year}`),
    };
    fetchers[tab]().then(({ data: d }) => setData(d)).finally(() => setLoading(false));
    axios.get('/reports/top-items?days=30').then(({ data: d }) => setTopItems(d.topItems || []));
  }, [tab, year, month, dailyDate]);

  const StatCard = ({ label, value, sub, color = 'text-foreground' }) => (
    <div className="bg-card border border-border rounded-2xl p-5">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        {['daily', 'monthly', 'yearly'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all
              ${tab === t ? 'bg-orange-500 text-white' : 'bg-card border border-border text-muted-foreground hover:bg-accent'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 items-center">
        {tab === 'daily' && (
          <input type="date" value={dailyDate} onChange={(e) => setDailyDate(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none" />
        )}
        {(tab === 'monthly' || tab === 'yearly') && (
          <select value={year} onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none">
            {[2024, 2025, 2026].map((y) => <option key={y}>{y}</option>)}
          </select>
        )}
        {tab === 'monthly' && (
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none">
            {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
          </select>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Sales" value={formatCurrency(data.totalSales || 0)} color="text-green-600" sub={`${data.totalOrders} orders`} />
            <StatCard label="Total Expenses" value={formatCurrency(data.totalExpenses || 0)} color="text-red-500" />
            <StatCard label="Net Profit" value={formatCurrency((data.totalSales || 0) - (data.totalExpenses || 0))} color={(data.totalSales - data.totalExpenses) >= 0 ? 'text-green-600' : 'text-red-500'} />
            <StatCard label="Avg per Order" value={data.totalOrders ? formatCurrency(Math.round((data.totalSales || 0) / data.totalOrders)) : '₹0'} />
          </div>

          {/* Main Chart */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold mb-4">Sales vs Expenses vs Profit</h2>
            <ResponsiveContainer width="100%" height={300}>
              {tab === 'yearly' ? (
                <BarChart data={data.chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="sales" fill="#E85D04" name="Sales" radius={[4,4,0,0]} />
                  <Bar dataKey="expenses" fill="#DC2626" name="Expenses" radius={[4,4,0,0]} />
                  <Bar dataKey="profit" fill="#16A34A" name="Profit" radius={[4,4,0,0]} />
                </BarChart>
              ) : (
                <AreaChart data={data.chartData || []}>
                  <defs>
                    <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E85D04" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#E85D04" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                  <XAxis dataKey={tab === 'monthly' ? 'day' : 'month'} tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Legend />
                  <Area type="monotone" dataKey="sales" stroke="#E85D04" fill="url(#gs)" strokeWidth={2} name="Sales" />
                  <Area type="monotone" dataKey="profit" stroke="#16A34A" fill="url(#gp)" strokeWidth={2} name="Profit" />
                  <Line type="monotone" dataKey="expenses" stroke="#DC2626" strokeWidth={2} dot={false} name="Expenses" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Top Items */}
          {tab !== 'daily' && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold mb-4">Top Selling Items (Last 30 days)</h2>
              <div className="space-y-3">
                {topItems.slice(0, 8).map((item, i) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-orange-100 dark:bg-orange-950 text-orange-600 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5 mt-1">
                        <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (item.qty / (topItems[0]?.qty || 1)) * 100)}%` }} />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{item.qty} sold</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(item.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily orders list */}
          {tab === 'daily' && data.orders && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border"><h2 className="font-semibold">Today's Orders</h2></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-accent/50">
                    <tr>{['Bill No', 'Customer', 'Items', 'Total', 'Payment', 'Status'].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.orders.map((o) => (
                      <tr key={o._id} className="hover:bg-accent/30">
                        <td className="px-4 py-2.5 font-mono text-xs text-orange-600 font-bold">{o.billNumber}</td>
                        <td className="px-4 py-2.5">{o.customerName}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{o.items?.length} items</td>
                        <td className="px-4 py-2.5 font-bold">{formatCurrency(o.finalTotal)}</td>
                        <td className="px-4 py-2.5 text-xs uppercase">{o.paymentMode}</td>
                        <td className="px-4 py-2.5"><span className="text-xs bg-accent px-2 py-0.5 rounded-full">{o.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment Breakdown */}
          {tab === 'daily' && data.paymentBreakdown && (
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(data.paymentBreakdown).map(([mode, amount]) => (
                <div key={mode} className="bg-card border border-border rounded-2xl p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{formatCurrency(amount)}</p>
                  <p className="text-sm text-muted-foreground uppercase mt-1">{mode}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
