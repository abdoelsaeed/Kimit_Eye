const catchAsync = require("./../utils/catchAsyn");
const AppError = require("./../utils/err");
const History = require('./../model/historyModel');

exports.getHistory = catchAsync(async(req, res, next) => {
    const history = await History.find({ user: req.user._id }).sort({
      date: -1,
    });
    res.status(200).json({
        success: true,
        count: history.length,
        data: history
    });
});

exports.deleteHistory = catchAsync(async(req, res, next) => {
    const history = await History.findByIdAndDelete(req.user._id);
    res.status(204).json({
        status: "success",
        data: null,
    });
});
