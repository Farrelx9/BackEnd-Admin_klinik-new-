const bcrypt = require("bcryptjs");

async function seedAdmin(prisma) {
  const adminEmail = "admin@klinikgigi.com";
  const adminPassword = "admin123"; // ganti setelah login pertama kali

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existingAdmin) {
    console.log("Admin sudah ada, dilewati.");
    return;
  }

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
}

module.exports = seedAdmin;
