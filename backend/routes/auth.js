// routes/auth.js
const express = require('express');
const router = express.Router();
const { login, getMe, register, changePassword } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/register', protect, adminOnly, register);
router.post('/change-password', protect, changePassword);

module.exports = router;
