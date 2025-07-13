const express = require('express');
const { getPriceSuggestion, getDebugScrapedData } = require('../controllers/suggestionCtr');
const router = express.Router();

router.get("/price", getPriceSuggestion);
router.get("/debug-scrape", getDebugScrapedData);

module.exports = router; 