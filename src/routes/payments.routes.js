const { Router } = require("express");
const controller = require("../controllers/payments.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = Router();

router.use(requireAuth);

// Creating a payment happens via POST /invoices/:id/payments (see
// invoices.routes.js) — an installment only ever makes sense attached
// to a specific invoice. This router just handles removing one.
router.delete("/:id", controller.remove);

module.exports = router;
