const passport = require("passport");
const User = require("./../model/userModel");

// توصيل الاستراتيجيات
require("./passportFacebook");
require("./passportGoogle");

// تهيئة serializeUser و deserializeUser
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
