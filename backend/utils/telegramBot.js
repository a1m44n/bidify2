const axios = require('axios');

/**
 * Utility for sending notifications via Telegram Bot API
 */
class TelegramBot {
    constructor() {
        this.token = process.env.TELEGRAM_BOT_TOKEN;
        this.apiUrl = `https://api.telegram.org/bot${this.token}`;
    }

    /**
     * Set up webhook for the bot
     * 
     * @param {string} url - The webhook URL
     * @returns {Promise} - The response from the Telegram API
     */
    async setWebhook(url) {
        try {
            const response = await axios.post(`${this.apiUrl}/setWebhook`, {
                url: url
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error setting webhook:', error.response?.data || error.message);
            return { success: false, error: error.response?.data || error.message };
        }
    }

    /**
     * Send a message to a specific chat
     * 
     * @param {string} chatId - The Telegram chat ID to send the message to
     * @param {string} text - The message text
     * @returns {Promise} - The response from the Telegram API
     */
    async sendMessage(chatId, text) {
        try {
            if (!chatId || !this.token) {
                return { success: false, message: 'Missing chat ID or token' };
            }

            const response = await axios.post(`${this.apiUrl}/sendMessage`, {
                chat_id: chatId,
                text,
                parse_mode: 'HTML'
            });

            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error sending Telegram message:', error.response?.data || error.message);
            return { success: false, error: error.response?.data || error.message };
        }
    }

    /**
     * Creates a message for auction outbid notification
     * 
     * @param {object} productDetails - Product details
     * @param {number} price - New bid price
     * @param {string} bidderUsername - Username of the new highest bidder
     * @returns {string} - Formatted message
     */
    createOutbidMessage(productDetails, price, bidderUsername) {
        return `🔔 <b>You've Been Outbid!</b>\n\n` +
            `You have been outbid on "${productDetails.title}".\n` +
            `New highest bid: $${price} by @${bidderUsername}`;
    }

    /**
     * Creates a message for auction win notification
     * 
     * @param {object} productDetails - Product details
     * @param {number} winningBid - The winning bid amount
     * @param {object} seller - Seller details with username and telegramHandle
     * @returns {string} - Formatted message
     */
    createAuctionWinMessage(productDetails, winningBid, seller) {
        let message = `🏆 <b>Congratulations! You Won an Auction!</b>\n\n` +
            `You have won the auction for "${productDetails.title}".\n` +
            `Your winning bid: $${winningBid}\n\n` +
            `<b>Contact Seller:</b>\n` +
            `Username: @${seller.username}`;
        
        // Add telegram handle if available
        if (seller.telegramHandle) {
            message += `\nTelegram: <a href="https://t.me/${seller.telegramHandle}">@${seller.telegramHandle}</a>`;
        } else {
            message += `\nTelegram: Not available`;
        }
        
        return message;
    }

    /**
     * Creates a message for auction end notification
     * 
     * @param {object} productDetails - Product details
     * @returns {string} - Formatted message
     */
    createAuctionEndMessage(productDetails) {
        return `🔔 <b>Auction Ended</b>\n\n` +
            `The auction for "${productDetails.title}" has ended.`;
    }
}

module.exports = new TelegramBot(); 