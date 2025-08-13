-- CreateEnum
CREATE TYPE "public"."KlasifikasiPengaduan" AS ENUM ('PERSYARATAN_LAYANAN', 'PROSEDUR_LAYANAN', 'WAKTU_PELAYANAN', 'BIAYA_TARIF_PELAYANAN', 'PRODUK_PELAYANAN', 'KOMPETENSI_PELAKSANA_PELAYANAN', 'PERILAKU_PETUGAS_PELAYANAN', 'SARANA_DAN_PRASARANA');

-- CreateEnum
CREATE TYPE "public"."StatusPengaduan" AS ENUM ('BARU', 'PROSES', 'SELESAI');

-- CreateEnum
CREATE TYPE "public"."NotificationChannel" AS ENUM ('EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "public"."NotificationStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."AdminRole" AS ENUM ('ADMIN', 'STAFF');

-- CreateTable
CREATE TABLE "public"."Complaint" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "reporterName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "classification" "public"."KlasifikasiPengaduan" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "public"."StatusPengaduan" NOT NULL DEFAULT 'BARU',
    "rtl" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StatusUpdate" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "status" "public"."StatusPengaduan" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Notification" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "channel" "public"."NotificationChannel" NOT NULL,
    "status" "public"."NotificationStatus" NOT NULL DEFAULT 'SUCCESS',
    "detail" TEXT,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AdminUser" (
    "id" TEXT NOT NULL,
    "username" TEXT,
    "passwordHash" TEXT,
    "role" "public"."AdminRole" NOT NULL DEFAULT 'STAFF',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Complaint_code_key" ON "public"."Complaint"("code");

-- CreateIndex
CREATE INDEX "Complaint_createdAt_idx" ON "public"."Complaint"("createdAt");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "public"."Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_classification_idx" ON "public"."Complaint"("classification");

-- CreateIndex
CREATE INDEX "StatusUpdate_complaintId_createdAt_idx" ON "public"."StatusUpdate"("complaintId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_complaintId_sentAt_idx" ON "public"."Notification"("complaintId", "sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_username_key" ON "public"."AdminUser"("username");

-- AddForeignKey
ALTER TABLE "public"."StatusUpdate" ADD CONSTRAINT "StatusUpdate_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "public"."Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "public"."Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
