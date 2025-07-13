const express = require("express");
const { 
    getAllMessages, 
    markMessageAsRead,
    getUnreadMessagesCount
} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleWare");
const router = express.Router();

// Get messages for logged-in user
router.get("/", protect, getAllMessages);

// Mark message as read
router.patch("/:messageId/read", protect, markMessageAsRead);

// Get unread messages count
router.get("/unread/count", protect, getUnreadMessagesCount);

module.exports = router; 