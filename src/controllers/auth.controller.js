const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const registerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter."),
  email: z.string().email("Email tidak valid."),
  password: z.string().min(6, "Kata sandi minimal 6 karakter."),
  role: z.enum(["ADMIN", "DOKTER", "STAF"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email("Email tidak valid."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function serializeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

// POST /auth/register
// Open for the first admin setup. In production you likely want this
// gated behind requireAuth + requireRole("ADMIN") once you have your
// first admin account — see routes/auth.routes.js for the toggle.
const register = asyncHandler(async (req, res) => {
  const data = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new ApiError(409, "Email sudah terdaftar.");
  }

  const hashed = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { ...data, password: hashed },
  });

  const token = signToken(user);
  res.status(201).json({ token, user: serializeUser(user) });
});

// POST /auth/login
const login = asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user) {
    throw new ApiError(401, "Email atau kata sandi salah.");
  }

  const valid = await bcrypt.compare(data.password, user.password);
  if (!valid) {
    throw new ApiError(401, "Email atau kata sandi salah.");
  }

  const token = signToken(user);
  res.json({ token, user: serializeUser(user) });
});

// GET /auth/me  (requireAuth)
const me = asyncHandler(async (req, res) => {
  res.json({ user: serializeUser(req.user) });
});

// POST /auth/logout  (requireAuth)
// JWTs are stateless, so there's nothing to invalidate server-side here.
// This endpoint exists so the frontend has a symmetric call to hit; the
// actual "logout" happens client-side by discarding the token. If you
// need real server-side revocation later, add a token blocklist table.
const logout = asyncHandler(async (req, res) => {
  res.json({ message: "Berhasil keluar." });
});

module.exports = { register, login, me, logout };
