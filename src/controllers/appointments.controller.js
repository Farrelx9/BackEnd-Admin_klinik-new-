const { z } = require("zod");
const prisma = require("../lib/prisma");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const appointmentSchema = z.object({
  patientId: z.string().min(1, "Pasien wajib dipilih."),
  dokterId: z.string().optional().nullable(),
  scheduledAt: z.coerce.date(),
  status: z.enum(["SCHEDULED", "DONE", "CANCELLED", "NO_SHOW"]).optional(),
  notes: z.string().optional().nullable(),
  serviceIds: z.array(z.string()).optional(),
});

const include = {
  patient: { select: { id: true, name: true, phone: true } },
  dokter: { select: { id: true, name: true } },
  services: { include: { service: true } },
};

// GET /appointments?date=YYYY-MM-DD&status=
const list = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.date) {
    const start = new Date(`${req.query.date}T00:00:00`);
    const end = new Date(`${req.query.date}T23:59:59.999`);
    where.scheduledAt = { gte: start, lte: end };
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include,
    orderBy: { scheduledAt: "asc" },
  });
  res.json({ data: appointments });
});

const getById = asyncHandler(async (req, res) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    include,
  });
  if (!appointment) throw new ApiError(404, "Jadwal tidak ditemukan.");
  res.json({ data: appointment });
});

const create = asyncHandler(async (req, res) => {
  const { serviceIds, ...data } = appointmentSchema.parse(req.body);
  const appointment = await prisma.appointment.create({
    data: {
      ...data,
      services: serviceIds?.length
        ? { create: serviceIds.map((serviceId) => ({ serviceId })) }
        : undefined,
    },
    include,
  });
  res.status(201).json({ data: appointment });
});

const update = asyncHandler(async (req, res) => {
  const { serviceIds, ...data } = appointmentSchema.partial().parse(req.body);
  const appointment = await prisma.appointment.update({
    where: { id: req.params.id },
    data,
    include,
  });
  res.json({ data: appointment });
});

const remove = asyncHandler(async (req, res) => {
  await prisma.appointment.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

module.exports = { list, getById, create, update, remove };
