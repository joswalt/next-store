import { PrismaClient } from "@prisma/client";
import sampleData from "./sample-data";

async function main() {
  const prisma = new PrismaClient();

  // Delete all from existing tables
  await prisma.product.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  // Create new products
  await prisma.product.createMany({
    data: sampleData.products,
  });

  // Create new users
  await prisma.user.createMany({
    data: sampleData.users,
  });

  console.log(`Database has been seeded. 🌱`);
}

main();
