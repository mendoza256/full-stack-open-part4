const supertest = require("supertest");
const app = require("../app.js");
const api = supertest(app);

const mongoose = require("mongoose");
const Blog = require("../models/blog.js");
const User = require("../models/user.js");
const assert = require("node:assert");
const { test, beforeEach, describe, after } = require("node:test");

const users_helper = require("./utils/test_helper_users.js");
const blogs_helper = require("./utils/test_helper_blogs.js");

beforeEach(async () => {
  // set up users
  await User.deleteMany({});
  const usersInDb = await User.insertMany(users_helper.initialUsers);

  // set up blogs
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
    const usersAtStart = await users_helper.usersInDb();

    const newBlog = {
      title: "test",
      author: "test",
      url: "test.de",
      userId: usersAtStart[0].id,
    };

    await api
      .post("/api/blogs")
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const blogsAtEnd = await api.get("/api/blogs");
    assert.strictEqual(
      blogsAtEnd.body.length,
      blogs_helper.initialBlogs.length + 1
    );
  });

  test("without the likes property that defaults to 0", async () => {
    const usersAtStart = await users_helper.usersInDb();

    const newBlog = {
      title: "test",
      author: "test",
      url: "test.de",
      userId: usersAtStart[0].id,
    };

    const response = await api
      .post("/api/blogs")
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    assert.strictEqual(response.body.likes, 0);
  });

  test("without title returns 400", async () => {
    const usersAtStart = await users_helper.usersInDb();

    const newBlog = {
      author: "test",
      url: "test.de",
      userId: usersAtStart[0].id,
    };

    await api.post("/api/blogs").send(newBlog).expect(400);
  });

  test("without url returns 400", async () => {
    const usersAtStart = await users_helper.usersInDb();

    const newBlog = {
      title: "test",
      author: "test",
      userId: usersAtStart[0].id,
    };

    await api.post("/api/blogs").send(newBlog).expect(400);
  });
});

describe("a specified blog", () => {
  test("gets deleted", async () => {
    const blogsAtStart = await api.get("/api/blogs");
    const blogToDelete = blogsAtStart.body[0];

    await api.delete(`/api/blogs/${blogToDelete.id}`).expect(204);

    const blogsAtEnd = await blogs_helper.blogsInDB();

    assert.strictEqual(blogsAtEnd.length, blogs_helper.initialBlogs.length - 1);
  });

  test("gets its likes updated", async () => {
    const response = await api.get("/api/blogs");
    const blogToUpdate = response.body[0];
    const updatedBlog = {
      ...blogToUpdate,
      likes: 8, // updated  +1 like
    };

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updatedBlog)
      .expect(200);

    const blogsAtEnd = await blogs_helper.blogsInDB();

    assert.strictEqual(blogsAtEnd[0].likes, 8);
  });
});

after(async () => {
  mongoose.connection.close();
});
