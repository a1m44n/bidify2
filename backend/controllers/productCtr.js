const asyncHandler = require('express-async-handler');
const slugify = require('slugify');
const cloudinary = require('cloudinary').v2;    
const Product = require('../models/productModels');
const BiddingProduct = require('../models/biddingModel');
const Message = require('../models/messageModel');

// Helper function to calculate time left for auction
const getTimeLeft = (endTime) => {
    const now = new Date();
    const timeLeft = new Date(endTime) - now;
    
    if (timeLeft <= 0) return "Auction ended";
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
};

// Search products
const searchProducts = asyncHandler(async (req, res) => {
    try {
        const { query } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Base criteria for active auctions
        const searchCriteria = {
            isArchived: false,
            isSoldOut: false,
            auctionEndTime: { $gt: new Date() }
        };

        // Add text search if query provided
        if (query) {
            searchCriteria.$or = [
                { title: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ];
        }

        // Get total count and products
        const [total, products] = await Promise.all([
            Product.countDocuments(searchCriteria),
            Product.find(searchCriteria)
                .populate("user", "username")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
        ]);

        // Get current highest bid for each product
        const productsWithBids = await Promise.all(products.map(async (product) => {
            const highestBid = await BiddingProduct.findOne({ product: product._id })
                .sort({ price: -1 })
                .select('price');

            return {
                ...product.toObject(),
                currentBid: highestBid ? highestBid.price : product.price,
                timeLeft: getTimeLeft(product.auctionEndTime)
            };
        }));

        res.json({
            products: productsWithBids,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            message: "Error performing search",
            error: error.message
        });
    }
});

// Get search suggestions
const getSearchSuggestions = asyncHandler(async (req, res) => {
    const { query } = req.query;

    if (!query || query.length < 2) {
        return res.json([]);
    }

    const suggestions = await Product.find({
        isArchived: false,
        isSoldOut: false,
        title: { $regex: `^${query}`, $options: 'i' }
    })
    .distinct('title')
    .limit(5);

    res.json(suggestions);
});

const createProduct = asyncHandler (async (req, res) => {
    const { title, description, category, condition, price, height, lengthPic, widthPic, mediumUsed, weight, auctionDuration } = req.body;
    const userId = req.user.id;

    // Calculate auction end time
    const auctionEndTime = new Date();
    auctionEndTime.setDate(auctionEndTime.getDate() + parseInt(auctionDuration));

    const originalSlug = slugify(title, {  
        lower: true,
        remove: /[*+~.()'"!:@]/g,
        strict: true,
    });
    let slug = originalSlug;
    let suffix = 1;

    while (await Product.findOne({ slug })) {
        slug = `${originalSlug}-${suffix}`;
        suffix++;
    }

    if(!title || !description || !price || !auctionDuration) {
        res.status(404);
        throw new Error("Please fill all the fields");
    }
 
    let fileData = {};
    if(req.file) {
        let uploadedFile 
        try {
            uploadedFile = await cloudinary.uploader.upload(req.file.path, {
                folder: "Bidding/Product",
                resource_type: "image",
            });
        } catch (error) {
            res.status(500);
            throw new Error("Image could not be uploaded");
        }

        fileData = {
            fileName: req.file.originalname, 
            filePath: uploadedFile.secure_url,
            fileType: req.file.mimetype,
            public_id: uploadedFile.public_id,
        };
    }

    const product = await Product.create({
        user: userId,
        title,
        slug,
        description,
        category,
        condition,
        price,
        height,
        lengthPic,
        widthPic,
        mediumUsed,
        weight,
        image: fileData,
        auctionDuration: parseInt(auctionDuration),
        auctionEndTime
    });
    res.status(201).json({
        success: true,
        data: product,
    })
});
    
// Helper function to create auction end messages
const createAuctionEndMessages = async (product, highestBid) => {
    const notificationService = require('../utils/notificationService');
    
    if (highestBid) {
        // Create message for the winner and send Telegram notification if enabled
        await notificationService.sendAuctionWinNotification(
            product, 
            highestBid.user._id, 
            highestBid.price
        );

        // Create message for the seller (without congratulations text)
        await notificationService.sendAuctionEndNotification(
            product,
            product.user
        );
    } else {
        // Create message for the seller about no bids
        await notificationService.sendAuctionEndNotification(
            product,
            product.user
        );
    }
};

// Update getAllProducts function
const getAllProducts = asyncHandler(async (req, res) => {
    const now = new Date();

    // Find expired but not archived products
    const expiredProducts = await Product.find({
        auctionEndTime: { $lt: now },
        isArchived: false
    });

    // Process each expired product individually to set winner info
    for (const product of expiredProducts) {
        // Find the highest bid for this product
        const highestBid = await BiddingProduct.findOne({ product: product._id })
            .sort({ price: -1 })
            .populate("user", "username");
        
        // Update product with archive status and winner info if there was a bid
        const updateData = { isArchived: true };
        
        if (highestBid) {
            updateData.soldTo = highestBid.user._id;
            updateData.soldPrice = highestBid.price;
            updateData.isSoldOut = true;
        }
        
        // Create messages before updating the product
        await createAuctionEndMessages(product, highestBid);
        
        // Update the product
        await Product.findByIdAndUpdate(
            product._id,
            updateData,
            { new: true, runValidators: true }
        );
    }

    // Then get active products
    const products = await Product.find({
        isArchived: false,
        isSoldOut: false
    }).sort("-createdAt").populate("user");

    res.json(products);
});

const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id);

    if(!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    // check created user i.e. if post created id match with deleted product then only proceed to next stage 
    if(product.user?.toString() !== req.user.id) {
        res.status(401);
        throw new Error("User not authorized");
    }

    // now delete product from cloudinary store
    if(product.image && product.image.public_id) {
        try {
            await cloudinary.uploader.destroy(product.image.public_id)
        } catch (error) {
            console.log(error);
            res.status(500);
            throw new Error("Error deleting image from cloudinary");
        }
    }

    await Product.findByIdAndDelete(id);
    res.status(200).json({message : "{Product deleted  successfully"});
});

const updateProduct = asyncHandler (async (req, res) => {
    const { title, description, category, condition, price , height, lengthPic, widthPic, mediumUsed, weight } = req.body;
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }
    if(product.user?.toString() !== req.user.id) {
        res.status(401);
        throw new Error("User not authorized");
    }


    let fileData = {};
    if(req.file) {
        let uploadedFile 
        try {
            uploadedFile = await cloudinary.uploader.upload(req.file.path, {
                folder: "Bidding/Product",
                resource_type: "image",
            });
        } catch (error) {
            res.status(500);
            throw new Error("Image could not be uploaded");
        }


        // if user update image then delete previous image from cloudinary
        if(product.image && product.image.public_id) {
            try {
                await cloudinary.uploader.destroy(product.image.public_id)
            } catch (error) {
                console.log(error);
                res.status(500);
                throw new Error("Error deleting image from cloudinary");
            }
        }

        fileData = {
            fileName: req.file.originalname, 
            filePath: uploadedFile.secure_url,
            fileType: req.file.mimetype,
            public_id: uploadedFile.public_id,
        };
    }

    const updateProduct = await Product.findByIdAndUpdate(
        {
            _id: id,
        },
        {
            title,
            description, 
            category, 
            condition,
            price, 
            height, 
            lengthPic, 
            widthPic, 
            mediumUsed, 
            weight, 
            image: Object.keys(fileData).length === 0 ? Product?.image : fileData,
        }, {
            new: true,
            runValidators: true
        }
    );
    res.status(201).json(updateProduct);
});

const getAllProductsOfUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const products = await Product.find({ user: userId}).sort("-createdAt").populate("user");   

    res.json(products);
});

const getAllProductsByAdmin = asyncHandler(async (req, res) => {
    const products = await Product.find({}).sort("-createdAt").populate("user");

    res.json(products);
});

const deleteProductByAdmin = asyncHandler(async (req, res) => {
    const { productIds } = req.body;
    const product = await Product.findById(id);

    if(!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    

    // now delete product from cloudinary store
    if(product.image && product.image.public_id) {
        try {
            await cloudinary.uploader.destroy(product.image.public_id)
        } catch (error) {
            console.log(error);
            res.status(500);
            throw new Error("Error deleting image from cloudinary");
        }
    }

    await Product.findByIdAndDelete(productIds);
    res.status(200).json({message : "{Product deleted  successfully"});
});

// Update getProduct function
const getProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id)
        .populate("user", "username")
        .populate("soldTo", "username");
    
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }

    // Check if auction has ended and needs to be archived
    const now = new Date().getTime();
    const endTime = new Date(product.auctionEndTime).getTime();
    
    if (now > endTime && !product.isArchived) {
        // Find the highest bid for this product
        const highestBid = await BiddingProduct.findOne({ product: id })
            .sort({ price: -1 })
            .populate("user", "username");
        
        // Update product with archive status and winner info if there was a bid
        const updateData = { isArchived: true };
        
        if (highestBid) {
            updateData.soldTo = highestBid.user._id;
            updateData.soldPrice = highestBid.price;
            updateData.isSoldOut = true;
        }

        // Create messages before updating the product
        await createAuctionEndMessages(product, highestBid);
        
        // Update the product's archive status
        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
        .populate("user", "username")
        .populate("soldTo", "username");

        res.status(200).json(updatedProduct);
    } else {
        res.status(200).json(product);
    }
});

const getAllSoldProducts = asyncHandler(async (req, res) => {
    

    const products = await Product.find({ isSoldOut: true }).sort("-createdAt").populate("user");
    res.json(products);
});

const test = asyncHandler(async (req, res) => {
    res.json("Test Success");
});

const archiveProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findById(id);
    
    if (!product) {
        res.status(404);
        throw new Error("Product not found");
    }
    
    // Find the highest bid for this product
    const highestBid = await BiddingProduct.findOne({ product: id })
        .sort({ price: -1 })
        .populate("user", "username");
    
    // Update product with archive status and winner info if there was a bid
    const updateData = { isArchived: true };
    
    if (highestBid) {
        updateData.soldTo = highestBid.user._id;
        updateData.soldPrice = highestBid.price;
        updateData.isSoldOut = true;

        // Create messages before updating the product
        await createAuctionEndMessages(product, highestBid);
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
        id, 
        updateData,
        { new: true, runValidators: true }
    ).populate("user soldTo", "username");
    
    res.status(200).json({ 
        message: "Product archived successfully",
        product: updatedProduct
    });
});

const updateAuctionEndTime = asyncHandler(async (req, res) => {
    const { auctionEndTime } = req.body;
    
    try {
        // Update all products that aren't archived or sold
        await Product.updateMany(
            { 
                isArchived: false,
                isSoldOut: false
            },
            { 
                auctionEndTime: new Date(auctionEndTime)
            }
        );
        
        res.status(200).json({ message: "Auction end times updated successfully" });
    } catch (error) {
        res.status(400);
        throw new Error("Failed to update auction end time: " + error.message);
    }
});

const updateSingleAuctionEndTime = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { auctionEndTime } = req.body;
    
    try {
        const product = await Product.findById(id);
        
        if (!product) {
            res.status(404);
            throw new Error("Product not found");
        }

        if (product.isArchived || product.isSoldOut) {
            res.status(400);
            throw new Error("Cannot update ended auction");
        }

        // Update the auction end time
        product.auctionEndTime = new Date(auctionEndTime);
        await product.save();
        
        res.status(200).json({ 
            message: "Auction end time updated successfully",
            product
        });
    } catch (error) {
        res.status(400);
        throw new Error("Failed to update auction end time: " + error.message);
    }
});

const getUserArchivedProducts = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const products = await Product.find({ 
        user: userId,
        isArchived: true
    })
    .sort("-auctionEndTime")
    .populate("user", "username")
    .populate("soldTo", "username");

    res.status(200).json(products);
});

module.exports = {
    createProduct,
    getAllProducts,
    deleteProduct,
    updateProduct,
    getAllProductsOfUser,
    getAllProductsByAdmin,
    deleteProductByAdmin,
    getProduct,
    getAllSoldProducts,
    test,
    archiveProduct,
    updateAuctionEndTime,
    updateSingleAuctionEndTime,
    getUserArchivedProducts,
    searchProducts,
    getSearchSuggestions
};