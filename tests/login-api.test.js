const User = require("../models/user");
const bcrypt = require("bcrypt");
const { test, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);
const users_helper = require("./utils/test_helper_users.js");
const mongoose = require("mongoose");

beforeEach(async () => {
  await User.deleteMany({});

  await User.insertMany(users_helper.initialUsers);

  const password = "password";

  const passwordHash = await bcrypt.hash(password, 10);
  const passwordHashString = passwordHash.toString();
  const user = new User({
    username: "root",
    passwordHash: passwordHashString,
    name: "root",
  });

  await user.save();
});

test("user can login", async () => {
  const rootUser = {
    username: "root",
    password: "password",
  };

  const newUser = {
    username: rootUser.username,
    password: rootUser.password,
  };

  const response = await api
    .post("/api/login")
    .send(newUser)
    .expect(200)
    .expect("Content-Type", /application\/json/);

  assert.ok(response.body.token);
  assert.strictEqual(response.body.username, newUser.username);
});

after(async () => {
  await mongoose.connection.close();
});
