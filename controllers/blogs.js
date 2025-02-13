const Blog = require("../models/blog");
const blogRouter = require("express").Router();
require("express-async-errors");

blogRouter.get("/", async (request, response) => {
  const blogs = await Blog.find({}).populate("user", {
    username: 1,
    name: 1,
  });
  return response.status(200).json(blogs);
});

blogRouter.post("/:id/comments", async (request, response) => {
  const blog = await Blog.findById(request.params.id);

  if (!blog) {
    return response.status(404).end();
  }

  const { comment } = request.body;
  const updatedBlog = {
    title: blog.title,
    author: blog.author,
    url: blog.url,
    likes: blog.likes,
    comments: [...blog.comments, comment],
  };

  try {
    const result = await Blog.findByIdAndUpdate(
      request.params.id,
      updatedBlog,
      {
        new: true,
        runValidators: true,
        context: "query",
      }
    );
    response.status(200).json(result);
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    response.status(400).json({ error: "Invalid request data" });
  }
});

blogRouter.get("/:id", async (request, response) => {
  const id = request.params.id;
  const blog = await Blog.findById(id).populate("user", {
    username: 1,
    name: 1,
  });
  return response.status(200).json(blog);
});

blogRouter.post("/", async (request, response) => {
  const body = request.body;
  const user = request.user;

  if (!user) {
    return response.status(401).json({ error: "token missing or invalid" });
  }

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: user._id,
    comments: body.comments || [],
  });

  try {
    const savedBlog = await blog.save();
    user.blogs = user.blogs.concat(savedBlog._id);
    await user.save();

    response.status(201).json(savedBlog);
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    response.status(400).json({ error: "Invalid request data" });
  }
});

blogRouter.delete("/:id", async (request, response) => {
  const user = request.user;

  if (!user) {
    return response.status(401).json({ error: "token missing or invalid" });
  }

  const blog = await Blog.findById(request.params.id);

  if (!blog) {
    return response.status(404).json({ error: "blog not found" });
  }

  if (blog.user.toString() !== user._id.toString()) {
    return response
      .status(403)
      .json({ error: "only the creator can delete this blog" });
  }

  await Blog.findByIdAndDelete(request.params.id);
  response.status(204).end();
});

blogRouter.put("/:id", async (request, response) => {
  const blog = await Blog.findById(request.params.id);

  if (!blog) {
    return response.status(404).end();
  }

  const { title, author, url, likes, comments } = request.body;
  const updatedBlog = {
    title,
    author,
    url,
    likes,
    comments,
  };

  const result = await Blog.findByIdAndUpdate(request.params.id, updatedBlog, {
    new: true,
    runValidators: true,
    context: "query",
  });
  response.status(200).json(result);
});

module.exports = blogRouter;
