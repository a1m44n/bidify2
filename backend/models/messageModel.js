const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Product"
    },
    productTitle: {
        type: String,
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"  // This will typically be the system/admin
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    messageType: {
        type: String,
        required: true,
        enum: ['AUCTION_END', 'AUCTION_WIN', 'AUCTION_OUTBID', 'SYSTEM']  // Add more types as needed
    },
    message: {
        type: String,
        required: true
    },
    winningBid: {
        type: Number,
        required: function() { return this.messageType === 'AUCTION_WIN' }
    },
    read: {
        type: Boolean,
        default: false
    }
}, 
{ timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);
module.exports = Message; 