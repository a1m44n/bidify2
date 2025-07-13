const dotenv = require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const userRoute = require('./routes/userRoute');
const productRoute = require('./routes/productRoute');
const biddingRoute = require('./routes/biddingRoute');
const autoBidRoute = require('./routes/autoBidRoute');
const categoryRoute = require('./routes/categoryRoute');
const errorHandler = require('./middleware/errorMiddleWare');
const messageRoutes = require("./routes/messageRoutes");
const suggestionRoute = require('./routes/suggestionRoute');
const telegramWebhookRoute = require('./routes/telegramWebhookRoute');
const wishlistRoute = require('./routes/wishlistRoute');
const auctionMonitorService = require('./services/auctionMonitorService');

const app = express();

app.use(express.json());
app.use(cookieParser()); 

app.use(
    express.urlencoded({
        extended: false,
    })
);

app.use(bodyParser.json()); 

// CORS configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? [process.env.CLIENT_URL, process.env.FRONTEND_URL] // Production domains
        : true, // Allow all origins in development
    credentials: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

const PORT = process.env.PORT || 8080;
app.use("/api/users", userRoute);
app.use("/api/product", productRoute);
app.use("/api/bidding", biddingRoute);
app.use("/api/auto-bid", autoBidRoute);
app.use("/api/category", categoryRoute);
app.use("/api/messages", messageRoutes);
app.use("/api/suggestion", suggestionRoute);
app.use("/api/telegram/webhook", telegramWebhookRoute);
app.use("/api/wishlist", wishlistRoute);

app.use(errorHandler);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
    res.send("Bidify API - Server Running");
});

// Health check endpoint for App Platform
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

mongoose.connect(process.env.DATABASE_CLOUD,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    app.listen(PORT, () => {
        console.log(`Server Running on port  ${PORT}`);
        // Start the auction monitor service
        auctionMonitorService.start();
        console.log('Auction monitor service started');
    });
})
.catch ((err) => {
    console.log(err);
}); 


