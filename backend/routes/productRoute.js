const express = require('express');
const { 
    createProduct, 
    getAllProducts, 
    deleteProduct, 
    updateProduct, 
    getAllProductsOfUser,
    getAllProductsByAdmin, 
    deleteProductByAdmin, 
    getProduct,
    getAllSoldProducts, 
    archiveProduct,
    updateAuctionEndTime,
    updateSingleAuctionEndTime,
    getUserArchivedProducts,
    searchProducts,
    getSearchSuggestions,
} = require('../controllers/productCtr');
const { protect, isUser, isAdmin } = require('../middleware/authMiddleWare'); 
const { upload } = require('../utils/fileUpload');
const router = express.Router();

// Search routes (must come before /:id route)
router.get("/search", searchProducts);
router.get("/suggestions", getSearchSuggestions);

// User specific routes
router.get("/user", protect, getAllProductsOfUser);
router.get("/user/archived", protect, getUserArchivedProducts);

// Admin routes
router.get("/admin", protect, isAdmin, getAllProductsByAdmin);
router.delete("/admin/:id", protect, isAdmin, deleteProductByAdmin);

// Product management routes
router.get("/sold", protect, getAllSoldProducts);
router.post("/update-end-time", protect, updateAuctionEndTime);

// Basic product routes
router.post("/", protect, isUser, upload.single("image"), createProduct);
router.get("/", getAllProducts);

// Routes with parameters must come last
router.get("/:id", getProduct);
router.delete("/:id", protect, deleteProduct);
router.patch("/:id", protect, upload.single("image"), updateProduct);
router.patch("/:id/archive", protect, archiveProduct);
router.post("/update-end-time/:id", protect, updateSingleAuctionEndTime);

module.exports = router; 