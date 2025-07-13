const asyncHandler = require('express-async-handler');
const User = require('../models/UserModels');
const jwt = require('jsonwebtoken');

const protect = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies.token
        if(!token) {
            res.status(401)
            throw new Error("Not authorized to access this page, please login");
        }

        const verified = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(verified.id).select("-password");

        if(!user) {
            res.status(401)
            throw new Error("User not found");
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(400);
        throw new Error("Not authorized to access this page, please login");
    }
});

const isAdmin = (req, res, next) => {
    if(req.user && req.user.role === "admin") {
        next();
    } else {
        res.status(403);
        throw new Error("Not authorized as an admin");
    }
};

const isUser = (req, res, next) => {
    if(req.user && (req.user.role === "user" || req.user.role === "admin")) {
        next();
    } else {
        res.status(403);
        throw new Error("Access Denied");
    }
};

const isSeller = (req, res, next) => {
    if(req.user && (req.user.role === "user" || req.user.role === "admin")) {
        next();
    } else {
        res.status(403);
        throw new Error("Access Denied");
    }
};

module.exports = {
    protect,
    isAdmin,
    isUser,
    isSeller
};