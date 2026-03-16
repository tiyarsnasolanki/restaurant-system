const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  total: { type: Number, required: true },
  notes: { type: String, default: '' },
  // KDS fields
  kdsStatus: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'served'],
    default: 'pending',
  },
});

const orderSchema = new mongoose.Schema({
  // Bill Number - auto-generated, sequential
  billNumber: { type: String, unique: true },

  // Customer Info
  customerName: { type: String, default: 'Walk-in Customer' },
  customerPhone: { type: String, default: '' },
  tableNumber: { type: String, default: '' },

  // Order Type
  orderType: { type: String, enum: ['dine-in', 'parcel', 'delivery'], default: 'dine-in' },

  // Items
  items: [orderItemSchema],

  // Pricing
  subtotal: { type: Number, required: true },
  gstPercentage: { type: Number, default: 5 },
  gstAmount: { type: Number, default: 0 },
  discountPercentage: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  finalTotal: { type: Number, required: true },

  // Payment
  paymentMode: { type: String, enum: ['cash', 'upi', 'card', 'pending'], default: 'cash' },
  paymentStatus: { type: String, enum: ['paid', 'pending', 'partial'], default: 'paid' },
  amountPaid: { type: Number, default: 0 },
  changeReturned: { type: Number, default: 0 },

  // Status
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'kot-sent'],
    default: 'active',
  },

  // KDS
  kitchenStatus: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'served'],
    default: 'pending',
  },
  kotTime: { type: Date },
  servedTime: { type: Date },

  // Staff
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // GST Invoice fields
  gstin: { type: String, default: '' },
  invoiceType: { type: String, enum: ['bill', 'tax-invoice'], default: 'bill' },

  // Bill sent status
  billSentToCustomer: { type: Boolean, default: false },

}, { timestamps: true });

// Auto-generate bill number before saving
orderSchema.pre('save', async function (next) {
  if (!this.billNumber) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const count = await mongoose.model('Order').countDocuments({
      createdAt: {
        $gte: new Date(today.setHours(0, 0, 0, 0)),
        $lt: new Date(today.setHours(23, 59, 59, 999)),
      },
    });
    this.billNumber = `JK-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
