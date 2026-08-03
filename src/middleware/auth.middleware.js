const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// Verifies the Bearer token and loads the current user onto req.user.
// Matches what the frontend's axios interceptor sends: `Authorization: Bearer <token>`.
const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    throw new ApiError(401, "Token tidak ditemukan.");
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, "Token tidak valid atau sudah kedaluwarsa.");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new ApiError(401, "Akun tidak ditemukan.");
  }

  req.user = user;
  next();
});

// Restricts a route to specific roles, e.g. requireRole("ADMIN").
// Must run after requireAuth.
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, "Kamu tidak punya izin untuk mengakses ini.");
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
