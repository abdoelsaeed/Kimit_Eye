const catchAsync = require("./../utils/catchAsyn");
const AppError = require("./../utils/err");
const axios = require('axios');
const History = require('./../model/historyModel');
exports.findplaces = catchAsync(async (req, res, next) => {
  const { location, limit, place } = req.query;
  const API_KEY = process.env.PLACES_API_KEY;

  const options = {
    method: "GET",
    url: "https://api.foursquare.com/v3/places/search",
    headers: {
      Accept: "application/json",
      Authorization: API_KEY,
    },
    params: {
      query: place || "museum", // التأكد من إضافة قيمة افتراضية
      near: location || "Egypt", // التأكد من إضافة قيمة افتراضية
      limit: limit || 20, // التأكد من إضافة قيمة افتراضية
    },
  };
    const response = await axios.request(options);
    const { results, context } = response.data;
    // //& to get (latitude,longitude)
    // console.log(results[0].geocodes.main);
    return res.status(200).json({
      message: "Data fetched successfully",
      data: {
        results,
        context,
      },
    });
});

exports.findplace = catchAsync(async (req, res, next) => {
  const {id} = req.user;
  const place = req.params.place;
  if (!place) return next(new AppError("You must provide a place", 404));

  const options = {
    method: "GET",
    url: "https://api.foursquare.com/v3/places/search",
    headers: {
      Accept: "application/json",
      Authorization: process.env.PLACES_API_KEY,
    },
    params: {
      query: place, // البحث بالاسم مباشرة
      near: "Egypt", // تحسين البحث بالموقع
      limit: 1, // تحديد عدد النتائج
    },
  };

  const response = await axios.request(options);
  const { results, context } = response.data;

  if (!results || results.length === 0) {
    return next(new AppError("No place found", 404));
  }

  // استخراج بيانات المكان الأول في النتائج
  const placeData = results[0];
  console.log()
  await History.create({
    user: id,
    adress: placeData.location.region,
    name: placeData.name,
    location: {
      type: "Point",
      coordinates: [
        placeData.geocodes.main.longitude,
        placeData.geocodes.main.latitude,
      ], 
    },
  });
  // استخراج الصورة إذا كانت متاحة
  let imageUrl = null;
  if (placeData.categories && placeData.categories.length > 0) {
    const icon = placeData.categories[0].icon;
    imageUrl = `${icon.prefix}64${icon.suffix}`;
  }

  return res.status(200).json({
    message: "Success",
    data: {
      place: placeData,
      imageUrl, // ✅ إرجاع رابط الصورة
      context,
    },
  });
});

exports.findplacesByCoordinates = catchAsync(async (req, res, next) => {
  const { limit, place } = req.query;
  const { latitude, longitude } = req.params; 
  console.log(latitude, longitude);
  const API_KEY = process.env.PLACES_API_KEY;

  // التحقق من وجود الإحداثيات
  if (!latitude || !longitude) {
    return next(new AppError("You must provide latitude and longitude", 400));
  }

  const options = {
    method: "GET",
    url: "https://api.foursquare.com/v3/places/search",
    headers: {
      Accept: "application/json",
      Authorization: API_KEY,
    },
    params: {
      query: place || "museum", // قيمة افتراضية إذا لم يتم توفير اسم المكان
      ll: `${latitude},${longitude}`, // الإحداثيات الجغرافية
      limit: limit || 20, // عدد النتائج الافتراضي
    },
  };

  const response = await axios.request(options);
  const { results, context } = response.data;

  // التحقق من وجود نتائج
  if (!results || results.length === 0) {
    return next(
      new AppError("No places found near the provided location", 404)
    );
  }

  return res.status(200).json({
    message: "Data fetched successfully",
    data: {
      results,
      context,
    },
  });
});