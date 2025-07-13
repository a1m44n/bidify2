const express = require('express');
const { handleTelegramUpdate } = require('../controllers/telegramWebhookController');
const router = express.Router();

// Handle Telegram webhook updates
router.post('/', handleTelegramUpdate);

module.exports = router; 