const express = require("express");
const hieroglyphController = require("../controller/hieroglyphController");

const router = express.Router();

router.post("/", hieroglyphController.getHieroglyphData);

module.exports = router; 