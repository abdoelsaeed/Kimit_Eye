const passport = require('passport');
const User = require("../model/userModel");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
      callbackURL: "http://127.0.0.1:3000/auth/google/callback",
      passReqToCallback: true,
    },
    async function (request, accessToken, refreshToken, profile, done) {
        try {
          let user = await User.findOne({ googleId: profile.id });
          if (!user && profile.emails && profile.emails[0].value) {
            // ابحث عن مستخدم بنفس الإيميل
            user = await User.findOne({ email: profile.emails[0].value });
            if (user) {
              user.googleId = profile.id;
              await user.save({ validateBeforeSave: false });
            }
          }
          if (!user) {
            user = await new User({
                googleId: profile.id,
                name: profile.name.givenName + " " + profile.name.familyName,
                email: profile.emails ? profile.emails[0].value : null,
                photo: profile.photos ? profile.photos[0].value : null,
                provider: profile.provider
            }).save({ validateBeforeSave: false });
            }
            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }
    )
);