const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  eventDate: { type: Date, required: true },
  eventTime: { type: String },
  numberOfGuests: { type: Number, required: true, min: 1 },
  eventType: {
    type: String,
    enum: ['catering', 'party', 'corporate', 'wedding', 'birthday', 'other'],
    default: 'catering',
  },
  menuSelection: [{ type: String }],
  chargesPerPlate: { type: Number, required: true },
  advancePayment: { type: Number, default: 0 },
  totalCharges: { type: Number },
  balanceDue: { type: Number },
  venue: { type: String, default: 'restaurant' },
  specialRequests: { type: String, default: '' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending',
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Auto calculate totals
reservationSchema.pre('save', function (next) {
  this.totalCharges = this.numberOfGuests * this.chargesPerPlate;
  this.balanceDue = this.totalCharges - this.advancePayment;
  next();
});

module.exports = mongoose.model('Reservation', reservationSchema);
