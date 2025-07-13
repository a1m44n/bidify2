const asyncHandler = require("express-async-handler");
const BiddingProduct = require("../models/biddingModel");  // Changed to PascalCase
const Product = require("../models/productModels");
const User = require("../models/UserModels"); 
const Wishlist = require("../models/wishlistModel");
const { processAutoBids } = require("./autoBidCtr");
const sendEmail = require("../utils/sendMail");
const notificationService = require("../utils/notificationService");
const bidService = require("../services/bidService");
const { createBid, calculateMinBidIncrement } = bidService;

// Helper function to add product to wishlist
const addToWishlistIfNotExists = async (userId, productId) => {
    try {
        // Check if product exists and get the owner
        const product = await Product.findById(productId);
        if (!product) {
            console.log(`Product ${productId} not found, skipping wishlist add`);
            return;
        }

        // Don't add own products to wishlist
        if (product.user.toString() === userId.toString()) {
            console.log(`User ${userId} cannot add their own product ${productId} to wishlist`);
            return;
        }

        // Check if already in wishlist
        const existingWishlistItem = await Wishlist.findOne({ userId, productId });
        if (!existingWishlistItem) {
            // Add to wishlist if not already there
            await Wishlist.create({ userId, productId });
            console.log(`Product ${productId} automatically added to wishlist for user ${userId}`);
        }
    } catch (error) {
        // Log the error but don't fail the bid/auto-bid process
        console.error('Error auto-adding to wishlist:', error);
    }
};

const getBiddingHistory = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const biddingHistory = await BiddingProduct.find({ product: productId })
        .sort("-createdAt")
        .populate("user", "username")
        .populate("product");
    res.status(200).json(biddingHistory);
});

const placeBid = asyncHandler(async (req, res) => {
    const { productId, price } = req.body;
    const userId = req.user.id;

    const product = await Product.findById(productId).populate("user", "username");
    
    // Check if product is archived or sold
    if (!product || product.isSoldOut === true || product.isArchived === true) {
        res.status(400);
        throw new Error("Bidding is closed for this product");
    }

    // Check if the current user is the seller
    if (product.user._id.toString() === userId) {
        res.status(403);
        throw new Error("You cannot bid on your own items");
    }

    // Find the highest bid for this product
    const highestBid = await BiddingProduct.findOne({ product: productId })
        .sort({ price: -1 })
        .populate("user", "username email");

    // If there's a highest bid and it belongs to the current user, prevent overbidding
    if (highestBid && highestBid.user._id.toString() === userId) {
        res.status(400);
        throw new Error("You already have the highest bid. Wait for someone else to bid before bidding again.");
    }

    // Calculate minimum required bid
    const currentPrice = highestBid ? highestBid.price : product.price;
    const minIncrement = calculateMinBidIncrement(currentPrice);
    const minRequiredBid = currentPrice + minIncrement;

    // Check if the new bid meets minimum requirements
    if (price < minRequiredBid) {
        res.status(400);
        throw new Error(`Your bid must be at least $${minRequiredBid.toFixed(2)} (current price $${currentPrice.toFixed(2)} + minimum increment $${minIncrement.toFixed(2)})`);
    }

    // Create the user's manual bid
    const biddingProduct = await createBid(userId, productId, price);
    
    // Automatically add product to wishlist
    await addToWishlistIfNotExists(userId, productId);
    
    // Get the user who placed the bid
    const bidder = await User.findById(userId, "username");

    // If there was a previous highest bid by a different user, notify them that they've been outbid
    if (highestBid && highestBid.user._id.toString() !== userId) {
        // Send outbid notification through both internal message and Telegram (if enabled)
        await notificationService.sendOutbidNotification(
            product,
            userId,
            highestBid.user._id,
            price,
            bidder
        );
        
        /*
         * Continuously process auto-bids until no more qualified auto-bidders
         * are able to outbid the current highest bid. This ensures that when
         * multiple users have auto-bidding enabled, the system will keep
         * alternating between them (respecting their max limits) until the bid
         * stabilises.
         */
        let lastBidUserId = userId;
        let lastBidPrice = price;

        while (true) {
            const autoBidResult = await processAutoBids(productId, lastBidPrice, lastBidUserId);

            if (!autoBidResult) {
                break; // No further auto-bids triggered
            }

            // Create the auto-bid in the database
            const autoBid = await createBid(
                autoBidResult.user,
                autoBidResult.product,
                autoBidResult.price,
                true
            );

            // Notify the previous highest bidder that they have been outbid
            const autoBidder = await User.findById(autoBidResult.user, "username");
            await notificationService.sendOutbidNotification(
                product,
                autoBidResult.user,
                lastBidUserId,
                autoBidResult.price,
                autoBidder
            );

            // Update trackers for the next iteration
            lastBidUserId = autoBidResult.user;
            lastBidPrice = autoBidResult.price;
        }
    }
        
    res.status(200).json(biddingProduct);
});

const sellProduct = asyncHandler(async (req, res) => {
    const { productId } = req.body;
    const userId = req.user.id;

    const product = await Product.findById(productId);
    if (!product) {
        res.status(400);
        throw new Error("Product not found");
    }

    // check if the user is authorized to sell the product
    if (product.user.toString() !== userId) {
        return res.status(403).json({error: "You are not authorized to sell this product"});
    }

    // find the highest bid price
    const highestBid = await BiddingProduct.findOne({ product : productId }).sort({ price: -1 }).populate("user");
    if (!highestBid) {
        return res.status(400).json({ error: "No winning bid found for the product"});
    }

    // update product details
    product.isSoldOut = true;
    product.soldTo = highestBid.user;
    product.soldPrice = highestBid.price;

    // update seller balance 
    const seller = await User.findById(product.user);
    if (seller) {
        seller.balance += highestBid.price;
        await seller.save();
    } else {
        return res.status(404).json({error: "Seller not found"});
    }

    // save product
    await product.save();

    // Send winning notification to highest bidder
    await notificationService.sendAuctionWinNotification(
        product,
        highestBid.user._id,
        highestBid.price
    );

    // Send email notification
    await sendEmail({
        email: highestBid.user.email,
        subject: "Congratulations! You have won the auction",
        html: `You have won the auction for "${product.title}" with a bid of $${highestBid.price}`,
    });

    res.status(200).json({message: "Product has been sold successfully"});
});

module.exports = { 
    getBiddingHistory, 
    placeBid,
    sellProduct,
    createBid: bidService.createBid
};