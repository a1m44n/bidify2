const asyncHandler = require('express-async-handler');

/**
 * Handle incoming Telegram webhook events
 */
const handleTelegramUpdate = asyncHandler(async (req, res) => {
    const update = req.body;
    
    // Handle /start command
    if (update.message && update.message.text === '/start') {
        const chatId = update.message.chat.id;
        const message = `Welcome to Bidify Bot! 🎉\n\nYour Chat ID is: <code>${chatId}</code>\n\nCopy this ID and paste it in your Bidify notification settings to receive auction updates.`;
        
        try {
            const telegramBot = require('../utils/telegramBot');
            await telegramBot.sendMessage(chatId, message);
            res.status(200).json({ success: true });
        } catch (error) {
            console.error('Error handling /start command:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    } else {
        // Acknowledge other updates
        res.status(200).json({ success: true });
    }
});

module.exports = {
    handleTelegramUpdate
}; 