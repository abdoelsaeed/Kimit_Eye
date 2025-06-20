const Hieroglyph = require("../model/hieroglyphModel");
const catchAsync = require("../utils/catchAsyn");
const AppError = require("../utils/err");

exports.getHieroglyphData = catchAsync(async (req, res, next) => {
  const { detectedClasses } = req.body;

  if (!detectedClasses || !Array.isArray(detectedClasses)) {
    return next(
      new AppError("Please provide an array of detected classes.", 400)
    );
  }

  // Find all documents where className is in the detectedClasses array
  const hieroglyphData = await Hieroglyph.find({
    className: { $in: detectedClasses.map((c) => c.toLowerCase()) },
  });

  if (!hieroglyphData || hieroglyphData.length === 0) {
    return next(new AppError("No data found for the provided classes.", 404));
  }

  res.status(200).json({
    status: "success",
    results: hieroglyphData.length,
    data: {
      documents: hieroglyphData,
    },
  });
}); 