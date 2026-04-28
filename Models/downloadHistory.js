const mongoose = require("mongoose");

const downloadHistorySchema = new mongoose.Schema({
  fileURL: {
    type: String,
    required: true
  },
  downloadedAt: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
}, { timestamps: true }); 

const DownloadHistory = mongoose.model("DownloadHistory", downloadHistorySchema);

module.exports = DownloadHistory;
