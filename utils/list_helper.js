const _ = require("lodash");

const dummy = (_blogs) => {
  return 1;
};

const totalLikes = (blogList) => {
  return blogList.reduce((sum, current) => sum + current.likes, 0);
};

const returnFavoriteBlog = (blogs) => {
  const maxLikes = Math.max(...blogs.map((blog) => blog.likes));
  const result = blogs.find((blog) => blog.likes === maxLikes);
  return {
    title: result.title,
    author: result.author,
    likes: result.likes,
  };
};

const returnAuthorWithMostBlogs = (blogs) => {
  const arr = _.sortBy(blogs, [
    function (b) {
      return b.author;
    },
  ]);

  const blogsAmount = arr.filter(
    (b) => b.author === arr[arr.length - 1].author
  ).length;

  return {
    author: arr[arr.length - 1].author,
    blogs: blogsAmount,
  };
};

module.exports = {
  dummy,
  totalLikes,
  returnFavoriteBlog,
  returnAuthorWithMostBlogs,
};
