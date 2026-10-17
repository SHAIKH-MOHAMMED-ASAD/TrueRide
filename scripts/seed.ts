import { resetAndSeedDatabase } from "../src/lib/services/seed";
import { prisma } from "../src/lib/prisma";

async function main() {
  try {
    await resetAndSeedDatabase();
    console.log("Seeding finished successfully.");
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
