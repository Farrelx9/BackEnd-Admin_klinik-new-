const { Router } = require("express");
const controller = require("../controllers/invoices.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = Router();

router.use(requireAuth);

router.get("/", controller.list);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

// Nested: adding a payment is really "add an installment to this
// invoice", so it lives under /invoices/:id/payments rather than being
// a top-level POST /payments with an invoiceId in the body.
router.post("/:id/payments", controller.addPayment);

module.exports = router;
