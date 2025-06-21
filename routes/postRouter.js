const express = require("express");
const authController = require("./../controller/AuthController");
const postController = require("./../controller/PostController");
const upload = require("./../utils/upload");
const router = express.Router();
router.post(
    "/",
    authController.protect,
    upload.array("images", 5),
    postController.createPost
);
router.get("/", authController.protect, postController.getAllposts);
router.patch('/:id', authController.protect, postController.updatePost);
router.get("/:id", authController.protect, postController.getAllpostsUser);
router.delete("/:id", authController.protect, postController.deletePost);
module.exports = router;
