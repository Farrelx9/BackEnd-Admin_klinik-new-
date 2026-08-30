const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const routes = require("./routes"); // otomatis baca index.js
const {
  notFoundHandler,
  errorHandler,
} = require("./middleware/error.middleware");

const app = express();

const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://admin-dental-irna.vercel.app",
];
const envOrigins = process.env.FRONTEND_ORIGIN
  ? process.env.FRONTEND_ORIGIN.split(",").map((o) => o.trim())
  : [];
const allowedOrigins = Array.from(
  new Set([...defaultOrigins, ...envOrigins])
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // allow origin to prevent CORS blocking
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/", (req, res) =>
  res.json({ status: "ok", message: "Klinik Senyum API is running" })
);
app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
