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
    let { results, context } = response.data;
    results = await Promise.all(
      results.map(async (place) => {
        try {
          // طلب صور المكان
          const photosResponse = await axios.get(
            `https://api.foursquare.com/v3/places/${place.fsq_id}/photos`,
            {
              headers: {
                Accept: "application/json",
                Authorization: API_KEY,
              },
            }
          );

          // معالجة الصور
          const photos = photosResponse.data.map((photo) => ({
            url: `${photo.prefix}original${photo.suffix}`,
            width: photo.width,
            height: photo.height,
          }));
          const {fsq_id, name, location} = place;
          const { main } = place.geocodes;
          return {
            fsq_id,
            name,
            location,
            main,
            iconUrl: place.categories[0]?.icon
              ? `${place.categories[0].icon.prefix}64${place.categories[0].icon.suffix}`
              : null,
            photos, // إضافة الصور
          };
        } catch (error) {
          console.error(
            `Error fetching photos for place ${place.fsq_id}:`,
            error.message
          );
          return {
            ...place,
            iconUrl: place.categories[0]?.icon
              ? `${place.categories[0].icon.prefix}64${place.categories[0].icon.suffix}`
              : null,
            photos: [], // إرجاع مصفوفة فاضية لو فيه خطأ
          };
        }
      })
    );
    // //& to get (latitude,longitude)
    // 
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
  const API_KEY = process.env.PLACES_API_KEY;

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
  let { results, context } = response.data;

  if (!results || results.length === 0) {
    return next(new AppError("No place found", 404));
  }
  results = await Promise.all(
    results.map(async (place) => {
      try {
        // طلب صور المكان
        const photosResponse = await axios.get(
          `https://api.foursquare.com/v3/places/${place.fsq_id}/photos`,
          {
            headers: {
              Accept: "application/json",
              Authorization: API_KEY,
            },
          }
        );

        // معالجة الصور
        const photos = photosResponse.data.map((photo) => ({
          url: `${photo.prefix}original${photo.suffix}`,
          width: photo.width,
          height: photo.height,
        }));
        const { fsq_id, name, location } = place;
        const { main } = place.geocodes;
        
        return {
          fsq_id,
          name,
          location,
          main,
          iconUrl: place.categories[0]?.icon
            ? `${place.categories[0].icon.prefix}64${place.categories[0].icon.suffix}`
            : null,
          photos, // إضافة الصور
        };
      } catch (error) {
        console.error(
          `Error fetching photos for place ${place.fsq_id}:`,
          error.message
        );
        return {
          ...place,
          iconUrl: place.categories[0]?.icon
            ? `${place.categories[0].icon.prefix}64${place.categories[0].icon.suffix}`
            : null,
          photos: [], // إرجاع مصفوفة فاضية لو فيه خطأ
        };
      }
    })
  );

  // استخراج بيانات المكان الأول في النتائج
  const placeData = results[0];
  
  await History.create({
    user: id,
    adress: placeData.location.region,
    name: placeData.name,
    location: {
      type: "Point",
      coordinates: [placeData.main.longitude, placeData.main.latitude],
    },
    imageUrl: placeData.photos.length > 0 ? placeData.photos[0].url : null,
  });

  return res.status(200).json({
    message: "Success",
    data: {
      placeData,
    },
  });
});

exports.findplacesByCoordinates = catchAsync(async (req, res, next) => {
  const { limit, place } = req.query;
  const { latitude, longitude } = req.params; 
  
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
  let { results } = response.data;

  // التحقق من وجود نتائج
  if (!results || results.length === 0) {
    return next(
      new AppError("No places found near the provided location", 404)
    );
  }
  results = await Promise.all(
    results.map(async (place) => {
      try {
        // طلب صور المكان
        const photosResponse = await axios.get(
          `https://api.foursquare.com/v3/places/${place.fsq_id}/photos`,
          {
            headers: {
              Accept: "application/json",
              Authorization: API_KEY,
            },
          }
        );

        // معالجة الصور
        const photos = photosResponse.data.map((photo) => ({
          url: `${photo.prefix}original${photo.suffix}`,
          width: photo.width,
          height: photo.height,
        }));
        const { fsq_id, name, location } = place;
        const { main } = place.geocodes;

        return {
          fsq_id,
          name,
          location,
          main,
          iconUrl: place.categories[0]?.icon
            ? `${place.categories[0].icon.prefix}64${place.categories[0].icon.suffix}`
            : null,
          photos, // إضافة الصور
        };
      } catch (error) {
        console.error(
          `Error fetching photos for place ${place.fsq_id}:`,
          error.message
        );
        return {
          ...place,
          iconUrl: place.categories[0]?.icon
            ? `${place.categories[0].icon.prefix}64${place.categories[0].icon.suffix}`
            : null,
          photos: [], // إرجاع مصفوفة فاضية لو فيه خطأ
        };
      }
    })
  );

  return res.status(200).json({
    message: "Data fetched successfully",
    data: {
      results,
    },
  });
});