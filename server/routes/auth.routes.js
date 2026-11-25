const express = require('express');
const router = express.Router();

const { register, login, googleAuth, me, logout } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);

router.get('/me', protect, me);
router.post('/logout', protect, logout);

module.exports = router;