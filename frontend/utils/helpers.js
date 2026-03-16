/**
 * Calculate bill totals
 */
export const calculateBill = (items, gstPct = 5, discountPct = 0) => {
  const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const discountAmount = Math.round((subtotal * discountPct) / 100);
  const taxableAmount = subtotal - discountAmount;
  const gstAmount = Math.round((taxableAmount * gstPct) / 100);
  const finalTotal = taxableAmount + gstAmount;
  return { subtotal, discountAmount, gstAmount, finalTotal, taxableAmount };
};

/**
 * Format currency in INR
 */
export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);

/**
 * Format date
 */
export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const formatDateTime = (date) =>
  new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

/**
 * GST breakdown for tax invoice (CGST + SGST)
 */
export const getGSTBreakdown = (gstAmount, gstPct) => {
  const half = gstAmount / 2;
  return {
    cgstPct: gstPct / 2,
    sgstPct: gstPct / 2,
    cgstAmount: half,
    sgstAmount: half,
  };
};

export const MENU_CATEGORIES = ['Paper Dosa', 'Fancy Dosa', 'Gravy Item', 'Beverages', 'Extras'];

export const PAYMENT_MODES = [
  { value: 'cash', label: '💵 Cash' },
  { value: 'upi', label: '📱 UPI' },
  { value: 'card', label: '💳 Card' },
];

export const ORDER_TYPES = [
  { value: 'dine-in', label: '🍽️ Dine-In' },
  { value: 'parcel', label: '📦 Parcel' },
  { value: 'delivery', label: '🛵 Delivery' },
];

export const EXPENSE_CATEGORIES = [
  'Gas', 'Vegetables', 'Milk', 'Electricity', 'Salary', 'Rent',
  'Groceries', 'Maintenance', 'Marketing', 'Other',
];

export const KDS_STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-800 border-yellow-300',
  preparing: 'bg-blue-100 text-blue-800 border-blue-300',
  ready:     'bg-green-100 text-green-800 border-green-300',
  served:    'bg-gray-100 text-gray-600 border-gray-300',
};
