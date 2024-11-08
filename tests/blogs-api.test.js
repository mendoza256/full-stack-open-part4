const supertest = require("supertest");
const app = require("../app.js");
const api = supertest(app);
const mongoose = require("mongoose");
const Blog = require("../models/blog.js");
const User = require("../models/user.js");
const assert = require("node:assert");
const { test, beforeEach, describe, after } = require("node:test");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const users_helper = require("./utils/test_helper_users.js");
const blogs_helper = require("./utils/test_helper_blogs.js");

beforeEach(async () => {
  await User.deleteMany({});
  const usersInDb = await User.insertMany(users_helper.initialUsers);

  const passwordHash = await bcrypt.hash("password", 10);
  const passwordHashString = passwordHash.toString();
  const user = new User({
    username: "root",
    passwordHash: passwordHashString,
    name: "root",
  });
  await user.save();

  await Blog.deleteMany({});
  const initialBlogs = blogs_helper.getInitialBlogsWithUserId(usersInDb);
  const blogsObjects = initialBlogs.map((blog) => new Blog(blog));
  const promiseArray = blogsObjects.map((blog) => blog.save());
  await Promise.all(promiseArray);
});

test("blogs are returned as json", async () => {
  await api
    .get("/api/blogs")
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

test("there are two blogs", async () => {
  const response = await api.get("/api/blogs");

  assert.strictEqual(response.body.length, blogs_helper.initialBlogs.length);
});

test("the first blog is about Go To Statement", async () => {
  const response = await api.get("/api/blogs");

  const titles = response.body.map((e) => e.title);
  assert(titles.includes("Go To Statement Considered Harmful"));
});

test("the toJSON method transforms _id to id", async () => {
  const response = await api.get("/api/blogs");
  response.body.forEach((e) => {
    assert(e.id);
    assert(!e._id);
  });
});

describe("addition of a new blog", () => {
  let token;

  beforeEach(async () => {
    const response = await api
      .post("/api/login")
      .send({ username: "root", password: "password" });
    token = response.body.token;
  });

  test("succeeds with valid data and token", async () => {
    const newBlog = {
      title: "Test Blog",
      author: "Test Author",
      url: "http://testblog.com",
      likes: 0,
    };

    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const blogsAtEnd = await blogs_helper.blogsInDB();
    assert.strictEqual(blogsAtEnd.length, blogs_helper.initialBlogs.length + 1);

    const titles = blogsAtEnd.map((b) => b.title);
    assert(titles.includes("Test Blog"));
  });

  test("without the likes property that defaults to 0", async () => {
    const newBlog = {
      title: "Test Blog",
      author: "Test Author",
      url: "http://testblog.com",
    };

    const response = await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(newBlog);

    assert.strictEqual(response.status, 201);
    assert.strictEqual(response.body.likes, 0);
  });

  test("without url returns 400", async () => {
    const newBlog = {
      title: "Test Blog",
      author: "Test Author",
      likes: 0,
    };

    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(newBlog)
      .expect(400);
  });

  test("without token returns 401", async () => {
    const newBlog = {
      title: "Test Blog",
      author: "Test Author",
      url: "http://testblog.com",
      likes: 0,
    };

    await api.post("/api/blogs").send(newBlog).expect(401);
  });
});

describe("a specified blog", () => {
  let token;
  let blogToDelete;

  beforeEach(async () => {
    const testUser = new User({
      username: "testuser",
      name: "Test User",
      passwordHash: await bcrypt.hash("testpassword", 10),
    });
    await testUser.save();

    const userForToken = {
      username: testUser.username,
      id: testUser._id,
    };
    token = jwt.sign(userForToken, process.env.SECRET);

    const newBlog = new Blog({
      title: "Test Blog",
      author: "Test Author",
      url: "http://testblog.com",
      likes: 0,
      user: testUser._id,
    });
    blogToDelete = await newBlog.save();
  });

  test("gets deleted", async () => {
    const id = blogToDelete._id.toString();

    await api
      .delete(`/api/blogs/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204);

    const blogsAtEnd = await Blog.find({});
    assert.strictEqual(blogsAtEnd.length, blogs_helper.initialBlogs.length);
  });

  test("gets its likes updated", async () => {
    const response = await api.get("/api/blogs");
    const blogToUpdate = response.body[0];
    const updatedBlog = {
      ...blogToUpdate,
      likes: 8,
    };

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updatedBlog)
      .expect(200);

    const blogsAtEnd = await blogs_helper.blogsInDB();

    assert.strictEqual(blogsAtEnd[0].likes, 8);
  });
});

test("token should verify user that posted blog", async () => {
  const testUser = new User({
    username: "testuser",
    name: "Test User",
    passwordHash: await bcrypt.hash("testpassword", 10),
  });
  await testUser.save();

  const userForToken = {
    username: testUser.username,
    id: testUser._id,
  };
  const token = jwt.sign(userForToken, process.env.SECRET);

  const newBlog = {
    title: "Test Blog",
    author: "Test Author",
    url: "http://testblog.com",
    likes: 0,
  };

  const response = await api
    .post("/api/blogs")
    .set("Authorization", `Bearer ${token}`)
    .send(newBlog)
    .expect(201)
    .expect("Content-Type", /application\/json/);

  assert.strictEqual(response.body.title, newBlog.title);
  assert.strictEqual(response.body.author, newBlog.author);
  assert.strictEqual(response.body.url, newBlog.url);
  assert.strictEqual(response.body.user.toString(), testUser._id.toString());

  const savedBlog = await Blog.findById(response.body.id).populate("user");

  assert.strictEqual(savedBlog.user._id.toString(), testUser._id.toString());

  await Blog.findByIdAndDelete(response.body.id);
  await User.findByIdAndDelete(testUser._id);
});

after(async () => {
  mongoose.connection.close();
});
