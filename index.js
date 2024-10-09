const app = require("./app");
const config = require("./utils/config");

const PORT = config.PORT;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${PORT}`);
});
