const mongoose = require('mongoose');
const Product = require('./models/productModels');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_URL.split('@')[1],
  api_key: process.env.CLOUDINARY_URL.split('//')[1].split(':')[0],
  api_secret: process.env.CLOUDINARY_URL.split(':')[2].split('@')[0]
});

// Connect to MongoDB
mongoose.connect(process.env.DATABASE_CLOUD)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Helper function to generate slug
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

// Helper function to calculate auction end time
const calculateAuctionEndTime = (durationInDays) => {
  const endTime = new Date();
  endTime.setDate(endTime.getDate() + durationInDays);
  return endTime;
};

// Helper function to upload image to Cloudinary
async function uploadToCloudinary(imagePath) {
  try {
    const result = await cloudinary.uploader.upload(path.join(__dirname, 'uploads', imagePath), {
      folder: "Bidding/Product",
      resource_type: "image",
    });
    return {
      fileName: path.basename(imagePath),
      filePath: result.secure_url,
      fileType: path.extname(imagePath).substring(1),
      public_id: result.public_id,
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
}

// Sample listings data
const listings = [
  {
    title: "iPhone 13 Pro Max - 256GB - Sierra Blue",
    description: "Lightly used and in excellent condition. No scratches, battery health at 93%, and always in a case. Comes with original box and charger.",
    category: "Mobile Phone and Gadgets",
    condition: "Used",
    price: 799.99,
    height: 160.8,
    lengthPic: 78.1,
    widthPic: 7.65,
    weight: 0.238,
    auctionDuration: 7,
    image: {
      path: "iPhone 13 Pro Max - 256GB.jpg",
      filename: "iPhone 13 Pro Max - 256GB.jpg"
    }
  },
  {
    title: "Samsung Galaxy Watch 6 Classic - 47mm Black",
    description: "Brand new, sealed in box. Latest smartwatch with advanced health tracking, rotating bezel, and Wear OS support.",
    category: "Mobile Phone and Gadgets",
    condition: "New",
    price: 299.99,
    height: 46.5,
    lengthPic: 46.5,
    widthPic: 10.9,
    weight: 0.059,
    auctionDuration: 3,
    image: {
      path: "Samsung Galaxy Watch 6 Classic.jpeg",
      filename: "Samsung Galaxy Watch 6 Classic.jpeg"
    }
  },
  {
    title: "Anker PowerCore 20000mAh Portable Charger",
    description: "Reliable power bank with dual USB outputs and fast charging. Perfect for travel or emergencies. Used only twice.",
    category: "Mobile Phone and Gadgets",
    condition: "Used",
    price: 39.99,
    height: 158,
    lengthPic: 62,
    widthPic: 22,
    weight: 0.356,
    auctionDuration: 3,
    image: {
      path: "Anker PowerCore 20000mAh Portable Charger.jpg",
      filename: "Anker PowerCore 20000mAh Portable Charger.jpg"
    }
  },
  {
    title: "LEGO Star Wars Millennium Falcon (Set 75257)",
    description: "Complete set with all pieces and instruction manual. Slight wear on box edges but bricks in perfect shape.",
    category: "Hobbies and Toys",
    condition: "Used",
    price: 149.99,
    height: 44,
    lengthPic: 38,
    widthPic: 14,
    weight: 1.9,
    auctionDuration: 7,
    image: {
      path: "LEGO Millenium Falcon Star Wars.jpg",
      filename: "LEGO Millenium Falcon Star Wars.jpg"
    }
  },
  {
    title: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    description: "Top-tier ANC headphones with 30-hour battery, pristine sound, and comfortable design. Includes hard case.",
    category: "Audio",
    condition: "Used",
    price: 279.99,
    height: 254,
    lengthPic: 187,
    widthPic: 63,
    weight: 0.25,
    auctionDuration: 7,
    image: {
      path: "Sony WH-1000XM5.jpg",
      filename: "Sony WH-1000XM5.jpg"
    }
  },
  {
    title: "Audio-Technica AT2020 Condenser Microphone",
    description: "Ideal for podcasting or home recording. Used lightly for a school project. Comes with shock mount and XLR cable.",
    category: "Audio",
    condition: "Used",
    price: 89.99,
    height: 162,
    lengthPic: 52,
    widthPic: 52,
    weight: 0.345,
    auctionDuration: 3,
    image: {
      path: "Audio-Technica AT2020 Condenser Mic.jpg",
      filename: "Audio-Technica AT2020 Condenser Mic.jpg"
    }
  },
  {
    title: "Marshall Emberton II Portable Bluetooth Speaker",
    description: "Retro design with punchy bass and IP67 water resistance. Excellent condition, used occasionally at home.",
    category: "Audio",
    condition: "Used",
    price: 119.99,
    height: 68,
    lengthPic: 160,
    widthPic: 76,
    weight: 0.7,
    auctionDuration: 7,
    image: {
      path: "Marshall Emberton II Portable Bluetooth Speaker.jpg",
      filename: "Marshall Emberton II Portable Bluetooth Speaker.jpg"
    }
  },
  {
    title: "ASUS ROG Strix G15 Gaming Laptop - RTX 3060, Ryzen 7",
    description: "High-performance machine for gaming and productivity. 16GB RAM, 512GB SSD. Includes laptop bag and charger.",
    category: "Computer and Tech",
    condition: "Used",
    price: 999.99,
    height: 354,
    lengthPic: 259,
    widthPic: 27.2,
    weight: 2.3,
    auctionDuration: 14,
    image: {
      path: "ASUS ROG Strix G15 Gaming Laptop - RTX 3060, Ryzen 7.jpg",
      filename: "ASUS ROG Strix G15 Gaming Laptop - RTX 3060, Ryzen 7.jpg"
    }
  },
  {
    title: "Logitech MX Master 3S Wireless Mouse - Graphite",
    description: "Ergonomic design with silent clicks and MagSpeed scroll. Barely used, perfect for office or creative work.",
    category: "Computer and Tech",
    condition: "Used",
    price: 79.99,
    height: 124.9,
    lengthPic: 84.3,
    widthPic: 51,
    weight: 0.141,
    auctionDuration: 3,
    image: {
      path: "Logitech MX Master 3S Wireless Mouse - Graphite.jpg",
      filename: "Logitech MX Master 3S Wireless Mouse - Graphite.jpg"
    }
  },
  {
    title: "27In Dell Ultrasharp U2723QE 4K Monitor (USB-C)",
    description: "Factory-calibrated color for design or editing work. VESA mountable, includes original stand and box.",
    category: "Computer and Tech",
    condition: "Used",
    price: 549.99,
    height: 611.9,
    lengthPic: 533.8,
    widthPic: 190,
    weight: 6.9,
    auctionDuration: 7,
    image: {
      path: "27In Dell Ultrasharp U2723QE 4K Monitor (USB-C).jpg",
      filename: "27In Dell Ultrasharp U2723QE 4K Monitor (USB-C).jpg"
    }
  },
  {
    title: "Adidas Predator Freak.3 FG Football Boots - Size UK 9",
    description: "Worn for two games only. Cleaned and in excellent condition. Perfect for aggressive midfielders and strikers.",
    category: "Sports Equipment",
    condition: "Used",
    price: 49.99,
    height: 33,
    lengthPic: 29,
    widthPic: 11,
    weight: 0.225,
    auctionDuration: 3,
    image: {
      path: "Adidas Predator Freak.3 FG Football Boots.png",
      filename: "Adidas Predator Freak.3 FG Football Boots.png"
    }
  },
  {
    title: "Wilson Evolution Indoor Basketball - Size 7",
    description: "Used lightly for indoor play. Grippy composite leather cover, official weight and size.",
    category: "Sports Equipment",
    condition: "Used",
    price: 34.99,
    height: 24.1,
    lengthPic: 24.1,
    widthPic: 24.1,
    weight: 0.567,
    auctionDuration: 3,
    image: {
      path: "Wilson Evolution Indoor Basketball.jpg",
      filename: "Wilson Evolution Indoor Basketball.jpg"
    }
  }
];

// Function to create listings
async function createListings(userId) {
  try {
    if (!userId) {
      throw new Error('userId is required to create listings');
    }

    for (const listing of listings) {
      // Upload image to Cloudinary
      const imageData = await uploadToCloudinary(listing.image.path);
      
      const product = new Product({
        ...listing,
        user: userId,
        slug: generateSlug(listing.title),
        auctionEndTime: calculateAuctionEndTime(listing.auctionDuration),
        image: imageData
      });

      await product.save();
      console.log(`Created listing: ${listing.title}`);
    }

    console.log('All listings created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating listings:', error);
    process.exit(1);
  }
}

// Usage:
// node createListings.js <userId>
const userId = process.argv[2];
if (!userId) {
  console.error('Please provide a userId as a command line argument');
  process.exit(1);
}

createListings(userId); 