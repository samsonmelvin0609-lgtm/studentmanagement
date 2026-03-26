require("dotenv").config();

const app = require("./backend/app");

const port = Number(process.env.PORT) || 3000;

app.listen(port, () => {
  console.log(`Student management system running on http://localhost:${port}`);
});
