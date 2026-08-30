const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Rydder alle mock bankkonti, transaktioner og samtykkesessioner...");

  await prisma.subscription.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.consentSession.deleteMany({});

  console.log("✓ Databasen er ryddet for mock-data.");
  console.log("✓ Kategorier og klassificeringsregler er bevaret.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
