const express = require("express");
const authRoutes = require("./routes/userRouter");
const placesRoutes = require("./routes/placesRouter");
const userRoutes = require("./routes/userRouter");
const weatherRoutes = require("./routes/utilsRoutes");
const postRoutes = require('./routes/postRouter');
const chatbotRoutes = require('./routes/chatbotRouter');
const app = express();
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const cookieParser = require("cookie-parser");
const session = require('express-session'); // استيراد express-session
const globalErrorHandler = require('./controller/errorController');
const morgan = require("morgan");
const passport = require("./services/passport");

app.use(cookieParser());
app.use(
  session({
    secret: "your-secret-key", // يمكن تغييرها إلى مفتاح سري عشوائي
    resave: false,
    saveUninitialized: true, 
  })
);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(morgan("dev"));

app.use(express.json());
app.use(passport.initialize());
app.use(passport.session({ secret: process.env.PASSPORT_SESSION }));
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});
app.use(
  cors({
    credentials: true,
    origin: "*", // أضف المصدر الخاص بك هنا
  })
);

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/chatbot", chatbotRoutes);

app.use("/api/v1/places", placesRoutes);
app.use('/api/v1/utils',weatherRoutes);
app.use("/auth", authRoutes);
app.get('/favicon.ico', (req, res) => res.status(204));
app.all("*", (req, res, next) => {
  res.send(`Can't find ${req.originalUrl} on this server`, 404);
});
app.use(globalErrorHandler);
module.exports = app;
