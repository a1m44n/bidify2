const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

// Use the correct connection string from .env
const MONGODB_URI = process.env.DATABASE_CLOUD;

if (!MONGODB_URI) {
    console.error('Error: DATABASE_CLOUD not found in .env file');
    process.exit(1);
}

// Define the Category schema (matching your backend/models/categoryModel.js)
const categorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    title: {
        type: String,
        required: [true, 'Title is required'],
    },
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);

async function createCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Example categories to insert (replace user ObjectId with a valid one from your DB)
    const categories = [
      { user: '67e0205356e891d519ebd9f8', title: 'Others' }
    ];

    const result = await Category.insertMany(categories);
    console.log(`Inserted ${result.length} categories.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

// Run the function
createCategories(); 