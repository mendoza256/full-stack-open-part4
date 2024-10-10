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
  const sortedArray = _.sortBy(blogs, [
    function (b) {
      return b.author;
    },
  ]);

  const blogsAmount = sortedArray.filter(
    (b) => b.author === sortedArray[sortedArray.length - 1].author
  ).length;

  return {
    author: sortedArray[sortedArray.length - 1].author,
    blogs: blogsAmount,
  };
};

const returnAuthorWithMostLikes = (blogs) => {
  const likesByAuthor = {};

  blogs.forEach((blog) => {
    if (likesByAuthor[blog.author]) {
      likesByAuthor[blog.author] += blog.likes;
    } else {
      likesByAuthor[blog.author] = blog.likes;
    }
  });

  let topAuthor = null;
  let maxLikes = 0;

  for (const author in likesByAuthor) {
    if (likesByAuthor[author] > maxLikes) {
      maxLikes = likesByAuthor[author];
      topAuthor = author;
    }
  }

  return { author: topAuthor, likes: maxLikes };
};

module.exports = {
  dummy,
  totalLikes,
  returnFavoriteBlog,
  returnAuthorWithMostBlogs,
  returnAuthorWithMostLikes,
};
