// routes/kitchen.js
const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET active kitchen orders
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find({
      kitchenStatus: { $in: ['pending', 'preparing'] },
      status: { $ne: 'cancelled' },
    }).sort({ createdAt: 1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH update kitchen status
router.patch('/orders/:id', async (req, res) => {
  try {
    const { kitchenStatus } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { kitchenStatus }, { new: true });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
