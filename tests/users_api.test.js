const User = require("../models/user");
const bcrypt = require("bcrypt");
const { describe, test, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);
const test_helper = require("./test_helper");
const mongoose = require("mongoose");

beforeEach(async () => {
  await User.deleteMany({});

  const passwordHash = await bcrypt.hash(process.env.SECRET, 10);
  const user = new User({ username: "root", passwordHash });

  await user.save();
});

describe("when there is initially one user in db", () => {
  test.only("creation fails with proper statuscode and message if username already taken", async () => {
    const usersAtStart = await test_helper.usersInDb();

    const newUser = {
      username: "root",
      name: "Superuser",
      password: "salainen",
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await test_helper.usersInDb();
    assert(result.body.error.includes("expected `username` to be unique"));

    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });
});

test.only("creation succeeds with a fresh username", async () => {
  const usersAtStart = await test_helper.usersInDb();

  const newUser = {
    username: "Testuser",
    name: "Test user",
    password: "apassword",
  };

  await api
    .post("/api/users")
    .send(newUser)
    .expect(200)
    .expect("Content-Type", /application\/json/);

  const usersAtEnd = await test_helper.usersInDb();
  assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1);

  const usernames = usersAtEnd.map((u) => u.username);
  assert.ok(usernames.includes(newUser.username));
});

test.only("invalid users are not created", async () => {
  const usersAtStart = await test_helper.usersInDb();

  const newUser = {
    username: "Te",
    name: "Test user",
    password: "asdfalksdf",
  };

  await api
    .post("/api/users")
    .send(newUser)
    .expect(400)
    .expect("Content-Type", /application\/json/);

  const usersAtEnd = await test_helper.usersInDb();
  assert.strictEqual(usersAtEnd.length, usersAtStart.length);
});

test.only("user tries to login with invalid password can't log in", async () => {
  const usersAtStart = await test_helper.usersInDb();

  const newUser = {
    username: "Testuser",
    name: "Test user",
    password: "ap",
  };

  // expect 400 and message: password must be at least 3 characters long
  await api
    .post("/api/users")
    .send(newUser)
    .expect(400)
    .expect("Content-Type", /application\/json/);

  const usersAtEnd = await test_helper.usersInDb();
  assert.strictEqual(usersAtEnd.length, usersAtStart.length);
});

test.only("user with short username can't login", async () => {
  const usersAtStart = await test_helper.usersInDb();

  const newUser = {
    username: "Te",
    name: "Test user",
    password: "apassword",
  };

  // expect 400 and message: password must be at least 3 characters long
  await api
    .post("/api/users")
    .send(newUser)
    .expect(400)
    .expect("Content-Type", /application\/json/);

  const usersAtEnd = await test_helper.usersInDb();
  assert.strictEqual(usersAtEnd.length, usersAtStart.length);
});

after(async () => {
  await mongoose.connection.close();
});
