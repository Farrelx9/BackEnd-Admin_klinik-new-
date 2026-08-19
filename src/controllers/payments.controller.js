const prisma = require("../lib/prisma");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

// Recompute helper duplicated here (small, avoids a circular require
// between controllers). Keeps the same logic as invoices.controller.js.
async function syncInvoiceStatus(tx, invoiceId) {
  const invoice = await tx.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });
  if (!invoice) return;

  const paid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const status = paid <= 0 ? "UNPAID" : paid >= Number(invoice.totalAmount) ? "PAID" : "PARTIAL";

  await tx.invoice.update({ where: { id: invoiceId }, data: { status } });
}

// DELETE /payments/:id
// Removing an installment (e.g. it was entered by mistake) always
// re-syncs the parent invoice's status/remaining balance.
const remove = asyncHandler(async (req, res) => {
  const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });
  if (!payment) throw new ApiError(404, "Data pembayaran tidak ditemukan.");

  await prisma.$transaction(async (tx) => {
    await tx.payment.delete({ where: { id: req.params.id } });
    await syncInvoiceStatus(tx, payment.invoiceId);
  });

  res.status(204).send();
});

module.exports = { remove };
