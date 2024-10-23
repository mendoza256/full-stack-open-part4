const Blog = require("../models/blog");
const User = require("../models/user");
const blogRouter = require("express").Router();
require("express-async-errors");
const jwt = require("jsonwebtoken");

const getTokenFrom = (request) => {
  const authorization = request.get("authorization");
  if (authorization && authorization.startsWith("Bearer ")) {
    return authorization.replace("Bearer ", "");
  }
  return null;
};

blogRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({}).populate("user", {
    username: 1,
    name: 1,
  });
  return response.json(blogs);
});

blogRouter.post("/", async (request, response) => {
  const body = request.body;

  const decodedToken = jwt.verify(getTokenFrom(request), process.env.SECRET);

  if (!decodedToken.id) {
    return response.status(401).json({ error: "token invalid" });
  }

  const user = await User.findById(decodedToken.id).populate("blogs");

  const newBlog = {
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: user,
  };

  try {
    const blog = new Blog(newBlog);
    const savedBlog = await blog.save();
    user.blogs = user.blogs.concat(savedBlog.id);
    await user.save();

    response.status(201).json(savedBlog);
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    response.status(400).json({ error: "Invalid request data" });
  }
});

blogRouter.delete("/:id", async (request, response) => {
  const blog = await Blog.findById(request.params.id);

  if (!blog) {
    return response.status(404).end();
  }

  await Blog.findByIdAndDelete(blog);
  response.status(204).end();
});

blogRouter.put("/:id", async (request, response) => {
  const blog = await Blog.findById(request.params.id);

  if (!blog) {
    return response.status(404).end();
  }

  const { title, author, url, likes } = request.body;
  const updatedBlog = {
    title,
    author,
    url,
    likes,
  };

  const result = await Blog.findByIdAndUpdate(request.params.id, updatedBlog, {
    new: true,
    runValidators: true,
    context: "query",
  });
  response.status(200).json(result);
});

module.exports = blogRouter;
