const express = require("express");
const authController = require("../controller/AuthController");
const weatherController = require('../controller/weatherController');
const Emergency = require('./../model/emergencyModel');
const router = express.Router();
router.get("/weather", authController.protect,weatherController.getWeather);
router.get("/emergency", authController.protect,async (req,res)=>{
    const emergency =await Emergency.find();
    if(!emergency) return res.status(404).json({error:'No emergency found'})
    res.status(200).json({
    status: 'success',
    message: 'Emergency list fetched successfully',
    data: emergency
})
});
module.exports = router;

