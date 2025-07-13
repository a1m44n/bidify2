const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

const biddingProductSchema = mongoose.Schema({
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
    price: {
        type: Number, 
        required: true,
    },       
    // Flag to indicate if this bid was placed automatically by the auto-bidding system
    isAutoBid: {
        type: Boolean,
        default: false,
    },
}, 
{ timestamps: true }
);

const biddingProduct = mongoose.model("BiddingProduct", biddingProductSchema);
module.exports = biddingProduct;