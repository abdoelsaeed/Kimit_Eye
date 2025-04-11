const mongoose = require("mongoose");

const emergencySchema = new mongoose.Schema({
  serviceName: { type: String, required: true },
  serviceNumber: { type: String, required: true },
  description: { type: String, required: true },
});

const EmergencyService = mongoose.model("Emergency", emergencySchema);

module.exports = EmergencyService;
