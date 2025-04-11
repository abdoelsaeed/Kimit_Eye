const fs = require('fs');
const path = require('path');
require('./../db/connectionDB')
const Emergency = require('./../model/emergencyModel');
const pathFile = path.join(__dirname,'emergency.json');
const rawData = fs.readFileSync(pathFile, "utf-8");
let emergencyData = JSON.parse(rawData);
let promises = emergencyData.map((element) => {
  return Emergency.create({
    serviceName: element.serviceName,
    serviceNumber: element.serviceNumber,
    description: element.description,
  });
});
Promise.all(promises)
  .then(() => {
    console.log("Done");
  })
  .catch((error) => {
    console.error("Something went wrong while processing the data", error);
  });

