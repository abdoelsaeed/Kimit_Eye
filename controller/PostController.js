const catchAsync = require("./../utils/catchAsyn");
const AppError = require("./../utils/err");
const Post = require('./../model/postModel');
const User = require('./../model/userModel');
exports.generateFileUrl = (filename)=>{
    return process.env.URL+`uploads/`+ filename
}
exports.createPost = catchAsync(async (req, res, next) => {
    console.log(req.files);
    const id = req.user._id;
    const user = await User.findById(id);
    const files = req.files;
    let imagesURL;
    if(files){
        imagesURL = files.map(file => this.generateFileUrl(file.filename));
    }
    const post = await Post.create({
      user: id,
      ...req.body,
      images: files ? imagesURL : null,
    });
    user.posts.push(post._id);
    await user.save({ validateBeforeSave: false });
    res.status(200).json({
      status: "success",
      data: {
        post: post,
      },
    });
});
exports.updatePost = catchAsync(async (req, res, next) => {
  const postId = req.params.id;
  const post = await Post.findById(postId);
  const {likes,user,createdAt,updatedAt} =req.body;
  if (likes || user || createdAt || updatedAt) return next(new AppError("You are not allowed to update this attribute 🤬", 404));
  if (!post) return next(new AppError("Post not found", 404));
  const sameUserOrNot = post.user.toString() === req.user._id.toString() ? true : false;

  if (!sameUserOrNot) return next(new AppError("You are not owner of this post 🤬", 404));
  const keys = Object.keys(req.body);
  keys.forEach(key => {
    post[key] = req.body[key];
  });
  await post.save({ validateBeforeSave: false });
  res.status(200).json({
    status: "success",
    data: {
      post: post,
    },
  });
});
exports.getAllpostsUser = catchAsync(async (req, res, next) => {
  const userId = req.params.id;

  const posts = await Post.find({ user: userId }).populate(
    "user",
    "name photo "
  );
  if (posts.length === 0) return next(new AppError("No posts found", 404));
  res.status(200).json({
    status: "success",
    data: {
      posts,
    },
  });
});
exports.getAllposts = catchAsync(async (req, res, next) => {
  const userId = req.params.id;

  const posts = await Post.find().populate(
    "user",
    "name photo "
  );
  if (posts.length === 0) return next(new AppError("No posts found", 404));
  res.status(200).json({
    status: "success",
    data: {
      posts,
    },
  });
});
exports.deletePost = catchAsync(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  console.log(post);
  if (!post) return next(new AppError("Post not found", 404));
  const sameUserOrNot =
    post.user.toString() === req.user._id.toString() ? true : false;
  if (!sameUserOrNot)
    return next(new AppError("You are not owner of this post ��", 404));
  await Post.deleteOne({ _id: req.params.id });
  res.status(204).json({
    status: "success",
    data: null,
  });
});