const User = require("../models/user");
const bcrypt = require("bcrypt");
const { describe, test, after, beforeEach, assert } = require("node:test");
const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);
const test_helper = require("./test_helper");
const mongoose = require("mongoose");

beforeEach(async () => {
  await User.deleteMany({});

  const passwordHash = await bcrypt.hash("sekret", 10);
  const user = new User({ username: "root", passwordHash });

  await user.save();
});

describe("when there is initially one user in db", () => {
  test("creation fails with proper statuscode and message if username already taken", async () => {
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

after(async () => {
  await mongoose.connection.close();
});
