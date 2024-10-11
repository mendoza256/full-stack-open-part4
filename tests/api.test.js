const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const assert = require("node:assert");
const { test, after, beforeEach } = require("node:test");
const Blog = require("../models/blog");
const test_helper = require("./test_helper.js");

beforeEach(async () => {
  await Blog.deleteMany({});

  const blogsObjects = test_helper.initialBlogs.map((blog) => new Blog(blog));
  const promiseArray = blogsObjects.map((blog) => blog.save());
  await Promise.all(promiseArray);
});

const api = supertest(app);

test("blogs are returned as json", async () => {
  await api
    .get("/api/blogs")
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

test("there are two blogs", async () => {
  const response = await api.get("/api/blogs");

  assert.strictEqual(response.body.length, test_helper.initialBlogs.length);
});

test("the first note is about Go To Statement", async () => {
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

after(async () => {
  await mongoose.connection.close();
});
