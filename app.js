const blogRouter = require("./controllers/blogs");
const userRouter = require("./controllers/users");
const express = require("express");
const cors = require("cors");
const app = express();
const morgan = require("morgan");
const mongoose = require("mongoose");
const config = require("./utils/config");
const loginRouter = require("./controllers/login");
const { error } = require("./utils/middleware");

const mongoUrl = config.MONGODB_URI;

mongoose.connect(mongoUrl);

app.use(express.json());
app.use(cors());
app.use(express.static("dist"));

morgan.token("resbody", function (req) {
  return JSON.stringify(req.body);
});

app.use(
  morgan(
    ":method :url :status :res[content-length] - :response-time ms content: :resbody"
  )
);

app.use("/api/blogs/", blogRouter);
app.use("/api/users/", userRouter);
app.use("/api/login", loginRouter);

app.use(error);

module.exports = app;
