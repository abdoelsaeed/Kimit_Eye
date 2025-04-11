const User = require("../model/userModel");
const catchAsync = require('./../utils/catchAsyn');
const jwt = require("jsonwebtoken");
const AppError = require("./../utils/err");
const { promisify } = require("util");


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
    console.log(1);
    console.log(req.user);
    res.json({
      message: "Authentication successful",
      user: req.user,
    });
  } else {
    res.status(401).json({ message: "Authentication failed" });
  }
};

const signtoken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_COOKIE_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, req, res) => {
  const token = signtoken(user._id);
  res.cookie('jwt', token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https'
  });
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
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
  console.log(req.params)
  const newUser = await User.create(req.body);
  
  createSendToken(newUser, 201, req, res);
});

exports.protect = catchAsync(async (req, res, next) => {

  // التحقق مما إذا كان المستخدم مسجل دخول بالفعل (Facebook/Google)
  if (req.isAuthenticated()) {
    console.log('12')
    // تسجيل الدخول عبر Facebook
    if (req.user.provider === "facebook") {
      console.log("\x1b[34m%s\x1b[0m", "Logged in with Facebook");
    }
    // تسجيل الدخول عبر Google
    else if (req.user.provider === "google") {
      console.log("\x1b[31m%s\x1b[0m", "Logged in with Google");
    }
    req.user = req.user;
    return next()
  }

  // تسجيل الدخول التقليدي (بريد إلكتروني وكلمة مرور)
let token;
if (
  req.headers.authorization &&
  req.headers.authorization.startsWith("Bearer")
) {
  token = req.headers.authorization.split(" ")[1];
} else if (req.cookies.jwt) {
  token = req.cookies.jwt;
}
if (!token) {
  return next(
    new AppError("You are not logged in! please log in to get access", 401)
  );
}
//2)Verification token
const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
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
  createSendToken(user, 201, req, res);
});



exports.logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
      return next(err);
    }

    // تدمير الجلسة والتأكد من تنفيذها قبل إرسال الاستجابة
    req.session.destroy((err) => {
      if (err) {
        console.error(err);
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
  // 1) Get user based on POSTed email
  const user = await User.findOne({
    email: req.body.email,
    provider: { $nin: ["facebook", "google"] },
  });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  try {
  //   const resetURL = `${req.protocol}://${req.get(
  //     'host'
  //   )}/api/v1/users/resetPassword/${resetToken}`;
  //   await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email!'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was an error sending the email. Try again later!'),
      500
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
  //2) If token has not expired, and there is user, set the new password

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //3) Update changedPasswordAt property for the user

  //4) Log the user in, send JWT
  createSendToken(user, 200, req, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  
  const user = await User.findById(req.user.id).select('+password');
  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.password, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }

  // 3) If so, update password
  user.password = req.body.newPassword;
  user.confirmPassword = req.body.confirmNewPassword;
  await user.save({validateBeforeSave:false});
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, req, res);
});


    // exports.login = async (req, res, next) => {
    //     const email = req.user.email || req.body.email;
    //     const password = req.body.password || undefined;
    //     console.log(req.user);
    
    //     if (!email || !password) {
    //         return next(new AppError("please provide email and password!", 400));
    //     }
    //     const user = await User.findOne({ email }).select("+password");
    //     console.log(user)
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