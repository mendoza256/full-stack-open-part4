const User = require("../models/user");
const bcrypt = require("bcrypt");
const { describe, test, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);
const users_helper = require("./utils/test_helper_users.js");
const mongoose = require("mongoose");

beforeEach(async () => {
  await User.deleteMany({});

  await User.insertMany(users_helper.initialUsers);
  const passwordHash = await bcrypt.hash("password", 10);
  const passwordHashString = passwordHash.toString();
  const user = new User({ username: "root", passwordHash: passwordHashString });

  await user.save();
});

describe("when there is initially one user in db", () => {
  test("creation fails with proper statuscode and message if username already taken", async () => {
    const usersAtStart = await users_helper.usersInDb();

    const newUser = {
      username: "user",
      name: "Superuser",
      password: "salainen",
    };

    const result = await api
      .post("/api/users")
      .send(newUser)
      .expect(400)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await users_helper.usersInDb();
    assert(result.body.error.includes("expected `username` to be unique"));

    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });
});

test("creation succeeds with a fresh username", async () => {
  const usersAtStart = await users_helper.usersInDb();

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

  const usersAtEnd = await users_helper.usersInDb();
  assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1);

  const usernames = usersAtEnd.map((u) => u.username);
  assert.ok(usernames.includes(newUser.username));
});

test("invalid users are not created", async () => {
  const usersAtStart = await users_helper.usersInDb();

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

  const usersAtEnd = await users_helper.usersInDb();
  assert.strictEqual(usersAtEnd.length, usersAtStart.length);
});

test("user tries to login with invalid password can't log in", async () => {
  const usersAtStart = await users_helper.usersInDb();

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

  const usersAtEnd = await users_helper.usersInDb();
  assert.strictEqual(usersAtEnd.length, usersAtStart.length);
});

test("user with short username can't login", async () => {
  const usersAtStart = await users_helper.usersInDb();

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

  const usersAtEnd = await users_helper.usersInDb();
  assert.strictEqual(usersAtEnd.length, usersAtStart.length);
});

after(async () => {
  await mongoose.connection.close();
});
