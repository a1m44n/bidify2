const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");

const getAllMessages = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch messages where the user is the recipient
        // Users should only see notifications sent TO them, not ones they triggered for others
        const messages = await Message.find({
            recipient: userId
        })
        .sort("-createdAt")
        .populate("sender", "_id username telegramHandle")
        .populate("recipient", "_id username telegramHandle")
        .populate({
            path: "productId",
            select: "title isArchived isSoldOut soldTo",
            populate: {
                path: "soldTo",
                select: "_id username telegramHandle"
            }
        });
            
        res.status(200).json(messages);
    } catch (error) {
        res.status(500);
        throw new Error("Error fetching messages: " + error.message);
    }
});

// Mark a message as read
const markMessageAsRead = asyncHandler(async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;
        
        // Find the message
        const message = await Message.findById(messageId);
        
        if (!message) {
            res.status(404);
            throw new Error("Message not found");
        }
        
        // Check if the user is the recipient
        if (message.recipient.toString() !== userId) {
            res.status(403);
            throw new Error("Access denied: You cannot mark this message as read");
        }
        
        // Update the message
        message.read = true;
        await message.save();
        
        res.status(200).json({ success: true, message: "Message marked as read" });
    } catch (error) {
        res.status(500);
        throw new Error("Error marking message as read: " + error.message);
    }
});

// Get unread messages count
const getUnreadMessagesCount = asyncHandler(async (req, res) => {
    try {
        const userId = req.user.id;
        
        const count = await Message.countDocuments({
            recipient: userId,
            read: false
        });
        
        res.status(200).json({ count });
    } catch (error) {
        res.status(500);
        throw new Error("Error getting unread messages count: " + error.message);
    }
});

module.exports = {
    getAllMessages,
    markMessageAsRead,
    getUnreadMessagesCount
}; 