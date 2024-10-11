const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const assert = require("node:assert");
const { test, after, beforeEach, describe } = require("node:test");
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

describe("addition of a new blog", () => {
  test("that is valid", async () => {
    const newBlog = {
      title: "test",
      author: "test",
      url: "test.de",
      likes: 0,
    };

    await api
      .post("/api/blogs")
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const blogsAtEnd = await api.get("/api/blogs");
    assert.strictEqual(
      blogsAtEnd.body.length,
      test_helper.initialBlogs.length + 1
    );
  });

  test("without the likes property that defaults to 0", async () => {
    const newBlog = {
      title: "test",
      author: "test",
      url: "test.de",
    };

    const response = await api
      .post("/api/blogs")
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    assert.strictEqual(response.body.likes, 0);
  });

  test("without title returns 400", async () => {
    const newBlog = {
      author: "test",
      url: "test.de",
    };

    await api.post("/api/blogs").send(newBlog).expect(400);
  });

  test("without url returns 400", async () => {
    const newBlog = {
      title: "test",
      author: "test",
    };

    await api.post("/api/blogs").send(newBlog).expect(400);
  });
});

after(async () => {
  await mongoose.connection.close();
});
