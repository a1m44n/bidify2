const Product = require('../models/productModels');
const BiddingProduct = require('../models/biddingModel');
const notificationService = require('../utils/notificationService');

class AuctionMonitorService {
    constructor() {
        this.isRunning = false;
        this.checkInterval = 10000; // Check every 10 seconds
    }

    async start() {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;
        this.monitor();
    }

    stop() {
        this.isRunning = false;
    }

    async monitor() {
        while (this.isRunning) {
            try {
                await this.checkExpiredAuctions();
            } catch (error) {
                console.error('Error in auction monitor:', error);
            }

            // Wait for the next check interval
            await new Promise(resolve => setTimeout(resolve, this.checkInterval));
        }
    }

    async checkExpiredAuctions() {
        const now = new Date();

        // Find expired but not archived products
        const expiredProducts = await Product.find({
            auctionEndTime: { $lt: now },
            isArchived: false
        });

        // Process each expired product
        for (const product of expiredProducts) {
            try {
                await this.archiveProduct(product);
            } catch (error) {
                console.error(`Error archiving product ${product._id}:`, error);
            }
        }
    }

    async archiveProduct(product) {
        // Find the highest bid for this product
        const highestBid = await BiddingProduct.findOne({ product: product._id })
            .sort({ price: -1 })
            .populate("user", "username");
        
        // Update product with archive status and winner info
        const updateData = { isArchived: true };
        
        if (highestBid) {
            updateData.soldTo = highestBid.user._id;
            updateData.soldPrice = highestBid.price;
            updateData.isSoldOut = true;
        }

        // Create messages and send notifications before updating the product
        await notificationService.sendAuctionEndNotification(product, product.user);
        
        if (highestBid) {
            await notificationService.sendAuctionWinNotification(
                product,
                highestBid.user._id,
                highestBid.price
            );
        }

        // Update the product
        await Product.findByIdAndUpdate(
            product._id,
            updateData,
            { new: true, runValidators: true }
        );
    }
}

// Create a singleton instance
const auctionMonitorService = new AuctionMonitorService();

module.exports = auctionMonitorService; 