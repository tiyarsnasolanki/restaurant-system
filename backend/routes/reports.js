const express = require('express');
const router = express.Router();
const { getDailyReport, getMonthlyReport, getYearlyReport, getTopItems } = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

router.get('/daily', getDailyReport);
router.get('/monthly', getMonthlyReport);
router.get('/yearly', getYearlyReport);
router.get('/top-items', getTopItems);

module.exports = router;
