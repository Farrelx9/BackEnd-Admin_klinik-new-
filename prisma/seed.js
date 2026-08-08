require("dotenv").config();
const prisma = require("../src/lib/prisma");
const seedAdmin = require("./seeders/admin.seeder");
const seedServices = require("./seeders/services.seeder");

async function main() {
  await seedAdmin(prisma);
  await seedServices(prisma);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
