'use client';
import { forwardRef } from 'react';
import { formatDateTime, getGSTBreakdown } from '@/utils/helpers';

const RESTAURANT = {
  name: process.env.NEXT_PUBLIC_RESTAURANT_NAME || 'JK Spicy Dosa Cafe',
  address: process.env.NEXT_PUBLIC_RESTAURANT_ADDRESS || 'Your Address Here',
  phone: process.env.NEXT_PUBLIC_RESTAURANT_PHONE || '+91-XXXXXXXXXX',
  gstin: process.env.NEXT_PUBLIC_RESTAURANT_GSTIN || 'GSTIN: XXXXXXXXXXX',
  fssai: 'FSSAI: XXXXXXXXXXXXXXX',
};

const PrintBill = forwardRef(({ order }, ref) => {
  if (!order) return null;

  const isTaxInvoice = order.invoiceType === 'tax-invoice';
  const gst = getGSTBreakdown(order.gstAmount, order.gstPercentage);
  const divider = '─'.repeat(38);

  return (
    <div ref={ref} className="bill-print-container p-4 bg-white text-black" style={{ width: '80mm', fontFamily: "'Courier New', monospace", fontSize: '11px' }}>
      {/* Header */}
      <div className="text-center mb-3">
        <div className="text-lg font-bold tracking-wide">{RESTAURANT.name}</div>
        <div className="text-xs mt-0.5">{RESTAURANT.address}</div>
        <div className="text-xs">Tel: {RESTAURANT.phone}</div>
        <div className="text-xs">{RESTAURANT.gstin}</div>
        <div className="text-xs">{RESTAURANT.fssai}</div>
        <div className="mt-1 text-xs font-bold border border-black inline-block px-3 py-0.5">
          {isTaxInvoice ? 'TAX INVOICE' : 'BILL / RECEIPT'}
        </div>
      </div>

      <div className="border-t border-dashed border-black my-1" />

      {/* Bill Details */}
      <div className="text-xs space-y-0.5 mb-2">
        <div className="flex justify-between font-bold">
          <span>Bill No:</span>
          <span>{order.billNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{formatDateTime(order.createdAt || new Date())}</span>
        </div>
        {order.tableNumber && (
          <div className="flex justify-between">
            <span>Table:</span>
            <span>{order.tableNumber}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Type:</span>
          <span className="capitalize">{order.orderType}</span>
        </div>
        {order.customerName && order.customerName !== 'Walk-in Customer' && (
          <div className="flex justify-between">
            <span>Customer:</span>
            <span>{order.customerName}</span>
          </div>
        )}
        {order.customerPhone && (
          <div className="flex justify-between">
            <span>Phone:</span>
            <span>{order.customerPhone}</span>
          </div>
        )}
        {isTaxInvoice && order.gstin && (
          <div className="flex justify-between">
            <span>GSTIN:</span>
            <span>{order.gstin}</span>
          </div>
        )}
      </div>

      <div className="border-t border-dashed border-black my-1" />

      {/* Items Header */}
      <div className="text-xs flex justify-between font-bold mb-1">
        <span style={{ width: '50%' }}>Item</span>
        <span className="text-center" style={{ width: '15%' }}>Qty</span>
        <span className="text-right" style={{ width: '18%' }}>Rate</span>
        <span className="text-right" style={{ width: '17%' }}>Amt</span>
      </div>
      <div className="border-t border-dashed border-black mb-1" />

      {/* Items */}
      {order.items?.map((item, i) => (
        <div key={i} className="text-xs flex justify-between mb-0.5">
          <span style={{ width: '50%' }} className="truncate pr-1">{item.name}</span>
          <span className="text-center" style={{ width: '15%' }}>{item.quantity}</span>
          <span className="text-right" style={{ width: '18%' }}>₹{item.price}</span>
          <span className="text-right" style={{ width: '17%' }}>₹{item.total || item.price * item.quantity}</span>
        </div>
      ))}

      <div className="border-t border-dashed border-black my-1" />

      {/* Totals */}
      <div className="text-xs space-y-0.5">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₹{order.subtotal}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Discount ({order.discountPercentage}%):</span>
            <span>-₹{order.discountAmount}</span>
          </div>
        )}
        {isTaxInvoice ? (
          <>
            <div className="flex justify-between">
              <span>Taxable Amount:</span>
              <span>₹{order.subtotal - (order.discountAmount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>CGST ({gst.cgstPct}%):</span>
              <span>₹{gst.cgstAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST ({gst.sgstPct}%):</span>
              <span>₹{gst.sgstAmount.toFixed(2)}</span>
            </div>
          </>
        ) : (
          <div className="flex justify-between">
            <span>GST ({order.gstPercentage}%):</span>
            <span>₹{order.gstAmount}</span>
          </div>
        )}
      </div>

      <div className="border-t border-black my-1" />

      {/* Total */}
      <div className="flex justify-between font-bold text-sm">
        <span>TOTAL:</span>
        <span>₹{order.finalTotal}</span>
      </div>

      <div className="border-t border-dashed border-black my-1" />

      {/* Payment */}
      <div className="text-xs space-y-0.5">
        <div className="flex justify-between">
          <span>Payment Mode:</span>
          <span className="uppercase font-semibold">{order.paymentMode}</span>
        </div>
        {order.amountPaid > order.finalTotal && (
          <>
            <div className="flex justify-between">
              <span>Amount Paid:</span>
              <span>₹{order.amountPaid}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Change:</span>
              <span>₹{order.amountPaid - order.finalTotal}</span>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-dashed border-black mt-2 pt-2 text-center text-xs">
        <div className="font-bold">Thank You! Visit Again 🙏</div>
        <div className="mt-1 opacity-70">All prices inclusive of taxes</div>
        <div className="opacity-70">This is a computer generated receipt</div>
        <div className="mt-2 font-bold text-base tracking-widest">★★★★★</div>
      </div>
    </div>
  );
});

PrintBill.displayName = 'PrintBill';
export default PrintBill;
