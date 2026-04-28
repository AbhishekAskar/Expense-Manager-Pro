const mongoose = require("mongoose");

const forgotPasswordRequestSchema = new mongoose.Schema({
  id: {
    type: String, // UUID
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true }); 

const ForgotPasswordRequest = mongoose.model("ForgotPasswordRequest", forgotPasswordRequestSchema);

module.exports = ForgotPasswordRequest;
