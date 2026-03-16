const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: {
    type: String,
    enum: ['Vegetables', 'Dairy', 'Grains', 'Spices', 'Beverages', 'Packaging', 'Other'],
    default: 'Other',
  },
  currentStock: { type: Number, required: true, default: 0 },
  unit: { type: String, required: true, enum: ['kg', 'g', 'litre', 'ml', 'piece', 'packet', 'dozen'] },
  minimumStock: { type: Number, default: 1 }, // Alert when below this
  costPerUnit: { type: Number, default: 0 },
  supplier: { type: String, default: '' },
  lastRestocked: { type: Date },
  expiryDate: { type: Date },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Virtual: is low stock?
inventorySchema.virtual('isLowStock').get(function () {
  return this.currentStock <= this.minimumStock;
});

module.exports = mongoose.model('Inventory', inventorySchema);
