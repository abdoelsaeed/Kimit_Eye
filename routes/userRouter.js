const express = require('express');
const passport = require('../services/passportFacebook');
const authController = require('./../controller/AuthController');
const userController = require('./../controller/userController');
const historyController = require('./../controller/historyController');
const router =express.Router();

//^ Auth with local strategy
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/logout", authController.logout);


router.post("/forgotpassword", authController.forgotPassword);
router.patch("/resetpassword/:code", authController.resetPassword);
//? Auth with Facebook
router.get(
  "/facebook",
  passport.authenticate("facebook", {
    scope: ["email"],
  }));
router.get(
  "/facebook/callback",
  passport.authenticate("facebook"),
  authController.callback_Facebook
);

//! Auth with google
router.get(
  "/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google"),
  authController.callback_google
);

//for password



// Protect all routes after this middleware
router.use(authController.protect);
router.patch("/updatemypassword", authController.updatePassword);
router.get('/me', userController.getMe, userController.getUserById);
router.delete('/deleteMe', userController.deleteMe);
router.patch('/updateMe',userController.updateMe);

router
  .route("/history")
  .get(historyController.getHistory)
  .delete(historyController.deleteHistory);
  
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers)

router
  .route('/:id')
  .get(userController.getUserById)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);


  

module.exports = router;