import { PrismaClient } from "@prisma/client";
import sampleData from "./sample-data";

async function main() {
  const prisma = new PrismaClient();

  // Delete all existing products
  await prisma.product.deleteMany();

  // Create new products
  await prisma.product.createMany({
    data: sampleData.products,
  });

  console.log(`Database has been seeded. 🌱`);
}

main();
