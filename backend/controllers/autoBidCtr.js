const asyncHandler = require("express-async-handler");
const AutoBid = require("../models/autoBidModel");
const Product = require("../models/productModels");
const BiddingProduct = require("../models/biddingModel");
const Wishlist = require("../models/wishlistModel");
const bidService = require("../services/bidService");
const { calculateMinBidIncrement } = bidService;

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

// Create or update an auto-bid
const createAutoBid = asyncHandler(async (req, res) => {
    console.log('Starting createAutoBid with body:', req.body);
    const { productId, maxBidAmount } = req.body;
    const userId = req.user.id;

    if (!productId || !maxBidAmount) {
        console.log('Missing required fields:', { productId, maxBidAmount });
        res.status(400);
        throw new Error("Product ID and maximum bid amount are required");
    }

    // Check if the product exists and is active
    const product = await Product.findById(productId);
    console.log('Found product:', product);
    
    if (!product || product.isArchived || product.isSoldOut) {
        console.log('Product not available:', { exists: !!product, isArchived: product?.isArchived, isSoldOut: product?.isSoldOut });
        res.status(400);
        throw new Error("Product not available for bidding");
    }

    // Check if the current user is the seller
    if (product.user.toString() === userId) {
        console.log('User is seller, cannot auto-bid');
        res.status(403);
        throw new Error("You cannot set up auto-bidding on your own items");
    }

    // Find the highest bid for this product
    const highestBid = await BiddingProduct.findOne({ product: productId })
        .sort({ price: -1 });
    console.log('Current highest bid:', highestBid);

    // Check if the max bid amount is higher than the current highest bid
    if (highestBid && maxBidAmount <= highestBid.price) {
        console.log('Max bid amount too low:', { maxBidAmount, currentHighest: highestBid.price });
        res.status(400);
        throw new Error("Your maximum bid must be higher than the current highest bid");
    }

    try {
        // Check if auto-bid already exists for this user and product
        const existingAutoBid = await AutoBid.findOne({
            user: userId,
            product: productId
        });
        console.log('Existing auto-bid:', existingAutoBid);

        let autoBid;
        if (existingAutoBid) {
            console.log('Updating existing auto-bid');
            // Update the existing auto-bid
            existingAutoBid.maxBidAmount = maxBidAmount;
            existingAutoBid.isActive = true;
            
            await existingAutoBid.save();
            autoBid = existingAutoBid;
        } else {
            console.log('Creating new auto-bid');
            // Create a new auto-bid
            autoBid = await AutoBid.create({
                user: userId,
                product: productId,
                maxBidAmount,
                isActive: true
            });
        }
        console.log('Auto-bid saved:', autoBid);

        // Automatically add product to wishlist
        await addToWishlistIfNotExists(userId, productId);

        // Only place an initial bid if:
        // 1. There's no highest bid, OR
        // 2. The highest bid exists but belongs to someone else AND our max amount is higher
        if (!highestBid || (highestBid && highestBid.user.toString() !== userId && maxBidAmount > highestBid.price)) {
            const currentPrice = highestBid ? highestBid.price : product.price;
            const minIncrement = calculateMinBidIncrement(currentPrice);
            const initialBidAmount = Math.min(maxBidAmount, currentPrice + minIncrement);
            
            console.log('Calculated initial bid amount:', { 
                initialBidAmount,
                maxBidAmount,
                currentPrice,
                minIncrement
            });

            // Create the initial bid
            console.log('Creating initial bid...');
            const newBid = await BiddingProduct.create({
                user: userId,
                product: productId,
                price: initialBidAmount,
                isAutoBid: true
            });
            console.log('Initial bid created:', newBid);

            /*
             * After placing the initial bid for this auto-bidder, we need to process any
             * other active auto-bids on the same product so that they can immediately
             * respond. Otherwise, the bid history may get stuck with one auto-bidder
             * outbidding the other without giving the latter a chance to react until a
             * manual bid is placed.
             */
            let lastBidUserId = userId;
            let lastBidPrice = newBid.price;

            while (true) {
                const nextAutoBid = await processAutoBids(productId, lastBidPrice, lastBidUserId);

                if (!nextAutoBid) {
                    break; // No further auto-bids triggered
                }

                // Persist the subsequent auto-bid
                await bidService.createBid(
                    nextAutoBid.user,
                    nextAutoBid.product,
                    nextAutoBid.price,
                    true
                );

                // Prepare for the next iteration
                lastBidUserId = nextAutoBid.user;
                lastBidPrice = nextAutoBid.price;
            }
        } else {
            console.log('User already has the highest bid, no need to place initial auto-bid');
        }

        res.status(existingAutoBid ? 200 : 201).json({
            message: `Auto-bid ${existingAutoBid ? 'updated' : 'created'} successfully`,
            autoBid
        });
    } catch (error) {
        console.error('Error in createAutoBid:', error);
        res.status(400);
        throw new Error(error.message);
    }
});

// Get auto-bid for a specific product and user
const getAutoBid = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const userId = req.user.id;

    const autoBid = await AutoBid.findOne({
        user: userId,
        product: productId
    });

    if (autoBid) {
        res.status(200).json(autoBid);
    } else {
        res.status(404).json({ message: "No auto-bid found for this product" });
    }
});

// Get all auto-bids for a user
const getUserAutoBids = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const autoBids = await AutoBid.find({
        user: userId,
        isActive: true
    }).populate("product", "title image price auctionEndTime");

    res.status(200).json(autoBids);
});

// Delete/deactivate an auto-bid
const deleteAutoBid = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const userId = req.user.id;

    const autoBid = await AutoBid.findOne({
        user: userId,
        product: productId
    });

    if (!autoBid) {
        res.status(404);
        throw new Error("Auto-bid not found");
    }

    // Set the auto-bid as inactive instead of deleting
    autoBid.isActive = false;
    await autoBid.save();

    res.status(200).json({ message: "Auto-bid deactivated successfully" });
});

// Process auto-bidding when a new bid is placed
// This is called by the bidding controller
const processAutoBids = async (productId, newBidPrice, newBidUserId) => {
    try {
        // Find all active auto-bids for this product, excluding the user who just placed the bid
        const autoBids = await AutoBid.find({
            product: productId,
            isActive: true,
            user: { $ne: newBidUserId }
        }).sort({ maxBidAmount: -1 }); // Sort by max bid amount in descending order

        if (autoBids.length === 0) {
            return null;
        }

        // Get the auto-bid with the highest max amount
        const highestAutoBid = autoBids[0];

        // Check if the highest auto-bid's max amount is higher than the new bid
        if (highestAutoBid.maxBidAmount <= newBidPrice) {
            return null; // No auto-bid triggered
        }

        // Calculate the minimum required increment based on the current price
        const minIncrement = calculateMinBidIncrement(newBidPrice);

        // Calculate the new auto-bid price 
        // (either minimum increment more than the current bid or the max amount, whichever is lower)
        const autoBidPrice = Math.min(
            newBidPrice + minIncrement,
            highestAutoBid.maxBidAmount
        );

        return {
            user: highestAutoBid.user,
            product: highestAutoBid.product,
            price: autoBidPrice,
            isAutoBid: true
        };
    } catch (error) {
        console.error("Error processing auto-bids:", error);
        return null;
    }
};

module.exports = {
    createAutoBid,
    getAutoBid,
    getUserAutoBids,
    deleteAutoBid,
    processAutoBids
}; 