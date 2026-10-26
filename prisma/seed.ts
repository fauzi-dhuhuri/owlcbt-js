import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Memulai seeding database owlcbt_db...");

  // 1. Pengaturan Sistem
  await prisma.systemSetting.updateMany({
    where: {
      schoolName: {
        contains: "Candy",
        mode: "insensitive",
      },
    },
    data: {
      schoolName: "SMA Owl Nusantara",
    },
  });

  const settings = await prisma.systemSetting.upsert({
    where: { id: "default-setting" },
    update: {
      schoolName: "SMA Owl Nusantara",
      schoolAddress: "Jl. Pendidikan No. 1, Jakarta",
      headmasterName: "Dr. Muhammad Fauzi, M.Pd",
    },
    create: {
      id: "default-setting",
      schoolName: "SMA Owl Nusantara",
      schoolAddress: "Jl. Pendidikan No. 1, Jakarta",
      headmasterName: "Dr. Muhammad Fauzi, M.Pd",
      timezone: "Asia/Jakarta",
    },
  });
  console.log("✅ Pengaturan sistem berhasil diperbarui:", settings.schoolName);

  // 2. Hash Password Default
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const teacherPasswordHash = await bcrypt.hash("guru123", 10);
  const proctorPasswordHash = await bcrypt.hash("proktor123", 10);
  const studentPasswordHash = await bcrypt.hash("siswa123", 10);

  // 3. Admin, Guru, & Proktor
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: adminPasswordHash,
      name: "Administrator Utama",
      role: "ADMIN",
      email: "admin@owlcbt.edu",
    },
  });

  const teacher = await prisma.user.upsert({
    where: { username: "guru1" },
    update: {},
    create: {
      username: "guru1",
      passwordHash: teacherPasswordHash,
      name: "Budi Santoso, S.Pd",
      role: "TEACHER",
      email: "budi@owlcbt.edu",
    },
  });

  const proctor = await prisma.user.upsert({
    where: { username: "proktor1" },
    update: {},
    create: {
      username: "proktor1",
      passwordHash: proctorPasswordHash,
      name: "Rizky Teknisi, S.Kom",
      role: "PROCTOR",
      email: "proktor@owlcbt.edu",
    },
  });
  console.log("✅ Akun Admin, Guru, & Proktor berhasil disiapkan");

  // 4. Data Kelas
  const class1 = await prisma.class.upsert({
    where: { id: "class-xii-mipa-1" },
    update: {},
    create: {
      id: "class-xii-mipa-1",
      name: "XII MIPA 1",
      level: "XII",
      major: "MIPA",
    },
  });

  const class2 = await prisma.class.upsert({
    where: { id: "class-xii-ips-1" },
    update: {},
    create: {
      id: "class-xii-ips-1",
      name: "XII IPS 1",
      level: "XII",
      major: "IPS",
    },
  });
  console.log("✅ Kelas XII MIPA 1 & XII IPS 1 berhasil dibuat");

  // 5. Data Siswa
  const student = await prisma.user.upsert({
    where: { username: "1001" }, // NISN
    update: {},
    create: {
      username: "1001",
      passwordHash: studentPasswordHash,
      name: "Ahmad Siswa Perdana",
      role: "STUDENT",
      classId: class1.id,
      gender: "L",
    },
  });
  console.log("✅ Siswa contoh (NISN: 1001, Pass: siswa123) berhasil dibuat");

  // 6. Mata Pelajaran
  const subject = await prisma.subject.upsert({
    where: { code: "MAT" },
    update: {},
    create: {
      code: "MAT",
      name: "Matematika Peminatan",
    },
  });

  // 7. Bank Soal
  const bank = await prisma.questionBank.upsert({
    where: { code: "BNK-MAT-XII-2026" },
    update: {},
    create: {
      code: "BNK-MAT-XII-2026",
      title: "Bank Soal Ujian Akhir Matematika XII",
      description: "Soal latihan dan ujian semester ganjil",
      subjectId: subject.id,
      createdById: teacher.id,
    },
  });

  // 8. Butir Soal & Pilihan Jawaban
  const question1Count = await prisma.question.count({
    where: { bankId: bank.id },
  });

  if (question1Count === 0) {
    // Soal 1: Pilihan Ganda Tunggal
    await prisma.question.create({
      data: {
        bankId: bank.id,
        type: "MULTIPLE_CHOICE",
        content: "<p>Berapakah nilai dari turunan pertama dari fungsi <strong>f(x) = 3x² + 5x - 7</strong> pada saat x = 2?</p>",
        weight: 2.0,
        orderIndex: 1,
        options: {
          create: [
            { label: "A", content: "12", isCorrect: false, orderIndex: 1 },
            { label: "B", content: "17", isCorrect: true, orderIndex: 2 },
            { label: "C", content: "22", isCorrect: false, orderIndex: 3 },
            { label: "D", content: "25", isCorrect: false, orderIndex: 4 },
            { label: "E", content: "11", isCorrect: false, orderIndex: 5 },
          ],
        },
      },
    });

    // Soal 2: Pilihan Ganda Kompleks
    await prisma.question.create({
      data: {
        bankId: bank.id,
        type: "MULTIPLE_RESPONSE",
        content: "<p>Manakah dari bilangan berikut yang merupakan <strong>bilangan prima</strong>? (Pilih semua yang benar)</p>",
        weight: 2.0,
        orderIndex: 2,
        options: {
          create: [
            { label: "A", content: "2", isCorrect: true, orderIndex: 1 },
            { label: "B", content: "9", isCorrect: false, orderIndex: 2 },
            { label: "C", content: "13", isCorrect: true, orderIndex: 3 },
            { label: "D", content: "21", isCorrect: false, orderIndex: 4 },
            { label: "E", content: "29", isCorrect: true, orderIndex: 5 },
          ],
        },
      },
    });

    // Soal 3: Esai
    await prisma.question.create({
      data: {
        bankId: bank.id,
        type: "ESSAY",
        content: "<p>Jelaskan pengertian limit fungsi aljabar menurut pemahaman Anda dan berikan satu contoh penerapannya dalam kehidupan sehari-hari!</p>",
        weight: 5.0,
        orderIndex: 3,
      },
    });
    console.log("✅ 3 Butir Soal contoh (PG, PG Kompleks, Esai) berhasil ditambahkan");
  }

  // 9. Jadwal Ujian
  const now = new Date();
  const nextMonth = new Date();
  nextMonth.setDate(now.getDate() + 30);

  const exam = await prisma.exam.upsert({
    where: { id: "exam-mat-sample" },
    update: {},
    create: {
      id: "exam-mat-sample",
      title: "Penilaian Akhir Semester Matematika XII",
      bankId: bank.id,
      token: "OWL888",
      durationMinutes: 90,
      startTime: now,
      endTime: nextMonth,
      randomizeQuestions: true,
      randomizeOptions: true,
      showResultImmediate: true,
      passingGrade: 75.0,
      status: "ACTIVE",
      classes: {
        connect: [{ id: class1.id }],
      },
    },
  });
  console.log("✅ Ujian contoh berhasil dibuat (Token: OWL888, Durasi: 90 Menit)");

  console.log("✨ Seeding selesai dengan sempurna!");
}

main()
  .catch((e) => {
    console.error("❌ Error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
