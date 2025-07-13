const express = require('express');
const { protect } = require('../middleware/authMiddleWare');
const { getBiddingHistory, placeBid, sellProduct } = require('../controllers/biddingCtr');
const router = express.Router(); 

router.get("/:productId", getBiddingHistory);
router.post("/place-bid", protect, placeBid);
router.post("/sell", protect, sellProduct);

module.exports = router;
