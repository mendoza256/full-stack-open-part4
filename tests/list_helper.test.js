const { test, describe } = require("node:test");
const assert = require("node:assert");
const listHelper = require("../utils/list_helper");

test("dummy returns one", () => {
  const blogs = [];

  const result = listHelper.dummy(blogs);
  assert.strictEqual(result, 1);
});

describe("total likes", () => {
  const dummyBlog = [
    {
      _id: "6706a6f7e4d14c3299763dc8",
      title: "sample 2",
      author: "muffi",
      url: "localhost:3003",
      likes: 2,
      __v: 0,
    },
  ];
  test("when list has only one blog, equals the likes of that", () => {
    const result = listHelper.totalLikes(dummyBlog);
    assert.strictEqual(result, 2);
  });
});
