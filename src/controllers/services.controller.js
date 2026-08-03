const { z } = require("zod");
const prisma = require("../lib/prisma");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const serviceSchema = z.object({
  name: z.string().min(2, "Nama layanan minimal 2 karakter."),
  description: z.string().optional().nullable(),
  price: z.coerce.number().nonnegative("Harga tidak boleh negatif."),
});

const list = asyncHandler(async (req, res) => {
  const services = await prisma.service.findMany({ orderBy: { name: "asc" } });
  res.json({ data: services });
});

const getById = asyncHandler(async (req, res) => {
  const service = await prisma.service.findUnique({ where: { id: req.params.id } });
  if (!service) throw new ApiError(404, "Layanan tidak ditemukan.");
  res.json({ data: service });
});

const create = asyncHandler(async (req, res) => {
  const data = serviceSchema.parse(req.body);
  const service = await prisma.service.create({ data });
  res.status(201).json({ data: service });
});

const update = asyncHandler(async (req, res) => {
  const data = serviceSchema.partial().parse(req.body);
  const service = await prisma.service.update({ where: { id: req.params.id }, data });
  res.json({ data: service });
});

const remove = asyncHandler(async (req, res) => {
  await prisma.service.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

module.exports = { list, getById, create, update, remove };
