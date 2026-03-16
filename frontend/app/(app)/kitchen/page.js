'use client';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Clock, CheckCircle, ChefHat, RefreshCw, Timer } from 'lucide-react';
import { formatDateTime } from '@/utils/helpers';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   color: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20', badge: 'bg-yellow-100 text-yellow-800', next: 'preparing', nextLabel: '🔥 Start Cooking' },
  preparing: { label: 'Preparing', color: 'border-blue-400 bg-blue-50 dark:bg-blue-950/20',       badge: 'bg-blue-100 text-blue-800',   next: 'ready',     nextLabel: '✅ Mark Ready' },
  ready:     { label: 'Ready',     color: 'border-green-400 bg-green-50 dark:bg-green-950/20',     badge: 'bg-green-100 text-green-800', next: 'served',    nextLabel: '🍽️ Served' },
};

function ElapsedTime({ createdAt }) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = Math.floor((Date.now() - new Date(createdAt)) / 1000);
      const m = Math.floor(diff / 60), s = diff % 60;
      setElapsed(`${m}:${String(s).padStart(2, '0')}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [createdAt]);
  const mins = Math.floor((Date.now() - new Date(createdAt)) / 60000);
  return (
    <span className={`flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-full
      ${mins >= 10 ? 'bg-red-100 text-red-700' : mins >= 5 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
      <Timer size={11} /> {elapsed}
    </span>
  );
}

export default function KitchenPage() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchOrders = useCallback(() => {
    axios.get('/kitchen/orders').then(({ data }) => {
      setOrders(data.orders || []);
      setLastUpdate(new Date());
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Poll every 15 seconds
  useEffect(() => {
    fetchOrders();
    const id = setInterval(fetchOrders, 15000);
    return () => clearInterval(id);
  }, [fetchOrders]);

  const updateStatus = async (orderId, newStatus) => {
    try {
      await axios.patch(`/kitchen/orders/${orderId}`, { kitchenStatus: newStatus });
      if (newStatus === 'served') {
        await axios.patch(`/orders/${orderId}/status`, { status: 'completed' });
        setOrders((prev) => prev.filter((o) => o._id !== orderId));
        toast.success('Order served!');
      } else {
        setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, kitchenStatus: newStatus } : o));
        toast.success(`Status → ${newStatus}`);
      }
    } catch {
      toast.error('Update failed');
    }
  };

  const pendingOrders   = orders.filter((o) => o.kitchenStatus === 'pending');
  const preparingOrders = orders.filter((o) => o.kitchenStatus === 'preparing');
  const readyOrders     = orders.filter((o) => o.kitchenStatus === 'ready');

  const Column = ({ title, orders: colOrders, icon: Icon, headerColor }) => (
    <div className="flex-1 min-w-0">
      <div className={`flex items-center justify-between px-4 py-3 rounded-xl mb-3 ${headerColor}`}>
        <div className="flex items-center gap-2 font-bold text-sm">
          <Icon size={16} />
          {title}
        </div>
        <span className="bg-white/30 text-xs font-bold px-2 py-0.5 rounded-full">{colOrders.length}</span>
      </div>
      <div className="space-y-3">
        {colOrders.map((order) => {
          const cfg = STATUS_CONFIG[order.kitchenStatus];
          return (
            <div key={order._id} className={`border-2 rounded-xl p-4 ${cfg.color} shadow-sm`}>
              {/* KOT Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="font-black text-base">{order.billNumber}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {order.orderType === 'dine-in' ? `🪑 Table ${order.tableNumber}` : '📦 Parcel'}
                    {order.customerName && order.customerName !== 'Walk-in Customer' && ` · ${order.customerName}`}
                  </div>
                </div>
                <ElapsedTime createdAt={order.createdAt} />
              </div>

              {/* Items */}
              <div className="space-y-1 mb-3">
                {order.items?.map((item, i) => (
                  <div key={i} className={`flex items-center gap-3 text-sm py-1.5 px-2 rounded-lg
                    ${item.kdsStatus === 'ready' ? 'line-through opacity-40 bg-green-50' : 'bg-white/60 dark:bg-black/10'}`}>
                    <span className="w-6 h-6 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {item.quantity}
                    </span>
                    <span className="font-medium flex-1">{item.name}</span>
                    {item.notes && <span className="text-xs text-orange-600 italic">{item.notes}</span>}
                  </div>
                ))}
              </div>

              {/* Action Button */}
              {cfg.next && (
                <button
                  onClick={() => updateStatus(order._id, cfg.next)}
                  className={`w-full py-2 rounded-lg text-sm font-bold transition-all
                    ${order.kitchenStatus === 'pending'   ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                      order.kitchenStatus === 'preparing' ? 'bg-green-500 hover:bg-green-600 text-white' :
                      'bg-gray-800 hover:bg-black text-white'}`}
                >
                  {cfg.nextLabel}
                </button>
              )}
            </div>
          );
        })}
        {colOrders.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <ChefHat size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No orders</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <ChefHat className="text-orange-500" size={24} /> Kitchen Display System
          </h1>
          <p className="text-xs text-muted-foreground">Updated: {lastUpdate.toLocaleTimeString()}</p>
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-all">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-y-auto">
          <Column title="🔴 Pending"   orders={pendingOrders}   icon={Clock}        headerColor="bg-yellow-100 dark:bg-yellow-950/30 text-yellow-800 dark:text-yellow-300" />
          <Column title="🔵 Preparing" orders={preparingOrders} icon={ChefHat}      headerColor="bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300" />
          <Column title="🟢 Ready"     orders={readyOrders}     icon={CheckCircle}  headerColor="bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-300" />
        </div>
      )}
    </div>
  );
}
