'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useReactToPrint } from 'react-to-print';
import { Printer, Send, Eye, Search } from 'lucide-react';
import PrintBill from '@/components/billing/PrintBill';
import { formatCurrency, formatDateTime } from '@/utils/helpers';

export default function OrdersPage() {
  const [orders, setOrders]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch]         = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({ content: () => printRef.current });

  useEffect(() => {
    setLoading(true);
    axios.get('/orders', { params: { date: selectedDate, limit: 100 } })
      .then(({ data }) => setOrders(data.orders || []))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, [selectedDate]);

  const sendWhatsApp = (order) => {
    if (!order.customerPhone) return toast.error('No phone number');
    const msg = `🍽️ *JK Spicy Dosa Cafe*\nBill: ${order.billNumber}\nTotal: ₹${order.finalTotal}\nThank you! 🙏`;
    window.open(`https://wa.me/91${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filtered = orders.filter((o) =>
    o.billNumber?.toLowerCase().includes(search.toLowerCase()) ||
    o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    o.customerPhone?.includes(search)
  );

  const totalRevenue = filtered.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.finalTotal, 0);

  const STATUS_COLORS = {
    active:    'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
    'kot-sent':'bg-blue-100 text-blue-700',
  };

  return (
    <div className="space-y-4">
      {/* Hidden print */}
      <div className="hidden">
        <PrintBill ref={printRef} order={selectedOrder} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400" />
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Search bill, customer, phone..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 bg-card border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400" />
        </div>
        <div className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-xl text-sm font-bold">
          Total: {formatCurrency(totalRevenue)} ({filtered.filter((o) => o.status !== 'cancelled').length} orders)
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-accent/50">
              <tr>
                {['Bill No', 'Customer', 'Type', 'Items', 'Total', 'Payment', 'Status', 'Time', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">Loading orders…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-muted-foreground">No orders found</td></tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order._id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-orange-600 text-xs">{order.billNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-xs text-muted-foreground">{order.customerPhone || '—'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs capitalize">{order.tableNumber ? `🪑 T${order.tableNumber}` : '📦'} {order.orderType}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{order.items?.length} items</td>
                    <td className="px-4 py-3 font-bold">{formatCurrency(order.finalTotal)}</td>
                    <td className="px-4 py-3 text-xs uppercase font-medium">{order.paymentMode}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => { setSelectedOrder(order); setTimeout(handlePrint, 100); }}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:hover:bg-blue-950/60 transition-colors" title="Print">
                          <Printer size={14} />
                        </button>
                        <button onClick={() => sendWhatsApp(order)}
                          className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600 dark:bg-green-950/30 transition-colors" title="WhatsApp">
                          <Send size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
