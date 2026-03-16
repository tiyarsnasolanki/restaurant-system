const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/menu - Public (for QR menu)
router.get('/', async (req, res) => {
  try {
    const items = await MenuItem.find({ isAvailable: true }).sort({ category: 1, sortOrder: 1 });
    const grouped = items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});
    res.json({ success: true, menu: grouped, items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/menu/all - All items including unavailable (admin)
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ category: 1, sortOrder: 1 });
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/menu - Add item
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const item = await MenuItem.create(req.body);
    res.status(201).json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/menu/:id
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/menu/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
