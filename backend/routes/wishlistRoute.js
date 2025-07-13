const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleWare');
const {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  checkWishlistItem
} = require('../controllers/wishlistCtr');

// All routes are protected
router.use(protect);

router.route('/')
  .get(getWishlist);

router.route('/:productId')
  .post(addToWishlist)
  .delete(removeFromWishlist);

router.route('/check/:productId')
  .get(checkWishlistItem);

module.exports = router; 