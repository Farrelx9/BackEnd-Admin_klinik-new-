const { z } = require("zod");
const prisma = require("../lib/prisma");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const createSchema = z.object({
  patientId: z.string().min(1, "Pasien wajib dipilih."),
  medicalRecordId: z.string().optional().nullable(),
  totalAmount: z.coerce.number().positive("Total tagihan harus lebih dari 0."),
  notes: z.string().optional().nullable(),
});

// Patient/kunjungan terkait tidak bisa diganti setelah tagihan dibuat —
// sama pola dengan MedicalRecord. Cuma nominal & catatan yang boleh dikoreksi.
const updateSchema = z.object({
  totalAmount: z.coerce.number().positive("Total tagihan harus lebih dari 0.").optional(),
  notes: z.string().optional().nullable(),
});

const include = {
  patient: { select: { id: true, name: true, phone: true } },
  medicalRecord: { select: { id: true, visitDate: true, diagnosis: true, complaint: true } },
  payments: { orderBy: { paidAt: "asc" } },
};

// Recomputes and persists an invoice's status from its actual payments.
// Called inside a transaction after any write that changes the payment
// total (add payment, delete payment, edit totalAmount) — this is the
// ONLY place invoice status is ever set; it's never taken from user input.
async function syncInvoiceStatus(tx, invoiceId) {
  const invoice = await tx.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });
  if (!invoice) return null;

  const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const status = paid <= 0 ? "UNPAID" : paid >= Number(invoice.totalAmount) ? "PAID" : "PARTIAL";

  return tx.invoice.update({
    where: { id: invoiceId },
    data: { status },
    include,
  });
}

function withComputed(invoice) {
  const paidAmount = (invoice.payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
  return {
    ...invoice,
    paidAmount,
    remainingAmount: Math.max(0, Number(invoice.totalAmount) - paidAmount),
  };
}

// GET /invoices?patientId=&status=
const list = asyncHandler(async (req, res) => {
  const where = {};
  if (req.query.patientId) where.patientId = req.query.patientId;
  if (req.query.status) where.status = req.query.status;

  const invoices = await prisma.invoice.findMany({
    where,
    include,
    orderBy: { createdAt: "desc" },
  });

  res.json({ data: invoices.map(withComputed) });
});

// GET /invoices/:id
const getById = asyncHandler(async (req, res) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: req.params.id },
    include,
  });
  if (!invoice) throw new ApiError(404, "Tagihan tidak ditemukan.");
  res.json({ data: withComputed(invoice) });
});

// POST /invoices
const create = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const invoice = await prisma.invoice.create({ data, include });
  res.status(201).json({ data: withComputed(invoice) });
});

// PUT /invoices/:id
const update = asyncHandler(async (req, res) => {
  const data = updateSchema.parse(req.body);

  const invoice = await prisma.$transaction(async (tx) => {
    await tx.invoice.update({ where: { id: req.params.id }, data });
    // totalAmount changing shifts the paid/total ratio, so re-derive status.
    return syncInvoiceStatus(tx, req.params.id);
  });

  res.json({ data: withComputed(invoice) });
});

// DELETE /invoices/:id  (payments cascade-delete with it, per schema)
const remove = asyncHandler(async (req, res) => {
  await prisma.invoice.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

const paymentSchema = z.object({
  amount: z.coerce.number().positive("Nominal harus lebih dari 0."),
  method: z.enum(["CASH", "TRANSFER", "DEBIT", "QRIS"]).optional(),
  paidAt: z.coerce.date().optional(),
  notes: z.string().optional().nullable(),
});

// POST /invoices/:id/payments — records one installment (DP, pelunasan,
// dst). Each call adds a NEW row; it never overwrites a previous one.
const addPayment = asyncHandler(async (req, res) => {
  const data = paymentSchema.parse(req.body);

  const invoiceExists = await prisma.invoice.findUnique({ where: { id: req.params.id } });
  if (!invoiceExists) throw new ApiError(404, "Tagihan tidak ditemukan.");

  const invoice = await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: { ...data, invoiceId: req.params.id },
    });
    return syncInvoiceStatus(tx, req.params.id);
  });

  res.status(201).json({ data: withComputed(invoice) });
});

module.exports = { list, getById, create, update, remove, addPayment };
