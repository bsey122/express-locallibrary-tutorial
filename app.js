var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
require("dotenv").config();

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
const catalogRouter = require("./routes/catalog"); // Import routes for "catalog" area of site

const compression = require("compression"); // Import compression
const helmet = require("helmet"); // Import helmet
const RateLimit = require("express-rate-limit");

var app = express();

// Set up mongoose connection
const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const mongoDB = process.env.MONGODB_URI || process.env.MONGODB_DEV_URL;

main().catch((err) => console.log(err));
async function main() {
  await mongoose.connect(mongoDB);
}

// Set up rate limiter: maximum of twenty request per minute
limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(compression()); // Compress all routes
app.use(helmet()); // Use helmet
app.use(limiter); // Apply rate limiter to all requests
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/catalog", catalogRouter); // Add catalog routes to middleware chain

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
