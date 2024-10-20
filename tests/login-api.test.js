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
  const passwordHash = await bcrypt.hash(process.env.SECRET, 10);
  const passwordHashString = passwordHash.toString();
  const user = new User({ username: "root", passwordHash: passwordHashString });

  await user.save();
});

test("user can login", async () => {
  const loginUser = users_helper.initialUsers[0];

  const newUser = {
    username: loginUser.username,
    password: loginUser.password,
  };

  const response = await api
    .post("/api/login")
    .send(newUser)
    .expect(200)
    .expect("Content-Type", /application\/json/);
  // expect { token, username: user.username, name: user.name } in response

  assert.ok(response.body.token);
  assert.strictEqual(response.body.username, newUser.username);
  assert.strictEqual(response.body.name, "Test user");
});

after(async () => {
  await mongoose.connection.close();
});
