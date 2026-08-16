const { Router } = require("express");
const controller = require("../controllers/staff.controller");
const { requireAuth, requireRole } = require("../middleware/auth.middleware");

const router = Router();

router.use(requireAuth);

// Reading the staff list (needed for picking a dokter when scheduling an
// appointment, etc.) is fine for any logged-in user. Only mutating staff
// accounts is restricted to admins.
router.get("/", controller.list);
router.post("/", requireRole("ADMIN"), controller.create);
router.put("/:id", requireRole("ADMIN"), controller.update);
router.delete("/:id", requireRole("ADMIN"), controller.remove);

module.exports = router;
