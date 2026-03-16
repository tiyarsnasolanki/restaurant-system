'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Search, Plus, Minus, Trash2, Printer, Send, ShoppingCart, X, ChevronDown } from 'lucide-react';
import PrintBill from '@/components/billing/PrintBill';
import { calculateBill, formatCurrency, PAYMENT_MODES, ORDER_TYPES, MENU_CATEGORIES } from '@/utils/helpers';

const GST_OPTIONS = [0, 5, 12, 18];

export default function BillingPage() {
  const [menuItems, setMenuItems]       = useState([]);
  const [cart, setCart]                 = useState([]);
  const [search, setSearch]             = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [orderType, setOrderType]       = useState('dine-in');
  const [tableNumber, setTableNumber]   = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMode, setPaymentMode]   = useState('cash');
  const [gstPct, setGstPct]             = useState(5);
  const [discountPct, setDiscountPct]   = useState(0);
  const [invoiceType, setInvoiceType]   = useState('bill');
  const [gstin, setGstin]               = useState('');
  const [amountPaid, setAmountPaid]     = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [showBill, setShowBill]         = useState(false);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [isOnline, setIsOnline]         = useState(true);

  const printRef = useRef(null);

  // Online/Offline detection
  useEffect(() => {
    const onOnline  = () => { setIsOnline(true);  syncOfflineOrders(); };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  // Load menu
  useEffect(() => {
    axios.get('/menu').then(({ data }) => {
      setMenuItems(data.items || []);
    }).catch(() => {
      // Try from localStorage cache
      const cached = localStorage.getItem('jk_menu_cache');
      if (cached) setMenuItems(JSON.parse(cached));
      toast.error('Using cached menu (offline)');
    });
  }, []);

  // Cache menu for offline
  useEffect(() => {
    if (menuItems.length > 0) localStorage.setItem('jk_menu_cache', JSON.stringify(menuItems));
  }, [menuItems]);

  const syncOfflineOrders = useCallback(async () => {
    const queue = JSON.parse(localStorage.getItem('jk_offline_orders') || '[]');
    if (queue.length === 0) return;
    toast(`Syncing ${queue.length} offline order(s)...`);
    for (const order of queue) {
      try {
        await axios.post('/orders', order);
      } catch {}
    }
    localStorage.removeItem('jk_offline_orders');
    toast.success('Offline orders synced!');
  }, []);

  const handlePrint = useReactToPrint({ content: () => printRef.current });

  // Cart operations
  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((c) => c._id === item._id);
      if (existing) return prev.map((c) => c._id === item._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((c) => c._id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c)
          .filter((c) => c.quantity > 0)
    );
  };

  const removeItem = (id) => setCart((prev) => prev.filter((c) => c._id !== id));
  const clearCart  = () => { setCart([]); setCurrentOrder(null); setShowBill(false); };

  // Bill calculations
  const { subtotal, discountAmount, gstAmount, finalTotal } = calculateBill(cart, gstPct, discountPct);
  const change = amountPaid ? Math.max(0, Number(amountPaid) - finalTotal) : 0;

  // Filter menu
  const categories = ['All', ...new Set(menuItems.map((m) => m.category))];
  const filtered = menuItems.filter((m) => {
    const matchCat  = activeCategory === 'All' || m.category === activeCategory;
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Submit order
  const submitOrder = async () => {
    if (cart.length === 0) return toast.error('Add items to cart first');
    if (orderType === 'dine-in' && !tableNumber) return toast.error('Table number required for Dine-In');

    setSubmitting(true);
    const orderData = {
      customerName: customerName || 'Walk-in Customer',
      customerPhone,
      tableNumber,
      orderType,
      items: cart.map((i) => ({ menuItemId: i._id, name: i.name, price: i.price, quantity: i.quantity })),
      gstPercentage: gstPct,
      discountPercentage: discountPct,
      paymentMode,
      invoiceType,
      gstin: invoiceType === 'tax-invoice' ? gstin : '',
      amountPaid: amountPaid || finalTotal,
    };

    try {
      if (!isOnline) throw new Error('offline');
      const { data } = await axios.post('/orders', orderData);
      setCurrentOrder(data.order);
      setShowBill(true);
      toast.success(`✅ Bill #${data.order.billNumber} created!`);
    } catch (err) {
      if (!isOnline || err.message === 'offline') {
        // Save to offline queue
        const queue = JSON.parse(localStorage.getItem('jk_offline_orders') || '[]');
        const offlineOrder = { ...orderData, billNumber: `OFFLINE-${Date.now()}`, offlineId: Date.now() };
        queue.push(offlineOrder);
        localStorage.setItem('jk_offline_orders', JSON.stringify(queue));
        setCurrentOrder({ ...offlineOrder, items: cart, subtotal, gstAmount, discountAmount, finalTotal, createdAt: new Date() });
        setShowBill(true);
        toast('📴 Saved offline — will sync when online', { icon: '⚠️' });
      } else {
        toast.error('Failed to create order');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const sendWhatsApp = () => {
    if (!customerPhone) return toast.error('Enter customer phone number');
    const msg = `🍽️ *JK Spicy Dosa Cafe*\n\nBill No: ${currentOrder?.billNumber}\nTable: ${tableNumber || 'Parcel'}\nItems: ${cart.length}\n*Total: ₹${finalTotal}*\n\nThank you for visiting! 🙏`;
    const url = `https://wa.me/91${customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const sendSMS = async () => {
    if (!currentOrder?._id) return toast.error('Save the order first');
    try {
      await axios.post(`/orders/${currentOrder._id}/send-bill`);
      toast.success('Bill sent via SMS!');
    } catch {
      toast.error('SMS failed');
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 -m-4 lg:-m-6 p-4 lg:p-6">
      {/* Hidden print area */}
      <div className="hidden">
        <PrintBill ref={printRef} order={currentOrder ? { ...currentOrder, items: cart, subtotal, gstAmount, discountAmount, finalTotal, gstPercentage: gstPct, discountPercentage: discountPct, paymentMode, orderType, tableNumber, customerName, customerPhone } : null} />
      </div>

      {/* ── LEFT: Menu Panel ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 bg-card border border-border rounded-2xl overflow-hidden">
        {/* Search & Category filter */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-orange-400"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                  ${activeCategory === cat ? 'bg-orange-500 text-white' : 'bg-accent text-muted-foreground hover:bg-accent/80'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map((item) => {
              const inCart = cart.find((c) => c._id === item._id);
              return (
                <button
                  key={item._id}
                  onClick={() => addToCart(item)}
                  className={`relative p-3 rounded-xl border-2 text-left transition-all hover:scale-[1.02] active:scale-[0.98]
                    ${inCart ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' : 'border-border bg-background hover:border-orange-300'}`}
                >
                  {inCart && (
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {inCart.quantity}
                    </span>
                  )}
                  <div className="text-lg mb-1">🍽️</div>
                  <p className="text-xs font-semibold text-foreground leading-tight line-clamp-2">{item.name}</p>
                  <p className="text-sm font-bold text-orange-600 mt-1">₹{item.price}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.category}</p>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                <div className="text-4xl mb-2">🔍</div>
                <p>No items found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Order/Bill Panel ───────────────────────── */}
      <div className="w-full lg:w-[420px] flex flex-col gap-3 min-h-0">
        {/* Order Details */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex gap-2">
            {ORDER_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setOrderType(t.value)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all
                  ${orderType === t.value ? 'bg-orange-500 text-white' : 'bg-accent text-muted-foreground'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {orderType === 'dine-in' && (
              <input placeholder="Table No *" value={tableNumber} onChange={(e) => setTableNumber(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-orange-400" />
            )}
            <input placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-orange-400" />
            <input placeholder="Phone Number" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-orange-400" />
          </div>
        </div>

        {/* Cart */}
        <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden flex flex-col min-h-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <ShoppingCart size={16} className="text-orange-500" />
              Cart ({cart.length})
            </h2>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                <X size={12} /> Clear
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">Tap items to add to cart</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item._id} className="flex items-center gap-2 py-2 border-b border-border/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateQty(item._id, -1)} className="w-6 h-6 rounded-full bg-accent flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-950">
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQty(item._id, 1)} className="w-6 h-6 rounded-full bg-accent flex items-center justify-center hover:bg-green-100 dark:hover:bg-green-950">
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="w-16 text-right text-sm font-semibold text-foreground">₹{item.price * item.quantity}</span>
                    <button onClick={() => removeItem(item._id)} className="text-red-400 hover:text-red-600 ml-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bill Summary */}
          {cart.length > 0 && (
            <div className="border-t border-border p-4 space-y-3">
              {/* GST & Discount controls */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">GST %</label>
                  <select value={gstPct} onChange={(e) => setGstPct(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none">
                    {GST_OPTIONS.map((g) => <option key={g} value={g}>{g}%</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Discount %</label>
                  <input type="number" min="0" max="100" value={discountPct} onChange={(e) => setDiscountPct(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-background border border-border rounded-lg text-sm focus:outline-none" />
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({discountPct}%)</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>GST ({gstPct}%)</span>
                  <span>₹{gstAmount}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-foreground pt-1 border-t border-border">
                  <span>Total</span>
                  <span className="text-orange-600">₹{finalTotal}</span>
                </div>
              </div>

              {/* Payment Mode */}
              <div className="flex gap-2">
                {PAYMENT_MODES.map((m) => (
                  <button key={m.value} onClick={() => setPaymentMode(m.value)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all
                      ${paymentMode === m.value ? 'bg-orange-500 text-white' : 'bg-accent text-muted-foreground'}`}>
                    {m.label}
                  </button>
                ))}
              </div>

              {paymentMode === 'cash' && (
                <input type="number" placeholder="Amount received" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-orange-400" />
              )}
              {change > 0 && (
                <div className="bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm font-bold text-center py-1.5 rounded-lg">
                  Change: ₹{change}
                </div>
              )}

              {/* Invoice Type */}
              <div className="flex gap-2">
                <button onClick={() => setInvoiceType('bill')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${invoiceType === 'bill' ? 'bg-blue-500 text-white' : 'bg-accent text-muted-foreground'}`}>
                  Receipt
                </button>
                <button onClick={() => setInvoiceType('tax-invoice')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${invoiceType === 'tax-invoice' ? 'bg-blue-500 text-white' : 'bg-accent text-muted-foreground'}`}>
                  GST Invoice
                </button>
              </div>
              {invoiceType === 'tax-invoice' && (
                <input placeholder="Customer GSTIN" value={gstin} onChange={(e) => setGstin(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-orange-400" />
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <button onClick={submitOrder} disabled={submitting}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20">
                  {submitting ? '⏳ Processing…' : `✅ Bill ₹${finalTotal}`}
                </button>
                {showBill && (
                  <div className="flex gap-2">
                    <button onClick={handlePrint} className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-all">
                      <Printer size={16} /> Print
                    </button>
                    <button onClick={sendWhatsApp} className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-all">
                      <Send size={16} /> WhatsApp
                    </button>
                    <button onClick={sendSMS} className="flex-1 flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-all">
                      <Send size={16} /> SMS
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Offline indicator */}
        {!isOnline && (
          <div className="bg-amber-100 dark:bg-amber-950 border border-amber-300 rounded-xl p-3 text-center text-xs text-amber-700 dark:text-amber-300 font-medium">
            📴 Offline Mode — Bills will sync when connected
          </div>
        )}
      </div>
    </div>
  );
}
