const Wishlist = require('../models/wishlistModel');
const Product = require('../models/productModels');
const asyncHandler = require('express-async-handler');

// Add product to wishlist
const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  // Check if product exists
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  // Check if user is trying to add their own product to wishlist
  if (product.user.toString() === userId.toString()) {
    res.status(400);
    throw new Error('You cannot add your own products to your wishlist');
  }

  // Check if already in wishlist
  const existingWishlistItem = await Wishlist.findOne({ userId, productId });
  if (existingWishlistItem) {
    res.status(400);
    throw new Error('Product already in wishlist');
  }

  // Add to wishlist
  const wishlistItem = await Wishlist.create({
    userId,
    productId
  });

  res.status(201).json({
    success: true,
    data: wishlistItem
  });
});

// Remove product from wishlist
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  const wishlistItem = await Wishlist.findOneAndDelete({ userId, productId });

  if (!wishlistItem) {
    res.status(404);
    throw new Error('Wishlist item not found');
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});

// Get user's wishlist
const getWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const wishlistItems = await Wishlist.find({ userId })
    .populate({
      path: 'productId',
      select: 'title description image price category condition isSoldOut isArchived auctionEndTime'
    })
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: wishlistItems.length,
    data: wishlistItems
  });
});

// Check if product is in user's wishlist
const checkWishlistItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const userId = req.user._id;

  const wishlistItem = await Wishlist.findOne({ userId, productId });

  res.status(200).json({
    success: true,
    isWishlisted: !!wishlistItem
  });
});

module.exports = {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  checkWishlistItem
}; 