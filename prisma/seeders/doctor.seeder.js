const bcrypt = require("bcryptjs");

async function seedDoctor(prisma) {
  const doctorEmail = "irna@klinikgigi.com";
  const doctorPassword = "irna123"; // ganti setelah login pertama kali

  const existing = await prisma.user.findUnique({
    where: { email: doctorEmail },
  });
  if (existing) {
    console.log("Akun drg. Irna sudah ada, dilewati.");
    return;
  }

  const hashed = await bcrypt.hash(doctorPassword, 10);
  await prisma.user.create({
    data: {
      name: "Irna",
      email: doctorEmail,
      password: hashed,
      role: "DOKTER",
    },
  });
  console.log(`Akun drg. Irna dibuat: ${doctorEmail} / ${doctorPassword}`);
}

module.exports = seedDoctor;
