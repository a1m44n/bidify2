const Message = require('../models/messageModel');
const User = require('../models/UserModels');
const telegramBot = require('./telegramBot');

/**
 * Service for handling notifications across different channels
 */
class NotificationService {
    /**
     * Send notification about being outbid
     * 
     * @param {object} product - Product details
     * @param {string} userId - Current bidder's user ID
     * @param {string} recipientId - Previous highest bidder's user ID
     * @param {number} price - New bid price 
     * @param {object} bidder - Current bidder's user object
     */
    async sendOutbidNotification(product, userId, recipientId, price, bidder) {
        try {
            // Create message for internal notifications
            const message = await Message.create({
                productId: product._id,
                productTitle: product.title,
                sender: userId, // Current bidder is the sender
                recipient: recipientId, // Previous highest bidder is the recipient
                messageType: 'AUCTION_OUTBID',
                message: `You have been outbid on "${product.title}". The new highest bid is $${price} by @${bidder.username}.`
            });

            // Check if recipient has Telegram notifications enabled
            const recipient = await User.findById(recipientId);
            
            if (recipient && 
                recipient.telegramChatId && 
                recipient.notificationPreferences?.telegram?.enabled &&
                recipient.notificationPreferences?.telegram?.notifyOnOutbid) {
                
                // Send Telegram notification
                const telegramMessage = telegramBot.createOutbidMessage(product, price, bidder.username);
                await telegramBot.sendMessage(recipient.telegramChatId, telegramMessage);
            }

            return message;
        } catch (error) {
            console.error('Error sending outbid notification:', error);
            throw error;
        }
    }

    /**
     * Send notification about winning an auction
     * 
     * @param {object} product - Product details
     * @param {string} recipientId - Winner's user ID
     * @param {number} winningBid - Winning bid amount
     */
    async sendAuctionWinNotification(product, recipientId, winningBid) {
        try {
            // Create message for internal notifications
            const message = await Message.create({
                productId: product._id,
                productTitle: product.title,
                sender: product.user, // Seller is the sender
                recipient: recipientId, // Winner is the recipient
                messageType: 'AUCTION_WIN',
                message: `Congratulations! You won the auction for "${product.title}" with a bid of $${winningBid}.`,
                winningBid
            });

            // Check if recipient has Telegram notifications enabled
            const recipient = await User.findById(recipientId);
            
            if (recipient && 
                recipient.telegramChatId && 
                recipient.notificationPreferences?.telegram?.enabled &&
                recipient.notificationPreferences?.telegram?.notifyOnWin) {
                
                // Fetch seller information for contact details
                const seller = await User.findById(product.user, "username telegramHandle");
                
                // Send Telegram notification
                const telegramMessage = telegramBot.createAuctionWinMessage(product, winningBid, seller);
                await telegramBot.sendMessage(recipient.telegramChatId, telegramMessage);
            }

            return message;
        } catch (error) {
            console.error('Error sending auction win notification:', error);
            throw error;
        }
    }

    /**
     * Send notification about auction ending
     * 
     * @param {object} product - Product details
     * @param {string} recipientId - User ID to notify
     */
    async sendAuctionEndNotification(product, recipientId) {
        try {
            // Create message for internal notifications
            const message = await Message.create({
                productId: product._id,
                productTitle: product.title,
                sender: product.user, // Seller is the sender
                recipient: recipientId,
                messageType: 'AUCTION_END',
                message: `The auction for "${product.title}" has ended.`
            });

            // Check if recipient has Telegram notifications enabled
            const recipient = await User.findById(recipientId);
            
            if (recipient && 
                recipient.telegramChatId && 
                recipient.notificationPreferences?.telegram?.enabled &&
                recipient.notificationPreferences?.telegram?.notifyOnAuctionEnd) {
                
                // Send Telegram notification
                const telegramMessage = telegramBot.createAuctionEndMessage(product);
                await telegramBot.sendMessage(recipient.telegramChatId, telegramMessage);
            }

            return message;
        } catch (error) {
            console.error('Error sending auction end notification:', error);
            throw error;
        }
    }
}

module.exports = new NotificationService(); 