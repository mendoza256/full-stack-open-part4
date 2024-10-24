const jwt = require("jsonwebtoken");
const User = require("../models/user");

const info = (...params) => {
  if (process.env.NODE_ENV !== "test") {
    // eslint-disable-next-line no-console
    console.log(...params);
  }
};

const error = (error, request, response, next) => {
  if (error.name === "CastError") {
    return response.status(400).send({ error: "malformatted id" });
  } else if (error.name === "ValidationError") {
    return response.status(400).json({ error: error.message });
  } else if (
    error.name === "MongoServerError" &&
    error.message.includes("E11000 duplicate key error")
  ) {
    return response
      .status(400)
      .json({ error: "expected `username` to be unique" });
  } else if (error.name === "JsonWebTokenError") {
    return response.status(401).json({ error: "token invalid" });
  } else if (error.name === "TokenExpiredError") {
    return response.status(401).json({ error: "token expired" });
  }

  next(error);
};

const getTokenFrom = (request, response, next) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
    request.token = authorization.substring(7);
  } else {
    request.token = null;
  }
  next();
};

const userExtractor = async (request, response, next) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.toLowerCase().startsWith("bearer ")) {
    const token = authorization.substring(7);
    try {
      const decodedToken = jwt.verify(token, process.env.SECRET);
      if (!decodedToken.id) {
        return response.status(401).json({ error: "token invalid" });
      }
      request.user = await User.findById(decodedToken.id);
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      return response.status(401).json({ error: "token invalid" });
    }
  }
  next();
};

module.exports = {
  info,
  error,
  getTokenFrom,
  userExtractor,
};
