const mongoose = require("mongoose");
const historySchema = new mongoose.Schema({
  user: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: [true, "tou must but a user"],
  },
  name: String,
  searchedAt: {
    type: Date,
    default: Date.now,
  },
  address: String,
  location: {
    type: {
      type: String,
      default: "Point",
      enum: ["Point"], // النوع الجغرافي هو Point فقط
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
});
historySchema.index({ location: "2dsphere" });

const history = mongoose.model("History", historySchema);

module.exports = history;