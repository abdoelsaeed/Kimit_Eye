const mongoose = require("mongoose");

const hieroglyphSchema = new mongoose.Schema({
  className: {
    type: String,
    required: [true, "A hieroglyph must have a class name."],
    unique: true,
    trim: true,
  },
  information: {
    type: String,
    required: [true, "A hieroglyph must have information."],
    trim: true,
  },
  category: {
    type: String,
    required: [true, "A hieroglyph must have a category."],
    enum: ["Hieroglyph", "Attraction", "Landmark"],
  },
});

const Hieroglyph = mongoose.model("Hieroglyph", hieroglyphSchema);

module.exports = Hieroglyph; 