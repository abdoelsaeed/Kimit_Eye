const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require("crypto");
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Please provide your email"],
    lowercase: true,
    validators: [validator.isEmail, "Please validate your email"],
  },
  photo: { type: String, default: "default.jpg" },
  role: {
    type: String,
    default: "user",
    enum: ["user","admin"],
  },
  active: { type: String, default:true },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function (value) {
        return value === this.password;
      },
      message: "Confirm password must match the original password.",
    },
  },
  facebookId:String,
  googleId:String,
  provider:String,
  
});

userSchema.pre("save", async function (next) {
  //only run this function if password was actually modified
  if (!this.isModified("password")) return next();
  //كده انا عملتها async كان قدامي اعملها sync بس مش هينفع عشان هتقفل الايفنت لوب
  this.password = await bcrypt.hash(this.password, 12);

  //الmiddleware بتحصل لما ادخل الداتا يعني معايا الداتا بس لسه مارحتش للداتا بيز فانا بتاكد انه مطابق للباسورد وبعد كده بصفره ومرضيتش امسحه لاني خليته required
  this.confirmPassword = undefined;
  next();
});
userSchema.pre(/^find/,function(next){
    this.find({active:{$ne:false}});
    next();
});
userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false; //password not changed
};
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  // console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};
const User = mongoose.model("User", userSchema);
module.exports = User;