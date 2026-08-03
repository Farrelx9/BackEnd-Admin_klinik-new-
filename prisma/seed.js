const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "admin@klinikgigi.com";
  const adminPassword = "admin123"; // ganti setelah login pertama kali

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const hashed = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        name: "Admin Klinik",
        email: adminEmail,
        password: hashed,
        role: "ADMIN",
      },
    });
    console.log(`Admin dibuat: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log("Admin sudah ada, dilewati.");
  }

  const services = [
    { name: "Konsultasi", description: "Pemeriksaan awal gigi & mulut", price: 50000 },
    { name: "Scaling Gigi", description: "Pembersihan karang gigi", price: 250000 },
    { name: "Tambal Gigi", description: "Penambalan komposit per gigi", price: 200000 },
    { name: "Cabut Gigi", description: "Pencabutan gigi biasa", price: 150000 },
  ];

  for (const service of services) {
    const exists = await prisma.service.findFirst({ where: { name: service.name } });
    if (!exists) {
      await prisma.service.create({ data: service });
    }
  }
  console.log("Layanan contoh siap.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
