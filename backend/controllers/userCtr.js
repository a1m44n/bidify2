const asyncHandler = require('express-async-handler');
const User = require('../models/UserModels');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {expiresIn: "1d"});
};

const registerUser = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) { 
        res.status(400);
        throw new Error("Please fill in all fields");
    }

    // Check if username exists
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
        res.status(400);
        throw new Error("Username is already taken");
    }

    // Check if email exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
        res.status(400);
        throw new Error("Email is already in use");
    }

    const user = await User.create({
        username, 
        email, 
        password,
    });

    const token = generateToken(user._id);
    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400),
        sameSite: "none",
        secure: true,
    });

    if (user) {
        const { _id, username, email, photo, role } = user;
        res.status(201).json({ _id, username, email, photo, role, token });
    } else {
        res.status(400);
        throw new Error("Invalid user data");
    }
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error("Please enter your email and password");
    } 

    const user = await User.findOne({ email });
    if(!user) {
        res.status(400);
        throw new Error("Invalid email or password");
    }

    const passwordIsCorrect = await bcrypt.compare(password, user.password);

    const token = generateToken(user._id);
    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400),
        sameSite: "none",
        secure: true,
    });


    if(user && passwordIsCorrect) {
        const { _id, username, email, photo, role } = user;
        res.status(201).json({ _id, username, email, photo, role });
    } else {
        res.status(400);
        throw new Error("Invalid User Data");
    }
});

const loginStatus = asyncHandler(async (req, res) => {
    const token = req.cookies.token;
    if(!token) {
        return res.json(false);
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if(verified) {
        return res.json(true);
    }
    return res.json(false);
});

const logoutUser = asyncHandler(async (req, res) => {
    res.cookie("token", "", {
        path: "/",
        httpOnly: true,
        expires: new Date(0),
        sameSite: "none",
        secure: true,
    });
    return res.status(200).json({message: "Successfully Logged Out"});
});

const loginAsSeller = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400);
        throw new Error("Please enter your email and password");
    } 

    const user = await User.findOne({ email });
    if(!user) {
        res.status(400);
        throw new Error("User not found, please sign up first");
    }

    const passwordIsCorrect = await bcrypt.compare(password, user.password);
    if(!passwordIsCorrect) {
        res.status(400);
        throw new Error("Invalid Password");
    }

    // if password is correct update the role to the seller account => here user must be registered
    user.role = "seller";
    await user.save();

    const token = generateToken(user._id);
    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400),
        sameSite: "none",
        secure: true,
    });


    if(user && passwordIsCorrect) {
        const { _id, name, email, photo, role } = user;
        res.status(201).json({ _id, name, email, photo, role });
    } else {
        res.status(400);
        throw new Error("Inavalid User Data");
    }
});

const getUser = asyncHandler(async (req, res) => {
    // now we have created a middleware
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json(user);
});

// Get user profile by ID for public viewing
const getUserProfile = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    
    try {
        // Only return public information - exclude sensitive data
        const user = await User.findById(userId).select("username email telegramHandle role createdAt");
        
        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }
        
        res.status(200).json(user);
    } catch (error) {
        res.status(500);
        throw new Error("Error fetching user profile");
    }
});

const getUserBalance = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if(!user) {
        res.status(404);
        throw new Error("User not found");
    }

    res.status(200).json({
        balance: user.balance,
    });
}); 

const getAllUser = asyncHandler(async (req, res) => {
    const userList = await User.find({});

    if(!userList.length) {
        return res.status(404).json({message: "No user found"});
    }
    res.status(200).json(userList);
}); 
const estimateIncome = asyncHandler(async (req, res) => {
    try {
        const admin = await User.findOne({role: "admin"});
        if (!admin) {
            return res.status(404).json({message: "No user found found"});
        }
        const commisionBalance = admin.commisionBalance;
        res.status(200).json({commisionBalance});  
    } catch (error) {
        res.status(500).json({message: "Internal Server Error"});
    }
}); 

// Update user's Telegram settings
const updateTelegramSettings = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { telegramChatId, notificationPreferences } = req.body;
    
    try {
        const user = await User.findById(userId);
        
        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }
        
        // Update Telegram chat ID if provided
        if (telegramChatId !== undefined) {
            user.telegramChatId = telegramChatId;
        }
        
        // Update notification preferences if provided
        if (notificationPreferences && notificationPreferences.telegram) {
            if (!user.notificationPreferences) {
                user.notificationPreferences = {};
            }
            
            if (!user.notificationPreferences.telegram) {
                user.notificationPreferences.telegram = {};
            }
            
            const telegramPrefs = notificationPreferences.telegram;
            
            // Update individual preference settings if provided
            if (telegramPrefs.enabled !== undefined) {
                user.notificationPreferences.telegram.enabled = telegramPrefs.enabled;
            }
            
            if (telegramPrefs.notifyOnOutbid !== undefined) {
                user.notificationPreferences.telegram.notifyOnOutbid = telegramPrefs.notifyOnOutbid;
            }
            
            if (telegramPrefs.notifyOnWin !== undefined) {
                user.notificationPreferences.telegram.notifyOnWin = telegramPrefs.notifyOnWin;
            }
            
            if (telegramPrefs.notifyOnAuctionEnd !== undefined) {
                user.notificationPreferences.telegram.notifyOnAuctionEnd = telegramPrefs.notifyOnAuctionEnd;
            }
        }
        
        await user.save();
        
        // Return only the notification settings in the response
        res.status(200).json({
            telegramChatId: user.telegramChatId,
            notificationPreferences: user.notificationPreferences
        });
    } catch (error) {
        res.status(500);
        throw new Error("Error updating Telegram settings: " + error.message);
    }
});

// Get user's Telegram settings
const getTelegramSettings = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    try {
        const user = await User.findById(userId);
        
        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }
        
        // Return only the Telegram settings
        res.status(200).json({
            telegramChatId: user.telegramChatId || "",
            notificationPreferences: user.notificationPreferences || {
                telegram: {
                    enabled: false,
                    notifyOnOutbid: true,
                    notifyOnWin: true,
                    notifyOnAuctionEnd: true
                }
            }
        });
    } catch (error) {
        res.status(500);
        throw new Error("Error fetching Telegram settings: " + error.message);
    }
});

// Update user's Telegram handle
const updateTelegramHandle = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { telegramHandle } = req.body;
    
    try {
        const user = await User.findById(userId);
        
        if (!user) {
            res.status(404);
            throw new Error("User not found");
        }
        
        // Validate telegram handle (optional: add more validation)
        if (telegramHandle && typeof telegramHandle !== 'string') {
            res.status(400);
            throw new Error("Invalid telegram handle format");
        }
        
        // Clean the handle (remove @ if present and trim)
        const cleanHandle = telegramHandle ? telegramHandle.replace('@', '').trim() : '';
        
        // Update the telegram handle
        user.telegramHandle = cleanHandle;
        await user.save();
        
        // Return updated user data (without password)
        const updatedUser = await User.findById(userId).select("-password");
        
        res.status(200).json({
            message: "Telegram handle updated successfully",
            user: updatedUser
        });
    } catch (error) {
        res.status(500);
        throw new Error("Error updating Telegram handle: " + error.message);
    }
});

module.exports = {
    registerUser,
    loginUser,
    loginStatus,
    logoutUser,
    loginAsSeller,
    getUser,
    getUserProfile,
    getUserBalance,
    getAllUser,
    estimateIncome,
    updateTelegramSettings,
    getTelegramSettings,
    updateTelegramHandle
}