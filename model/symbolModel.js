const mongoose = require("mongoose");

const SymbolSchema = new mongoose.Schema({
  className: { type: String, required: true, unique: true, lowercase: true },
  information: { type: String, required: true },
  category: {
    type: String,
    enum: ["Hieroglyph", "Attraction", "Landmark"],
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
});
const detectedClassSchema = mongoose.model("Symbol", SymbolSchema);

module.exports = detectedClassSchema;