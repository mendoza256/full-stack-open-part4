const User = require("../../models/user");

const initialUsers = [
  {
    username: "muffi",
    name: "muffi",
    password: "password",
  },
];

const usersInDb = async () => {
  const users = await User.find({});
  return users.map((u) => u.toJSON());
};

module.exports = {
  usersInDb,
  initialUsers,
};
