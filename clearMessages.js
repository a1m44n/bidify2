const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

// Use the correct connection string from .env
const MONGODB_URI = process.env.DATABASE_CLOUD;

if (!MONGODB_URI) {
    console.error('Error: DATABASE_CLOUD not found in .env file');
    process.exit(1);
}

async function clearMessages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');

    // Get the collection and delete all documents
    const result = await mongoose.connection.collection('messages').deleteMany({});
    
    console.log(`Deleted ${result.deletedCount} documents from messages collection`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
}

// Run the function
clearMessages(); 