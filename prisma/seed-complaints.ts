import { faker } from '@faker-js/faker';
import { prisma } from '../lib/prisma';

// String enums based on schema.prisma
const CLASSIFICATIONS = [
  'PERSYARATAN_LAYANAN',
  'PROSEDUR_LAYANAN',
  'WAKTU_PELAYANAN',
  'BIAYA_TARIF_PELAYANAN',
  'PRODUK_PELAYANAN',
  'KOMPETENSI_PELAKSANA_PELAYANAN',
  'PERILAKU_PETUGAS_PELAYANAN',
  'SARANA_DAN_PRASARANA',
] as const;

const STATUSES = ['BARU', 'PROSES', 'SELESAI'] as const;
const NOTIFICATION_CHANNELS = ['EMAIL', 'WHATSAPP'] as const;

type Status = typeof STATUSES[number];
type Classification = typeof CLASSIFICATIONS[number];
type NotificationChannel = typeof NOTIFICATION_CHANNELS[number];

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log(`Start seeding ...`);

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.notification.deleteMany({});
  await prisma.statusUpdate.deleteMany({});
  await prisma.complaint.deleteMany({});
  console.log('Cleared existing data.');

  const totalComplaints = faker.number.int({ min: 300, max: 600 });
  console.log(`Generating ${totalComplaints} complaints for the year 2025...`);

  for (let i = 0; i < totalComplaints; i++) {
    const code = `PGD${String(i + 1).padStart(6, '0')}`;
    const createdAt = faker.date.between({ from: '2025-01-01T00:00:00.000Z', to: '2025-12-31T23:59:59.999Z' });
    const classification = randomItem(CLASSIFICATIONS);
    const finalStatus = randomItem(STATUSES);

    let rtl = null;
    let completedAt: Date | null = null;

    if (finalStatus === 'PROSES' || finalStatus === 'SELESAI') {
      rtl = faker.lorem.sentence();
    }

    let processDate: Date | null = null;
    if (finalStatus === 'SELESAI') {
      processDate = faker.date.soon({ days: 7, refDate: createdAt });
      completedAt = faker.date.soon({ days: 14, refDate: processDate });
    } else if (finalStatus === 'PROSES') {
      processDate = faker.date.soon({ days: 7, refDate: createdAt });
    }

    // Create the complaint
    const complaint = await prisma.complaint.create({
      data: {
        code,
        reporterName: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        classification: classification as Classification,
        description: faker.lorem.paragraph(),
        status: finalStatus as Status,
        rtl,
        completedAt,
        createdAt,
      },
    });

    // Create status updates history
    await prisma.statusUpdate.create({
      data: {
        complaintId: complaint.id,
        status: 'BARU',
        note: 'Pengaduan diterima.',
        createdAt: createdAt,
      },
    });

    if (processDate) {
      await prisma.statusUpdate.create({
        data: {
          complaintId: complaint.id,
          status: 'PROSES',
          note: 'Pengaduan sedang ditindaklanjuti.',
          createdAt: processDate,
        },
      });
    }

    if (completedAt) {
      await prisma.statusUpdate.create({
        data: {
          complaintId: complaint.id,
          status: 'SELESAI',
          note: 'Pengaduan telah diselesaikan.',
          createdAt: completedAt,
        },
      });
    }

    // Create a notification
    await prisma.notification.create({
      data: {
        complaintId: complaint.id,
        channel: randomItem(NOTIFICATION_CHANNELS) as NotificationChannel,
        status: 'SUCCESS',
        detail: 'Notifikasi awal terkirim.',
        sentAt: createdAt,
      },
    });
  }

  console.log(`Seeding finished. ${totalComplaints} complaints created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
