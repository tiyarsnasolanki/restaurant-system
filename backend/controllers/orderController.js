const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const { sendBillSMS } = require('../utils/sms');

// Calculate bill totals
const calculateBill = (items, gstPercentage = 5, discountPercentage = 0) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountAmount = Math.round((subtotal * discountPercentage) / 100);
  const taxableAmount = subtotal - discountAmount;
  const gstAmount = Math.round((taxableAmount * gstPercentage) / 100);
  const finalTotal = taxableAmount + gstAmount;
  return { subtotal, discountAmount, gstAmount, finalTotal };
};

// POST /api/orders - Create new order
const createOrder = async (req, res) => {
  try {
    const {
      customerName, customerPhone, tableNumber,
      orderType, items, gstPercentage, discountPercentage,
      paymentMode, invoiceType, gstin,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No items in order' });
    }

    // Map items with totals
    const orderItems = items.map((item) => ({
      menuItem: item.menuItemId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      total: item.price * item.quantity,
      notes: item.notes || '',
    }));

    const gst = Number(gstPercentage) || 5;
    const discount = Number(discountPercentage) || 0;
    const { subtotal, discountAmount, gstAmount, finalTotal } = calculateBill(
      orderItems, gst, discount
    );

    const order = await Order.create({
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || '',
      tableNumber: tableNumber || '',
      orderType: orderType || 'dine-in',
      items: orderItems,
      subtotal,
      gstPercentage: gst,
      gstAmount,
      discountPercentage: discount,
      discountAmount,
      finalTotal,
      paymentMode: paymentMode || 'cash',
      amountPaid: finalTotal,
      invoiceType: invoiceType || 'bill',
      gstin: gstin || '',
      createdBy: req.user._id,
      kitchenStatus: 'pending',
    });

    res.status(201).json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders - List orders
const getOrders = async (req, res) => {
  try {
    const { date, status, limit = 50, page = 1 } = req.query;
    const filter = {};

    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    if (status) filter.status = status;

    const orders = await Order.find(filter)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Order.countDocuments(filter);

    res.json({ success: true, orders, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('createdBy', 'name');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/orders/:id/status
const updateOrderStatus = async (req, res) => {
  try {
    const { status, kitchenStatus, paymentMode, paymentStatus } = req.body;
    const update = {};
    if (status) update.status = status;
    if (kitchenStatus) update.kitchenStatus = kitchenStatus;
    if (paymentMode) update.paymentMode = paymentMode;
    if (paymentStatus) update.paymentStatus = paymentStatus;

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/orders/:id/send-bill
const sendBill = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!order.customerPhone) {
      return res.status(400).json({ success: false, message: 'No customer phone number' });
    }

    const message = `🍽️ JK Spicy Dosa Cafe\nBill No: ${order.billNumber}\nTable: ${order.tableNumber || 'Parcel'}\nTotal: ₹${order.finalTotal}\nThank you! Visit Again 🙏`;

    await sendBillSMS(order.customerPhone, message);
    await Order.findByIdAndUpdate(order._id, { billSentToCustomer: true });

    res.json({ success: true, message: 'Bill sent successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/orders/kitchen - KDS: Active kitchen orders
const getKitchenOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      kitchenStatus: { $in: ['pending', 'preparing'] },
      status: { $ne: 'cancelled' },
    }).sort({ createdAt: 1 });

    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PATCH /api/orders/:id/item-status - Update individual item KDS status
const updateItemStatus = async (req, res) => {
  try {
    const { itemIndex, kdsStatus } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.items[itemIndex].kdsStatus = kdsStatus;

    // If all items ready, update overall kitchen status
    const allReady = order.items.every((i) => i.kdsStatus === 'ready' || i.kdsStatus === 'served');
    if (allReady) order.kitchenStatus = 'ready';

    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Today's active orders summary (for dashboard)
const getTodaysSummary = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      status: { $ne: 'cancelled' },
    });

    const totalRevenue = orders.reduce((sum, o) => sum + o.finalTotal, 0);
    const totalOrders = orders.length;
    const cashOrders = orders.filter((o) => o.paymentMode === 'cash').length;
    const upiOrders = orders.filter((o) => o.paymentMode === 'upi').length;

    res.json({ success: true, totalRevenue, totalOrders, cashOrders, upiOrders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createOrder, getOrders, getOrderById, updateOrderStatus,
  sendBill, getKitchenOrders, updateItemStatus, getTodaysSummary,
};
