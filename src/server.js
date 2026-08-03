require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Klinik API jalan di http://localhost:${PORT}/api`);
});
