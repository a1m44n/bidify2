const asyncHandler = require('express-async-handler');
const scrapingService = require('../services/scrapingService');
const suggestionService = require('../services/suggestionService');

/**
 * Debug endpoint to see raw scraped data
 * Query parameters:
 * - productTitle: string (required)
 * - condition: string (required) - Valid values: "new", "used" ONLY
 */
const getDebugScrapedData = asyncHandler(async (req, res) => {
  const { productTitle, condition } = req.query;
  
  if (!productTitle) {
    res.status(400);
    throw new Error("Product title is required");
  }
  
  if (!condition) {
    res.status(400);
    throw new Error("Condition is required. Must be either 'new' or 'used'");
  }
  
  // Validate condition parameter - only allow "new" or "used"
  const validConditions = ['new', 'used'];
  const normalizedCondition = condition.toLowerCase();
  if (!validConditions.includes(normalizedCondition)) {
    res.status(400);
    throw new Error(`Invalid condition. Must be either 'new' or 'used'`);
  }
  
  try {
    console.log(`🐛 DEBUG: Getting raw scraped data for "${productTitle}" with condition: "${normalizedCondition.toUpperCase()}"`);
    
    // Get raw eBay results with condition filtering
    const ebayResults = await scrapingService.scrapeEbay(productTitle, normalizedCondition);
    
    res.status(200).json({
      success: true,
      searchTerm: productTitle,
      condition: normalizedCondition.toUpperCase(),
      totalItems: ebayResults.length,
      rawData: ebayResults,
      message: `Found ${ebayResults.length} ${normalizedCondition.toUpperCase()} items from eBay scraping`
    });
    
  } catch (error) {
    console.error("❌ Error in debug scraping:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to get debug scraped data",
      error: error.message
    });
  }
});

/**
 * Get price suggestion for a product
 * Query parameters:
 * - productTitle: string (required)
 * - category: string (optional)
 * - condition: string (required) - Valid values: "new", "used" ONLY
 */
const getPriceSuggestion = asyncHandler(async (req, res) => {
  const { productTitle, category, condition } = req.query;
  
  if (!productTitle) {
    res.status(400);
    throw new Error("Product title is required");
  }
  
  if (!condition) {
    res.status(400);
    throw new Error("Condition is required. Must be either 'new' or 'used'");
  }
  
  // Validate condition parameter - only allow "new" or "used"
  const validConditions = ['new', 'used'];
  const normalizedCondition = condition.toLowerCase();
  if (!validConditions.includes(normalizedCondition)) {
    res.status(400);
    throw new Error(`Invalid condition. Must be either 'new' or 'used'`);
  }
  
  try {
    // Step 1: Scrape items from eBay only with condition filtering
    const ebayResults = await scrapingService.scrapeEbay(productTitle, normalizedCondition);
    
    // Use only eBay results
    const allItems = ebayResults;
    
    if (allItems.length === 0) {
      return res.status(200).json({
        success: false,
        message: `No ${normalizedCondition.toUpperCase()} items found to generate a price suggestion`
      });
    }
    
    // Step 2: Filter for relevance using string matching
    const relevantItems = allItems.filter(item => 
      suggestionService.checkRelevance(
        productTitle, 
        item.title, 
        item.description || ''
      )
    );
    
    if (relevantItems.length === 0) {
      return res.status(200).json({
        success: false,
        message: `No relevant ${normalizedCondition.toUpperCase()} items found to generate a price suggestion`
      });
    }
    
    // Step 3: Extract prices from relevant items
    const prices = relevantItems.map(item => item.price);
    
    // Step 4: Calculate recommended bid and statistics
    const suggestion = suggestionService.calculateRecommendedBid(
      productTitle,
      category,
      prices,
      normalizedCondition
    );
    
    // Include a selection of the relevant items in the response
    const items = relevantItems.map(item => ({
      title: item.title,
      price: item.price,
      source: item.source,
      condition: item.condition,
      url: item.url
    }));
    
    res.status(200).json({
      success: true,
      suggestion: {
        ...suggestion,
        condition: normalizedCondition.toUpperCase(),
        sources: relevantItems.length,
        items: items.slice(0, 10) // Return only top 10 items
      }
    });
    
  } catch (error) {
    console.error("Error generating price suggestion:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate price suggestion",
      error: error.message
    });
  }
});

module.exports = {
  getPriceSuggestion,
  getDebugScrapedData
}; 