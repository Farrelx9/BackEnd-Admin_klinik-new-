const { z } = require("zod");
const prisma = require("../lib/prisma");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const paymentSchema = z.object({
  patientId: z.string().min(1, "Pasien wajib dipilih."),
  medicalRecordId: z.string().optional().nullable(),
  amount: z.coerce.number().nonnegative("Nominal tidak boleh negatif."),
  method: z.enum(["CASH", "TRANSFER", "DEBIT", "QRIS"]).optional(),
  status: z.enum(["UNPAID", "PARTIAL", "PAID"]).optional(),
  paidAt: z.coerce.date().optional().nullable(),
});

const include = {
  patient: { select: { id: true, name: true } },
  medicalRecord: { select: { id: true, visitDate: true, diagnosis: true } },
};

const list = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.patientId) where.patientId = req.query.patientId;

  const payments = await prisma.payment.findMany({
    where,
    include,
    orderBy: { createdAt: "desc" },
  });
  res.json({ data: payments });
});

const getById = asyncHandler(async (req, res) => {
  const payment = await prisma.payment.findUnique({ where: { id: req.params.id }, include });
  if (!payment) throw new ApiError(404, "Pembayaran tidak ditemukan.");
  res.json({ data: payment });
});

const create = asyncHandler(async (req, res) => {
  const data = paymentSchema.parse(req.body);
  const payment = await prisma.payment.create({ data, include });
  res.status(201).json({ data: payment });
});

const update = asyncHandler(async (req, res) => {
  const data = paymentSchema.partial().parse(req.body);
  const payment = await prisma.payment.update({ where: { id: req.params.id }, data, include });
  res.json({ data: payment });
});

const remove = asyncHandler(async (req, res) => {
  await prisma.payment.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

module.exports = { list, getById, create, update, remove };
