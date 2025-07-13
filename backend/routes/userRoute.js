const express = require('express');
const { registerUser } = require("../controllers/userCtr");
const { loginUser } = require("../controllers/userCtr");
const { loginStatus } = require("../controllers/userCtr");
const { logoutUser } = require("../controllers/userCtr");
const { getUser } = require("../controllers/userCtr");
const { getUserProfile } = require("../controllers/userCtr");
const { protect, isAdmin } = require("../middleware/authMiddleWare");
const { getUserBalance } = require("../controllers/userCtr");
const { getAllUser } = require("../controllers/userCtr");
const { estimateIncome } = require("../controllers/userCtr");
const { updateTelegramSettings } = require("../controllers/userCtr");
const { getTelegramSettings } = require("../controllers/userCtr");
const { updateTelegramHandle } = require("../controllers/userCtr");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/loggedIn", loginStatus);
router.get("/logout", logoutUser);
router.get("/getuser", protect, getUser);
router.get("/profile/:userId", getUserProfile); // Public route to get user profile by ID
router.get("/sell-amount", protect, getUserBalance);

router.get("/estimate-income", protect, isAdmin, estimateIncome); //can only be accessed by admin
router.get("/users", protect, isAdmin, getAllUser); //can only be accessed by admin

// Telegram notification settings
router.get("/telegram-settings", protect, getTelegramSettings);
router.put("/telegram-settings", protect, updateTelegramSettings);

// Telegram handle update
router.put("/update-telegram-handle", protect, updateTelegramHandle);

module.exports = router; 