const User = require('../model/userModel');
const passport = require("passport");
const FacebookStrategy = require('passport-facebook').Strategy;

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_ID,
      clientSecret: process.env.FACEBOOK_SECRET,
      callbackURL: "http://localhost:3000/auth/facebook/callback",
      profileFields: ["id", "email", "name", "picture"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
          let user = await User.findOne({ facebookId: profile.id });
          if (!user && profile.emails && profile.emails[0].value) {
            // ابحث عن مستخدم بنفس الإيميل
            user = await User.findOne({ email: profile.emails[0].value });
            if (user) {
              user.facebookId = profile.id;
              await user.save({ validateBeforeSave: false });
            }
          }
        if (!user) {
          user = await new User({
            facebookId: profile.id,
            name: profile.name.givenName + " " + profile.name.familyName,
            email: profile.emails ? profile.emails[0].value : null,
            photo: profile.photos ? profile.photos[0].value : null,
            provider: profile.provider,
          }).save({ validateBeforeSave: false });
        }
        return done(null,  user)      
      } 
      catch (error) {
        return done(error);
      }
    }
  )
);



module.exports = passport;
