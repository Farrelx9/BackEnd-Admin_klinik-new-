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
  role: z.enum(["ADMIN", "DOKTER"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email("Email tidak valid."),
  password: z.string().min(1, "Kata sandi wajib diisi."),
});

// For updating YOUR OWN account (name, and optionally password) — as
// opposed to PUT /staff/:id, which is an admin managing someone else's
// account and doesn't require knowing their current password.
const updateProfileSchema = z
  .object({
    name: z.string().min(2, "Nama minimal 2 karakter.").optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, "Kata sandi baru minimal 6 karakter.").optional(),
  })
  .refine((data) => !data.newPassword || data.currentPassword, {
    message: "Masukkan kata sandi saat ini untuk mengganti kata sandi.",
    path: ["currentPassword"],
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

const me = asyncHandler(async (req, res) => {
  res.json({ user: serializeUser(req.user) });
});

const logout = asyncHandler(async (req, res) => {
  res.json({ message: "Berhasil keluar." });
});

// PUT /auth/me — self-service profile update. req.user comes from
// requireAuth, so this can only ever touch the caller's own account.
const updateProfile = asyncHandler(async (req, res) => {
  const data = updateProfileSchema.parse(req.body);
  const updates = {};

  if (data.name) {
    updates.name = data.name;
  }

  if (data.newPassword) {
    const valid = await bcrypt.compare(data.currentPassword, req.user.password);
    if (!valid) {
      throw new ApiError(400, "Kata sandi saat ini tidak sesuai.");
    }
    updates.password = await bcrypt.hash(data.newPassword, 10);
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: updates,
  });

  res.json({ user: serializeUser(user) });
});

module.exports = { register, login, me, logout, updateProfile };
