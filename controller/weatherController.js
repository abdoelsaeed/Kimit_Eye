const catchAsync = require('./../utils/catchAsyn');
const axios = require('axios');
exports.getWeather = catchAsync(async (req, res) => {
    const city = req.query.city||'Cairo';
    
   const apiKey = process.env.WEATHER_API_KEY;
   const APIUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;

    let weather;
      const response = await axios.get(APIUrl);
      weather = response.data;
    const weatherWithIcons = weather.weather.map((condition) => ({
      ...condition,
      icon_url: `http://openweathermap.org/img/wn/${condition.icon}.png`,
    }));
    const temperature = (weather.main.temp - 273.15).toFixed(1)*1;
    res.status(200).json({
    message: "Success",
    data: {
    status: weather.weather[0].main,
    lon:weather.coord.lon,
    lat:weather.coord.lat,
    temperature, // Convert Kelvin to Celsius
    place:weather.sys.country,
    icon: weatherWithIcons[0].icon_url,
    } 
   });
});