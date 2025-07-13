const mongoose = require("mongoose");

const autoBidSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Product",
    },
    maxBidAmount: {
        type: Number,
        required: true,
    },
    incrementAmount: {
        type: Number,
        default: 1, // Default increment of $1
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, 
{ timestamps: true }
);

// Create a compound index to ensure a user can only have one active auto-bid per product
autoBidSchema.index({ user: 1, product: 1 }, { unique: true });

const AutoBid = mongoose.model("AutoBid", autoBidSchema);
module.exports = AutoBid; 