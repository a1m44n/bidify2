const BiddingProduct = require("../models/biddingModel");

/**
 * Calculate the minimum bid increment based on the current price
 * @param {number} currentPrice - The current highest bid price
 * @returns {number} The minimum bid increment required
 */
function calculateMinBidIncrement(currentPrice) {
    if (currentPrice < 100) return 1;
    if (currentPrice < 500) return 5;
    if (currentPrice < 1000) return 10;
    if (currentPrice < 5000) return 25;
    if (currentPrice < 10000) return 50;
    if (currentPrice < 20000) return 100;
    if (currentPrice < 50000) return 250;
    return 500;
}

/**
 * Create a bid (manual or automatic) and return the populated document.
 * @param {string} userId - ID of the bidding user
 * @param {string} productId - ID of the product being bid on
 * @param {number} price - Bid price
 * @param {boolean} [isAutoBid=false] - Whether this is an auto-placed bid
 */
async function createBid(userId, productId, price, isAutoBid = false) {
    const newBid = await BiddingProduct.create({
        user: userId,
        product: productId,
        price,
        isAutoBid,
    });

    return await BiddingProduct.findById(newBid._id).populate("user", "username email");
}

module.exports = { createBid, calculateMinBidIncrement };