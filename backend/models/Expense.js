const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  category: {
    type: String,
    required: true,
    enum: ['Gas', 'Vegetables', 'Milk', 'Electricity', 'Salary', 'Rent', 'Groceries', 'Maintenance', 'Marketing', 'Other'],
  },
  date: { type: Date, default: Date.now },
  description: { type: String, default: '' },
  paymentMode: { type: String, enum: ['cash', 'upi', 'bank', 'card'], default: 'cash' },
  receipt: { type: String, default: '' }, // receipt image URL
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
