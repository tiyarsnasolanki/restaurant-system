const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const items = await Inventory.find({ isActive: true }).sort({ category: 1, name: 1 });
    const lowStock = items.filter((i) => i.currentStock <= i.minimumStock);
    res.json({ success: true, items, lowStock });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const item = await Inventory.create(req.body);
    res.status(201).json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    if (req.body.addStock) {
      const item = await Inventory.findByIdAndUpdate(
        req.params.id,
        { $inc: { currentStock: req.body.addStock }, lastRestocked: new Date() },
        { new: true }
      );
      return res.json({ success: true, item });
    }
    const item = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Inventory.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
