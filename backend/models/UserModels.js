const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, "Please provide a username"],
        unique: true,
        trim: true,
        minLength: [3, "Username must be at least 3 characters"]
    },
    email: {
        type: String,
        required: [true, "Please provide your email"],
        unique: true
    },
    password:{
        type: String,
        require:[true,"Please provide your password"],
    },
    photo:{
        type: String,
        default: [true, "Please add an avatar"],
        default: "",
    },
    role:{
        type: String,
        enum: ["admin", "user"],
        default: "user",
    },
    commisionBalance:{
        type: Number,
        default: 0,
    },
    balance:{
        type: Number,
        default: 0, 
    },
    telegramChatId: {
        type: String,
        default: "",
    },
    telegramHandle: {
        type: String,
        default: "",
    },
    notificationPreferences: {
        telegram: {
            enabled: {
                type: Boolean,
                default: false
            },
            notifyOnOutbid: {
                type: Boolean,
                default: true
            },
            notifyOnWin: {
                type: Boolean,
                default: true
            },
            notifyOnAuctionEnd: {
                type: Boolean,
                default: true
            }
        }
    }
},
{timestamp: true}
);

userSchema.pre("save", async function(next){
    if(!this.isModified("password")){
        return next();
    }
    
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(this.password, salt);
    this.password = hashedPassword;
    next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;