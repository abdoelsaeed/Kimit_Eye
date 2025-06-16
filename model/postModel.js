const mongoose = require("mongoose");
const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: [true, "You must provide a user"],
    },
    caption: {
      type: String,
      required: [true, "you forgot the caption"],
    },
    images: [
      {
        type: String,
        required: false,
      },
    ],
  },
  { timestamps: true }
);
const Post = mongoose.model("Post", postSchema);
module.exports = Post;