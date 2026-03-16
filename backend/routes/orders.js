const express = require('express');
const router = express.Router();
const {
  createOrder, getOrders, getOrderById, updateOrderStatus,
  sendBill, getKitchenOrders, updateItemStatus, getTodaysSummary,
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/kitchen', getKitchenOrders);
router.get('/summary/today', getTodaysSummary);
router.get('/', getOrders);
router.post('/', createOrder);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);
router.post('/:id/send-bill', sendBill);
router.patch('/:id/item-status', updateItemStatus);

module.exports = router;
