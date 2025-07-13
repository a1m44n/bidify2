const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        require: true,
        ref: "User",
    },
    title: {
        type: String,
        require: [true, "Title is required"],
    },
}, 
    { 
    timestamps: true,
    }
); 

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;