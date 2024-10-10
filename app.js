const blogRouter = require("./controllers/blogs");
const express = require("express");
const cors = require("cors");
const app = express();
const morgan = require("morgan");
const mongoose = require("mongoose");
const config = require("./utils/config");

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

module.exports = app;
