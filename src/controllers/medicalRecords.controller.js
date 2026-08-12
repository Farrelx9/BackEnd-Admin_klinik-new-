const { z } = require("zod");
const prisma = require("../lib/prisma");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const recordSchema = z.object({
  patientId: z.string().min(1, "Pasien wajib dipilih."),
  dokterId: z.string().optional().nullable(),
  appointmentId: z.string().optional().nullable(),
  complaint: z.string().optional().nullable(),
  diagnosis: z.string().optional().nullable(),
  treatment: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  visitDate: z.coerce.date().optional(),
  // Optional list of treatments performed in this visit, e.g.
  // [{ serviceId: "...", toothNumber: "36" }]
  services: z
    .array(
      z.object({
        serviceId: z.string(),
        toothNumber: z.string().optional().nullable(),
      }),
    )
    .optional(),
});

const include = {
  patient: {
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      nik: true,
      birthDate: true,
      gender: true,
      bloodType: true,
      address: true,
      allergies: true,
    },
  },
  dokter: { select: { id: true, name: true } },
  services: { include: { service: true } },
};

// GET /medical-records?patientId=&page=&pageSize=
const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(100, parseInt(req.query.pageSize) || 20);
  const where = req.query.patientId ? { patientId: req.query.patientId } : {};

  const [data, total] = await Promise.all([
    prisma.medicalRecord.findMany({
      where,
      include,
      orderBy: { visitDate: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.medicalRecord.count({ where }),
  ]);

  res.json({
    data,
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
});

// GET /medical-records/:id
const getById = asyncHandler(async (req, res) => {
  const record = await prisma.medicalRecord.findUnique({
    where: { id: req.params.id },
    include,
  });
  if (!record) throw new ApiError(404, "Rekam medis tidak ditemukan.");
  res.json({ data: record });
});

// POST /medical-records
const create = asyncHandler(async (req, res) => {
  const { services, ...data } = recordSchema.parse(req.body);

  // Snapshot each service's current price at the time of the visit, so
  // later price changes in the master `services` table don't rewrite
  // historical medical records.
  let serviceCreates = [];
  if (services?.length) {
    const serviceIds = services.map((s) => s.serviceId);
    const found = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
    });
    const priceById = Object.fromEntries(found.map((s) => [s.id, s.price]));

    serviceCreates = services.map((s) => ({
      serviceId: s.serviceId,
      toothNumber: s.toothNumber || null,
      priceAtTime: priceById[s.serviceId] ?? 0,
    }));
  }

  const record = await prisma.medicalRecord.create({
    data: {
      ...data,
      services: serviceCreates.length ? { create: serviceCreates } : undefined,
    },
    include,
  });

  res.status(201).json({ data: record });
});

// PUT /medical-records/:id
// If `services` is included in the payload, we replace the record's line
// items entirely (delete existing, snapshot fresh prices, re-create).
// This keeps billing consistent — no partial/ambiguous merges — at the
// cost of not preserving each line item's own id across an edit.
const update = asyncHandler(async (req, res) => {
  const { services, ...data } = recordSchema.partial().parse(req.body);

  const record = await prisma.$transaction(async (tx) => {
    if (services) {
      await tx.medicalRecordService.deleteMany({
        where: { medicalRecordId: req.params.id },
      });

      if (services.length) {
        const serviceIds = services.map((s) => s.serviceId);
        const found = await tx.service.findMany({
          where: { id: { in: serviceIds } },
        });
        const priceById = Object.fromEntries(found.map((s) => [s.id, s.price]));

        await tx.medicalRecordService.createMany({
          data: services.map((s) => ({
            medicalRecordId: req.params.id,
            serviceId: s.serviceId,
            toothNumber: s.toothNumber || null,
            priceAtTime: priceById[s.serviceId] ?? 0,
          })),
        });
      }
    }

    return tx.medicalRecord.update({
      where: { id: req.params.id },
      data,
      include,
    });
  });

  res.json({ data: record });
});

// DELETE /medical-records/:id
const remove = asyncHandler(async (req, res) => {
  await prisma.medicalRecord.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

module.exports = { list, getById, create, update, remove };
