const mongoose = require('mongoose');

const productSchema = new mongoose.Schema ({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    title : {
        type: String,
        required: [true, "Please add a title"],
        trim: true,
    },
    slug : {
        type: String,
        required: true,
        unique: true,
    },
    description : {
        type: String,
        required: [true, "Please add a description"],
        trim: true,
    },
    image : {
        type: Object,
        default: {},
    },
    category : {
        type: String,
        required: [true, "Please add a category"],
        default: "All",
    },
    condition: {
        type: String,
        required: [true, "Please specify the item condition"],
        enum: ["New", "Used"],
        default: "New"
    },
    price : {
        type: Number,
        required: [true, "Please add a price"],
    },
    height: { type: Number },
    lengthPic: { type: Number },
    widthPic: { type: Number },
    mediumUsed: { type: String },
    weight: { type: Number },
    isSoldOut: { type: Boolean, default: false },
    soldTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    auctionDuration: { 
        type: Number,  // Duration in days
        required: [true, "Please select auction duration"],
        enum: [1, 3, 7, 14]
    },
    auctionEndTime: {
        type: Date,
        required: true
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    soldPrice: { 
        type: Number 
    },
});

// Add text indexes for search functionality
productSchema.index(
    {
        title: 'text',
        description: 'text',
        category: 'text'
    },
    {
        weights: {
            title: 10,        // Title matches are most important
            category: 5,      // Category matches are next
            description: 1    // Description matches are least important
        },
        name: "ProductSearchIndex"
    }
);

// Add compound indexes for filtering and sorting
productSchema.index({ isArchived: 1, isSoldOut: 1, auctionEndTime: -1 });
productSchema.index({ category: 1, price: 1 });

const Product = mongoose.model("Product", productSchema);
module.exports = Product;  // Changed from 'product' to 'Product'