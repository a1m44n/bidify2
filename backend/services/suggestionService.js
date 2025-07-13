const axios = require('axios');
const OpenAI = require('openai');

// Configure OpenAI with new syntax
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate expanded keywords for better search results
async function generateExpandedKeywords(productTitle, category) {
  try {
    const prompt = `
Generate 5-7 search keywords or phrases for finding similar items to: "${productTitle}" (Category: ${category}).
Include synonyms, model numbers if applicable, and common market phrases.
Format as a JSON array of strings.
Example: ["keyword1", "keyword2", ...]
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = response.choices[0].message.content.trim();
    // Extract JSON array from response
    const match = content.match(/\[[\s\S]*\]/);
    return match ? JSON.parse(match[0]) : [productTitle]; // Fallback to original title
  } catch (error) {
    console.error("Error generating keywords:", error);
    return [productTitle]; // Fallback to original title
  }
}

// Clean price data by removing outliers
function cleanPriceOutliers(prices) {
  if (prices.length <= 2) return prices;
  
  // Sort prices
  const sortedPrices = [...prices].sort((a, b) => a - b);
  
  // Calculate Q1, Q3, and IQR
  const q1Index = Math.floor(sortedPrices.length * 0.25);
  const q3Index = Math.floor(sortedPrices.length * 0.75);
  const q1 = sortedPrices[q1Index];
  const q3 = sortedPrices[q3Index];
  const iqr = q3 - q1;
  
  // Define outlier boundaries (1.5 * IQR)
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  
  // Filter out outliers
  return prices.filter(price => price >= lowerBound && price <= upperBound);
}

// Check if a scraped item is relevant to the original search using simple string matching
function checkRelevance(originalItem, scrapedItemTitle, scrapedItemDescription = "") {
  const normalizedOriginal = originalItem.toLowerCase().trim();
  const normalizedTitle = scrapedItemTitle.toLowerCase().trim();
  const normalizedDesc = scrapedItemDescription.toLowerCase().trim();
  
  // Split search terms and check if they appear in the title or description
  const searchTerms = normalizedOriginal.split(/\s+/);
  const matchCount = searchTerms.filter(term => 
    normalizedTitle.includes(term) || normalizedDesc.includes(term)
  ).length;
  
  // Consider it relevant if at least 50% of search terms are found
  return matchCount >= Math.ceil(searchTerms.length * 0.5);
}

// Calculate recommended bid based on cleaned data
function calculateRecommendedBid(productTitle, category, prices, itemCondition = "New") {
  // Clean outliers
  const cleanedPrices = cleanPriceOutliers(prices);
  
  if (cleanedPrices.length === 0) return null;
  
  // Calculate statistics
  const min = Math.min(...cleanedPrices);
  const max = Math.max(...cleanedPrices);
  const avg = cleanedPrices.reduce((sum, price) => sum + price, 0) / cleanedPrices.length;
  
  // Sort for median
  const sortedPrices = [...cleanedPrices].sort((a, b) => a - b);
  const median = sortedPrices[Math.floor(sortedPrices.length / 2)];
  
  // Calculate recommended bid (90% of median price)
  const recommendedBid = parseFloat((median * 0.9).toFixed(2));
  
  return {
    recommendedBid,
    reasoning: `Based on analysis of similar items, with prices ranging from $${min.toFixed(2)} to $${max.toFixed(2)}.`,
    priceRange: { min, max },
    averagePrice: parseFloat(avg.toFixed(2)),
    medianPrice: parseFloat(median.toFixed(2)),
    cleanedPrices,
    originalPrices: prices
  };
}

module.exports = {
  generateExpandedKeywords,
  checkRelevance,
  cleanPriceOutliers,
  calculateRecommendedBid
}; 