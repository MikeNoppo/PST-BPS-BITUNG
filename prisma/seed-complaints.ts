
import { PrismaClient, KlasifikasiPengaduan, StatusPengaduan } from '../lib/generated/prisma';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  const complaints = [];
  const classifications = Object.values(KlasifikasiPengaduan);

  for (let i = 0; i < 500; i++) {
    const classification = classifications[Math.floor(Math.random() * classifications.length)];
    const complaint = {
      code: `PGD${String(i + 1).padStart(6, '0')}`,
      reporterName: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      classification: classification,
      description: faker.lorem.sentence(),
      status: StatusPengaduan.BARU,
    };
    complaints.push(complaint);
  }

  await prisma.complaint.createMany({
    data: complaints,
    skipDuplicates: true,
  });

  console.log(`Seeding finished.`);
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
