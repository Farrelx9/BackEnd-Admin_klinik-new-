require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || `https://back-end-admin-klinik.vercel.app/`;

app.listen(PORT, () => {
  console.log(
    `Klinik API jalan di https://back-end-admin-klinik.vercel.app/api`,
  );
});
