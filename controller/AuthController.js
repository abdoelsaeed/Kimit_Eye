const User = require("./../model/userModel");
const catchAsync = require('./../utils/catchAsyn');
const jwt = require("jsonwebtoken");
const AppError = require("./../utils/err");
const Email = require('./../utils/Email');
const bcrypt = require("bcryptjs");
async function hashPassword(password) {
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
}
exports.callback_Facebook = (req, res) => {
  if (req.user) {
    res.json({
      message: "Authentication successful",
      user: req.user,
    });
  } else {
    res.status(401).json({ message: "Authentication failed" });
  }
};
exports.callback_google = (req, res) => {
  if (req.user) {
    
    
    res.json({
      message: "Authentication successful",
      user: req.user,
    });
  } else {
    res.status(401).json({ message: "Authentication failed" });
  }
};



exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};
exports.signup = catchAsync(async (req, res, next) => {
  const {password} = req.body;
  const hashedPassword = await hashPassword(password);
  const newUser = await User.create({...req.body,password:hashedPassword});
  
const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  expiresIn: "90d",
});
  //! التوكن ل param حولوا لcookiesعايز اشيل ال
  newUser.password = undefined;
  res.status(200).json({
    status: "success",
    token,
    data: {
      newUser,
    },
  });
});

exports.protect = catchAsync(async (req, res, next) => {

  // if (req.isAuthenticated()) {
  //   if (req.user.provider === "facebook") {
  //     
  //   }
  //   else if (req.user.provider === "google") {
  //     
  //   }
  //   req.user = req.user;
  //   return next()
  // }

const {token} = req.query;
  if (!token) {
    return next(new AppError("You are not logged in ", 400));
  }
//2)Verification token
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  

  //3)check if user still exists يعني مامسحش الاكونت مثلا
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("the user belonging to this token does not exist", 401)
    );
  }
  //4)check if user changed password after the token was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError("Your password has changed! please login again", 401)
    );
  }
  req.user = currentUser;
  res.locals.user = currentUser;

  next();
  } 
  catch (err) {
    
    return next(new AppError("Invalid or expired token", 401));
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  //1) check if email password is exist
  if (!email || !password) {
    return next(new AppError("please provide email and password!", 400));
  }
  //2) check if password and email is correct
  const user = await User.findOne({ email }).select("+password");
  //جوه الif عملتها user مش User لانه الuser واخد كل الصفات منه وفنفس الوقت هو اللي عنده المعلومات
  if (!user || !(await user.correctPassword(password, user.password))) {
    //لي  ماحطيتش متغير زي الuser لانه معتمد علي اليوزر يعني لو فيه مشكله البرنامج هيقف انما في if اول ما يلاقي الشرط الاول متحققش بيروح داخل if علي طول
    return next(new AppError("Incorrect email or password", 401));
  }
  //3) If everything is ok ,send token to client
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "90d",
  });
  //! التوكن ل param حولوا لcookiesعايز اشيل ال
  user.password = undefined;
  res.status(200).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
});



exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      
      return next(err);
    }

    // تدمير الجلسة والتأكد من تنفيذها قبل إرسال الاستجابة
    req.session.destroy((err) => {
      if (err) {
        
        return next(err);
      }

      // مسح الكوكيز
      res.clearCookie("jwt");
      res.clearCookie("connect.sid");

      // إرسال استجابة بعد إنهاء الجلسة
      res.status(200).json({
        status: "success",
        message: "Logged out successfully!",
      });
    });
  });
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError("Please provide email", 400));
  }
  const user = await User.findOne({ email });
  if (!user) {
    return next(new AppError("User not found", 404));
  }
  const code = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
  const hashedCode = await bcrypt.hash(code, 10);

  const url = `${req.protocol}://${req.get(
    "host"
  )}/resetPassword/${hashedCode}`;
  await new Email(user, url).sendPasswordReset(code);
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);
  user.resetPasswordToken = hashedCode;
  user.resetPasswordExpires = expiresAt;
  await user.save({validateBeforeSave:false});
  res.status(200).json({
    status: "success",
    message: "Password reset email sent",
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const { code } = req.params;
  const { newPassword, email } = req.body;
  if (newPassword.length < 6) {
    return next(
      new AppError("New password must be at least 6 characters long", 400)
    );
  }
  if (!newPassword || !email) {
    return next(new AppError("Please provide new password and email ", 400));
  }
  const user = await User.findOne({ email }).select('+password');
  

  if (!user) {
    return next(new AppError("User not found", 404));
  }
  const isPasswordCorrect = await bcrypt.compare(code, user.resetPasswordToken);
  if (!isPasswordCorrect) {
    return next(new AppError("Invalid code", 401));
  }
  if (user.resetPasswordExpires < new Date()) {
    return next(new AppError("Code expired", 401));
  }
  user.password = await hashPassword(newPassword);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save({ validateBeforeSave: false });
  res.status(200).json({
    status: "success",
    message: "Password reset successfully",
  });
});


exports.updatePassword = catchAsync(async (req, res, next) => {
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;
  if (newPassword.length < 6) {
    return next(
      new AppError("New password must be at least 6 characters long", 400)
    );
  }
  if (!oldPassword || !newPassword) {
    return next(
      new AppError("Please provide old password and new password", 400)
    );
  }
  const user = await User.findById(req.user.id).select("+password");
  

  const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
  
  if (!isPasswordCorrect) {
    return next(new AppError("Your old password is incorrect", 401));
  }
  const hashedPassword = await hashPassword(newPassword);
  user.password = hashedPassword;
  await user.save({ validateBeforeSave: false });
  res.status(200).json({
    status: "success",
    message: "Password updated successfully",
  });
});
    // exports.login = async (req, res, next) => {
    //     const email = req.user.email || req.body.email;
    //     const password = req.body.password || undefined;
    //     
    
    //     if (!email || !password) {
    //         return next(new AppError("please provide email and password!", 400));
    //     }
    //     const user = await User.findOne({ email }).select("+password");
    //     
    //     const token = jwt.sign(
    //         { id: user._id, name: user.name, email: user.email },
    //         process.env.JWT_SECRET,
    //         { expiresIn: "1h" }
    //     ); 
    //     res.cookie("jwt", token, {
    //         expiresIn: new Date(
    //           Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    //         ),
    //         secure: true, //يعني هيشتغل علي الhttps بس
    //         httpOnly: true, //ان مينفعش اي حد يعدل عليه هو بييجي مع الريكوست
    //         secure: req.secure || req.header("x-forwarded-proto") === "https",
    //     });
    //     user.password = undefined;
    //     res.status(statusCode).json({
    //         status: "success",
    //         token,
    //         data: {
    //             user,
    //         },
    //     }); 
    // }