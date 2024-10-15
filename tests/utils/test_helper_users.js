const User = require("../../models/user");

const initialUsers = [
  {
    username: "user",
    name: "user",
    password: "password",
  },
  {
    username: "reus",
    name: "user2",
    password: "password",
  },
  {
    username: "resu",
    name: "user3",
    password: "password",
  },
  {
    username: "erus",
    name: "user4",
    password: "password",
  },
  {
    username: "user5",
    name: "user5",
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
