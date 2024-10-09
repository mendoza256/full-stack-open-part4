const dummy = (blogs) => {
  return 1;
};

const totalLikes = (blogList) => {
  return blogList.reduce((sum, current) => sum + current.likes, 0);
};

module.exports = {
  dummy,
  totalLikes,
};
