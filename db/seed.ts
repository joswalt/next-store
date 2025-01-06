import { PrismaClient } from "@prisma/client";

import { hash } from "@/lib/encrypt";

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
  const users = [];
  for (let i = 0; i < sampleData.users.length; i++) {
    users.push({
      ...sampleData.users[i],
      password: await hash(sampleData.users[i].password as string),
    });
    console.log(sampleData.users[i].password, await hash(sampleData.users[i].password as string));
  }
  await prisma.user.createMany({ data: users });

  console.log(`Database has been seeded. 🌱`);
}

main();
