const { Router } = require("express");
const { register, login, me, logout, updateProfile } = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth.middleware");

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.put("/me", requireAuth, updateProfile);
router.post("/logout", requireAuth, logout);

module.exports = router;
