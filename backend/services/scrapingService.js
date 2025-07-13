const axios = require('axios');
const cheerio = require('cheerio');

// Function to scrape individual eBay listing
async function scrapeEbayListing(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    // Try different selectors as eBay's structure might vary
    const priceElement = $('.x-price-primary') || $('#prcIsum') || $('.vi-price');
    let priceText = priceElement.text().trim();
    
    if (priceText) {
      return parseFloat(priceText.replace(/[^\d.]/g, ''));
    }
    return null;
  } catch (error) {
    console.error('Error scraping individual eBay listing:', error);
    return null;
  }
}

// Function to scrape eBay
async function scrapeEbay(searchTerm, condition) {
  try {
    const encodedSearchTerm = encodeURIComponent(searchTerm);
    
    // Validate condition parameter - only allow "new" or "used"
    if (!condition || !['new', 'used'].includes(condition.toLowerCase())) {
      throw new Error('Condition is required and must be either "new" or "used"');
    }
    
    const normalizedCondition = condition.toLowerCase();
    
    // Add condition filtering to URL
    let conditionParam = '';
    if (normalizedCondition === 'new') {
      conditionParam = '&LH_ItemCondition=1000'; // New items only
    } else if (normalizedCondition === 'used') {
      conditionParam = '&LH_ItemCondition=3000'; // Used items only
    }
    
    const url = `https://www.ebay.com/sch/i.html?_nkw=${encodedSearchTerm}&_sacat=0&LH_Sold=1&LH_Complete=1${conditionParam}`;
    
    console.log(`🔍 Scraping eBay for: "${searchTerm}" with condition: "${normalizedCondition.toUpperCase()}"`);
    console.log(`📍 URL: ${url}`);
    
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    const items = [];
    const promises = [];
    
    console.log(`📊 Found ${$('.s-item__wrapper').length} item wrappers on page`);
    
    $('.s-item__wrapper').each((index, element) => {
      // Skip the first element which is usually a heading
      if (index === 0) return;
      
      const title = $(element).find('.s-item__title').text().trim();
      if (!title || title.includes('Shop on eBay')) return;
      
      let priceText = $(element).find('.s-item__price').text().trim();
      // Remove "to" price ranges if present
      if (priceText.includes(' to ')) {
        priceText = priceText.split(' to ')[0];
      }
      
      const searchPrice = parseFloat(priceText.replace(/[^\d.]/g, ''));
      if (isNaN(searchPrice)) return;
      
      const url = $(element).find('a.s-item__link').attr('href');
      const description = $(element).find('.s-item__subtitle').text().trim();
      
      // Log raw data for each item found
      console.log(`\n📦 Item ${index}:`);
      console.log(`   Title: ${title}`);
      console.log(`   Price Text: "${priceText}"`);
      console.log(`   Parsed Price: $${searchPrice}`);
      console.log(`   Description: ${description}`);
      console.log(`   URL: ${url}`);
      
      // Create a promise for each listing to fetch its actual price
      promises.push(
        scrapeEbayListing(url).then(actualPrice => {
          if (actualPrice) {
            console.log(`   ✅ Got actual price from listing: $${actualPrice}`);
            items.push({
              title,
              description,
              price: actualPrice, // Use the actual price from the listing page
              searchPrice, // Keep the search result price for reference
              source: 'eBay',
              condition: normalizedCondition.toUpperCase(), // Clean uppercase condition
              url
            });
          } else {
            console.log(`   ⚠️  Using search price as fallback: $${searchPrice}`);
            items.push({
              title,
              description,
              price: searchPrice, // Fallback to search price if listing page scraping fails
              source: 'eBay',
              condition: normalizedCondition.toUpperCase(), // Clean uppercase condition
              url
            });
          }
        }).catch(() => {
          console.log(`   ❌ Failed to get actual price, using search price: $${searchPrice}`);
          // If individual scraping fails, still add the item with search price
          items.push({
            title,
            description,
            price: searchPrice,
            source: 'eBay',
            condition: normalizedCondition.toUpperCase(), // Clean uppercase condition
            url
          });
        })
      );
    });
    
    // Wait for all individual listing scrapes to complete
    await Promise.all(promises);
    
    console.log(`\n📋 FINAL RESULTS for "${searchTerm}" (condition: ${normalizedCondition.toUpperCase()}):`);
    console.log(`   Total items scraped: ${items.length}`);
    items.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.title} - $${item.price} (${item.source}) [${item.condition}]`);
    });
    console.log(`\n🎯 Raw scraped data:`, JSON.stringify(items, null, 2));
    
    return items;
  } catch (error) {
    console.error(`❌ Error scraping eBay for ${searchTerm}:`, error);
    return [];
  }
}

module.exports = {
  scrapeEbay,
}; 