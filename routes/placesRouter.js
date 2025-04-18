const express = require("express");
const authController = require("./../controller/AuthController");
const placesController = require('./../controller/placesController');
const router = express.Router();
router.get("/", authController.protect, placesController.findplaces);
router.get('/:place', authController.protect, placesController.findplace);
router.get(
  "/recommendedplaces/longitude/:longitude/latitude/:latitude",
  authController.protect,
  placesController.findplacesByCoordinates
);
module.exports = router;
