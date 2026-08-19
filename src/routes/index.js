const { Router } = require("express");

const authRoutes = require("./auth.routes");
const patientsRoutes = require("./patients.routes");
const appointmentsRoutes = require("./appointments.routes");
const medicalRecordsRoutes = require("./medicalRecords.routes");
const servicesRoutes = require("./services.routes");
const staffRoutes = require("./staff.routes");
const paymentsRoutes = require("./payments.routes");
const invoicesRoutes = require("./invoices.routes");
const router = Router();

router.use("/auth", authRoutes);
router.use("/patients", patientsRoutes);
router.use("/appointments", appointmentsRoutes);
router.use("/medical-records", medicalRecordsRoutes);
router.use("/services", servicesRoutes);
router.use("/staff", staffRoutes);
router.use("/invoices", invoicesRoutes);
router.use("/payments", paymentsRoutes);

module.exports = router;
