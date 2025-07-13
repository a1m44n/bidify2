const express = require('express');
const { protect } = require('../middleware/authMiddleWare');
const {
    createAutoBid,
    getAutoBid,
    getUserAutoBids,
    deleteAutoBid
} = require('../controllers/autoBidCtr');

const router = express.Router();

// Create/update auto-bid
router.post("/", protect, createAutoBid);

// Get auto-bid for a specific product and user
router.get("/product/:productId", protect, getAutoBid);

// Get all user's auto-bids
router.get("/user", protect, getUserAutoBids);

// Delete/deactivate auto-bid
router.delete("/:productId", protect, deleteAutoBid);

module.exports = router; 