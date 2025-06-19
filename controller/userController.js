const User = require("../model/userModel");
const catchAsync = require('./../utils/catchAsyn');
const AppError = require('./../utils/err')

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
      if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
  };
exports.updateMe = catchAsync(async (req, res, next) => {
 
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
      return next(
        new AppError(
          'This route is not for password updates. Please use /updateMyPassword.',
          400
        )
      );
    }
    // 2) Filtered out unwanted fields names that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) filteredBody.photo = req.file.filename;
  
    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true
    });
  
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  });
  
  exports.getMe = catchAsync(async (req, res, next) => {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return next(new AppError("User not found", 404));
    res.status(200).json({
      status: "success",
      data: {
        user: user
      }
    });
  });

  
  exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, {
      active: false
    });
  
    res.status(204).json({
      status: 'success',
      data: null
    });
  });


  exports.getAllUsers = catchAsync(async (req, res,next) => {
    const users = await User.find();
  
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  });

  exports.getUserById = catchAsync(async (req, res,next) => {
    if(req.user.id===req.params.id){
      return next(
        new AppError(
          "This route is not yet defined!, please use /me instead.",
          403
        )
      );
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return next(new AppError('No user found with that ID', 404));
    }
  
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  });
  exports.updateUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!user) {
      return next(new AppError('No user found with that ID', 404));
    }
    res.status(200).json({
        status:'success',
        data: {
          user
        }
    });
  });
  exports.deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return next(new AppError('No user found with that ID', 404));
    }
    res.status(204).json({
        status:'success',
        data: null
    });
  });