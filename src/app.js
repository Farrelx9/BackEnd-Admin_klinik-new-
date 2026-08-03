const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const routes = require("./routes"); // otomatis baca index.js
const {
  notFoundHandler,
  errorHandler,
} = require("./middleware/error.middleware");

const app = express();

const allowedOrigins = (
  process.env.FRONTEND_ORIGIN || "http://localhost:5173"
).split(",");
app.use(cors({ origin: allowedOrigins, credentials: true }));

app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
