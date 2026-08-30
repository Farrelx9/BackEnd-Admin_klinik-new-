const bcrypt = require("bcryptjs");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const staffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6).optional(), // optional on update
  role: z.enum(["ADMIN", "DOKTER"]),
});

const select = { id: true, name: true, email: true, role: true, createdAt: true };

const list = asyncHandler(async (req, res) => {
  const staff = await prisma.user.findMany({ select, orderBy: { name: "asc" } });
  res.json({ data: staff });
});

const create = asyncHandler(async (req, res) => {
  const data = staffSchema.extend({ password: z.string().min(6) }).parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ApiError(409, "Email sudah terdaftar.");

  const hashed = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { ...data, password: hashed },
    select,
  });
  res.status(201).json({ data: user });
});

const update = asyncHandler(async (req, res) => {
  const data = staffSchema.partial().parse(req.body);
  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }
  const user = await prisma.user.update({ where: { id: req.params.id }, data, select });
  res.json({ data: user });
});

const remove = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw new ApiError(400, "Tidak bisa menghapus akun sendiri.");
  }
  await prisma.user.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

module.exports = { list, create, update, remove };
