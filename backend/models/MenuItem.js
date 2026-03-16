const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: ['Paper Dosa', 'Fancy Dosa', 'Gravy Item', 'Beverages', 'Extras'],
  },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, default: '' },
  isAvailable: { type: Boolean, default: true },
  isVeg: { type: Boolean, default: true },
  image: { type: String, default: '' },
  // For inventory tracking
  ingredients: [{
    name: String,
    quantity: Number,
    unit: String,
  }],
  preparationTime: { type: Number, default: 5 }, // minutes
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('MenuItem', menuItemSchema);
