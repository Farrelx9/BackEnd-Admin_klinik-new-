const { z } = require("zod");
const prisma = require("../lib/prisma");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const patientSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter."),
  nik: z.string().length(16, "NIK harus 16 digit.").optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  birthDate: z.coerce.date().optional().nullable(),
  gender: z.enum(["L", "P"]).optional().nullable(),
  bloodType: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
});

// GET /patients?search=&page=&pageSize=
const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(100, parseInt(req.query.pageSize) || 20);
  const search = req.query.search?.trim();

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { nik: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.patient.count({ where }),
  ]);

  res.json({ data, meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
});

// GET /patients/:id
const getById = asyncHandler(async (req, res) => {
  const patient = await prisma.patient.findUnique({
    where: { id: req.params.id },
    include: {
      medicalRecords: { orderBy: { visitDate: "desc" }, take: 10 },
      appointments: { orderBy: { scheduledAt: "desc" }, take: 10 },
    },
  });
  if (!patient) throw new ApiError(404, "Pasien tidak ditemukan.");
  res.json({ data: patient });
});

// POST /patients
const create = asyncHandler(async (req, res) => {
  const data = patientSchema.parse(req.body);
  const patient = await prisma.patient.create({ data });
  res.status(201).json({ data: patient });
});

// PUT /patients/:id
const update = asyncHandler(async (req, res) => {
  const data = patientSchema.partial().parse(req.body);
  const patient = await prisma.patient.update({
    where: { id: req.params.id },
    data,
  });
  res.json({ data: patient });
});

// DELETE /patients/:id
const remove = asyncHandler(async (req, res) => {
  await prisma.patient.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

module.exports = { list, getById, create, update, remove };
