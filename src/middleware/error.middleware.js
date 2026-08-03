const { ZodError } = require("zod");
const ApiError = require("../utils/ApiError");

function notFoundHandler(req, res) {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} tidak ditemukan.` });
}

// Keep this as the LAST middleware registered in app.js.
function errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      message: "Data yang dikirim tidak valid.",
      errors: err.flatten().fieldErrors,
    });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  // Prisma unique constraint violation
  if (err.code === "P2002") {
    return res.status(409).json({
      message: `Data dengan ${err.meta?.target?.join(", ") || "field ini"} sudah ada.`,
    });
  }

  // Prisma "record not found" on update/delete
  if (err.code === "P2025") {
    return res.status(404).json({ message: "Data tidak ditemukan." });
  }

  console.error(err);
  return res.status(500).json({ message: "Terjadi kesalahan pada server." });
}

module.exports = { notFoundHandler, errorHandler };
