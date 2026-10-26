import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

/**
 * OwlCBT Database Migration Utility
 *
 * Skrip ini membaca file SQL dump (MySQL) dari aplikasi CBT legacy,
 * melakukan tokenisasi ekspresi VALUES tanpa ketergantungan library eksternal,
 * dan memetakan datanya ke skema PostgreSQL Prisma OwlCBT.
 *
 * Cara penggunaan:
 * npx tsx scripts/migrate-owlcbt.ts /path/to/dump.sql
 */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Tokenize a SQL VALUES block into rows of values.
 * Correctly handles strings with escaped quotes, NULLs, numbers, and dates.
 */
function parseSqlRows(valuesString: string): Array<Array<string | number | null>> {
  const rows: Array<Array<string | number | null>> = [];
  let inString = false;
  let stringChar = "";
  let isEscaped = false;
  let inRow = false;
  let currentToken = "";
  let currentRow: Array<string | number | null> = [];

  for (let i = 0; i < valuesString.length; i++) {
    const char = valuesString[i];

    if (inString) {
      if (isEscaped) {
        currentToken += char;
        isEscaped = false;
      } else if (char === "\\") {
        isEscaped = true;
      } else if (char === stringChar) {
        // End of string
        inString = false;
      } else {
        currentToken += char;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      inString = true;
      stringChar = char;
      continue;
    }

    if (char === "(" && !inRow) {
      inRow = true;
      currentRow = [];
      currentToken = "";
      continue;
    }

    if (char === ")" && inRow) {
      // End of row
      inRow = false;
      pushToken(currentRow, currentToken);
      currentToken = "";
      rows.push(currentRow);
      continue;
    }

    if (char === "," && inRow) {
      pushToken(currentRow, currentToken);
      currentToken = "";
      continue;
    }

    if (inRow) {
      currentToken += char;
    }
  }

  return rows;
}

function pushToken(row: Array<string | number | null>, rawToken: string) {
  const trimmed = rawToken.trim();
  if (trimmed === "" || trimmed.toUpperCase() === "NULL") {
    row.push(null);
  } else if (!isNaN(Number(trimmed)) && !trimmed.startsWith("0x")) {
    row.push(Number(trimmed));
  } else {
    row.push(trimmed);
  }
}

/**
 * Extract table insert data from SQL file content.
 */
function extractInserts(sqlContent: string) {
  const insertRegex = /INSERT\s+(?:IGNORE\s+)?INTO\s+[`"']?([a-zA-Z0-9_]+)[`"']?\s*\(([^)]+)\)\s*VALUES\s*([\s\S]+?);/gi;
  const tableData: Record<string, Array<Record<string, any>>> = {};

  let match: RegExpExecArray | null;
  while ((match = insertRegex.exec(sqlContent)) !== null) {
    const tableName = match[1].toLowerCase();
    const rawColumns = match[2];
    const rawValues = match[3];

    const columns = rawColumns
      .split(",")
      .map((col) => col.trim().replace(/[`"']/g, ""));

    const rows = parseSqlRows(rawValues);

    if (!tableData[tableName]) {
      tableData[tableName] = [];
    }

    for (const row of rows) {
      const obj: Record<string, any> = {};
      for (let i = 0; i < columns.length; i++) {
        obj[columns[i]] = row[i] !== undefined ? row[i] : null;
      }
      tableData[tableName].push(obj);
    }
  }

  return tableData;
}

async function migrateCandyCbt(sqlFilePath: string) {
  console.log(`\n======================================================`);
  console.log(`🚀 MEMULAI MIGRASI DATA CANDY CBT -> OWLCBT-JS`);
  console.log(`📂 Membaca file dump SQL: ${sqlFilePath}`);
  console.log(`======================================================\n`);

  if (!fs.existsSync(sqlFilePath)) {
    throw new Error(`File SQL tidak ditemukan di lokasi: ${sqlFilePath}`);
  }

  const sqlContent = fs.readFileSync(sqlFilePath, "utf-8");
  const data = extractInserts(sqlContent);

  const tableNames = Object.keys(data);
  console.log(`📊 Ditemukan data untuk tabel: ${tableNames.join(", ") || "(Kosong)"}\n`);

  // Default fallback password jika siswa atau guru memiliki password kosong
  const defaultPasswordHash = await bcrypt.hash("123456", 10);

  // -----------------------------------------------------------------
  // 1. MIGRASI SETTING (PENGATURAN SEKOLAH)
  // -----------------------------------------------------------------
  if (data["setting"] && data["setting"].length > 0) {
    console.log(`⏳ Memigrasi data Pengaturan Sistem (setting)...`);
    const s = data["setting"][0];
    await prisma.systemSetting.upsert({
      where: { id: "default-setting" },
      update: {
        schoolName: s.sekolah || s.aplikasi || "SMA Owl Nusantara",
        schoolAddress: (s.alamat || "").replace(/<br\s*\/?>/gi, " ").trim(),
        headmasterName: s.kepsek || null,
        timezone: s.waktu || "Asia/Jakarta",
      },
      create: {
        id: "default-setting",
        schoolName: s.sekolah || s.aplikasi || "SMA Owl Nusantara",
        schoolAddress: (s.alamat || "").replace(/<br\s*\/?>/gi, " ").trim(),
        headmasterName: s.kepsek || null,
        timezone: s.waktu || "Asia/Jakarta",
      },
    });
    console.log(`   ✅ Setting sekolah berhasil diimpor: "${s.sekolah || s.aplikasi}"`);
  }

  // -----------------------------------------------------------------
  // 2. MIGRASI PENGAWAS (GURU, PROKTOR, & ADMIN)
  // -----------------------------------------------------------------
  let totalStaff = 0;
  if (data["pengawas"]) {
    console.log(`⏳ Memigrasi data Guru/Admin/Proktor (pengawas: ${data["pengawas"].length} akun)...`);
    for (const p of data["pengawas"]) {
      if (!p.username) continue;
      const cleanUsername = String(p.username).trim();
      let role: "ADMIN" | "TEACHER" | "PROCTOR" = "TEACHER";
      const lvl = String(p.level || "").toLowerCase();
      if (lvl === "admin") role = "ADMIN";
      else if (lvl === "pengawas") role = "PROCTOR";

      let pwdHash = defaultPasswordHash;
      if (p.password) {
        const rawPwd = String(p.password).trim();
        if (rawPwd.startsWith("$2y$") || rawPwd.startsWith("$2a$") || rawPwd.startsWith("$2b$")) {
          pwdHash = rawPwd.replace(/^\$2y\$/, "$2a$"); // Kompatibilitas bcrypt Node.js
        } else if (rawPwd.length > 0) {
          pwdHash = await bcrypt.hash(rawPwd, 10);
        }
      }

      await prisma.user.upsert({
        where: { username: cleanUsername },
        update: {
          name: p.nama || cleanUsername,
          role,
          email: p.email || null,
          phone: p.no_hp || null,
          gender: p.jenis_kelamin || null,
        },
        create: {
          username: cleanUsername,
          passwordHash: pwdHash,
          name: p.nama || cleanUsername,
          role,
          email: p.email || null,
          phone: p.no_hp || null,
          gender: p.jenis_kelamin || null,
        },
      });
      totalStaff++;
    }
    console.log(`   ✅ Berhasil mengimpor/sinkron ${totalStaff} akun pengawas/guru/admin.`);
  }

  // -----------------------------------------------------------------
  // 3. MIGRASI KELAS & JURUSAN
  // -----------------------------------------------------------------
  let totalClass = 0;
  const classIdMap = new Map<string, string>(); // map id_kelas Candy ke id Class baru

  if (data["kelas"]) {
    console.log(`⏳ Memigrasi data Kelas (kelas: ${data["kelas"].length} data)...`);
    for (const k of data["kelas"]) {
      if (!k.id_kelas) continue;
      const cleanId = String(k.id_kelas).trim();
      const name = k.nama ? String(k.nama).trim() : cleanId;
      const level = k.level ? String(k.level).trim() : "X";

      const createdClass = await prisma.class.upsert({
        where: { id: `class-${cleanId.toLowerCase().replace(/[^a-z0-9]/g, "-")}` },
        update: { name, level },
        create: {
          id: `class-${cleanId.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          name,
          level,
        },
      });
      classIdMap.set(cleanId, createdClass.id);
      totalClass++;
    }
    console.log(`   ✅ Berhasil mengimpor ${totalClass} kelas.`);
  }

  // -----------------------------------------------------------------
  // 4. MIGRASI SISWA
  // -----------------------------------------------------------------
  let totalStudents = 0;
  if (data["siswa"]) {
    console.log(`⏳ Memigrasi data Siswa (siswa: ${data["siswa"].length} data)...`);
    for (const s of data["siswa"]) {
      // Username siswa bisa dari username, nis, atau no_peserta
      const username = String(s.username || s.nis || s.no_peserta || "").trim();
      if (!username) continue;

      let pwdHash = defaultPasswordHash;
      if (s.password) {
        const rawPwd = String(s.password).trim();
        if (rawPwd.startsWith("$2y$") || rawPwd.startsWith("$2a$") || rawPwd.startsWith("$2b$")) {
          pwdHash = rawPwd.replace(/^\$2y\$/, "$2a$");
        } else if (rawPwd.length > 0) {
          pwdHash = await bcrypt.hash(rawPwd, 10);
        }
      }

      // Cari relasi kelas
      let matchedClassId: string | undefined = undefined;
      if (s.id_kelas && classIdMap.has(String(s.id_kelas).trim())) {
        matchedClassId = classIdMap.get(String(s.id_kelas).trim());
      }

      await prisma.user.upsert({
        where: { username },
        update: {
          name: s.nama || username,
          role: "STUDENT",
          gender: s.jenis_kelamin || null,
          phone: s.hp || null,
          email: s.email || null,
          classId: matchedClassId,
        },
        create: {
          username,
          passwordHash: pwdHash,
          name: s.nama || username,
          role: "STUDENT",
          gender: s.jenis_kelamin || null,
          phone: s.hp || null,
          email: s.email || null,
          classId: matchedClassId,
        },
      });
      totalStudents++;
    }
    console.log(`   ✅ Berhasil mengimpor ${totalStudents} siswa.`);
  }

  // -----------------------------------------------------------------
  // 5. MIGRASI MATA PELAJARAN (mata_pelajaran)
  // -----------------------------------------------------------------
  let totalSubjects = 0;
  const subjectIdMap = new Map<string, string>(); // kode_mapel -> id Subject

  if (data["mata_pelajaran"]) {
    console.log(`⏳ Memigrasi data Mata Pelajaran (mata_pelajaran: ${data["mata_pelajaran"].length} data)...`);
    for (const m of data["mata_pelajaran"]) {
      if (!m.kode_mapel) continue;
      const code = String(m.kode_mapel).trim().toUpperCase();
      const name = m.nama_mapel ? String(m.nama_mapel).trim() : code;

      const sub = await prisma.subject.upsert({
        where: { code },
        update: { name },
        create: { code, name },
      });
      subjectIdMap.set(code, sub.id);
      totalSubjects++;
    }
    console.log(`   ✅ Berhasil mengimpor ${totalSubjects} mata pelajaran.`);
  }

  // -----------------------------------------------------------------
  // 6. MIGRASI BANK SOAL (mapel)
  // -----------------------------------------------------------------
  let totalBanks = 0;
  const bankIdMap = new Map<number | string, string>(); // id_mapel -> id QuestionBank

  // Dapatkan 1 user admin/guru default untuk relasi createdBy jika idguru tidak cocok
  const fallbackUser = await prisma.user.findFirst({
    where: { role: { in: ["ADMIN", "TEACHER"] } },
  });

  if (data["mapel"] && fallbackUser) {
    console.log(`⏳ Memigrasi Bank Soal (mapel: ${data["mapel"].length} data)...`);
    for (const b of data["mapel"]) {
      const idMapelOld = b.id_mapel;
      const code = b.kode ? String(b.kode).trim() : `BANK-${idMapelOld}`;
      const title = b.nama ? String(b.nama).trim() : `Bank Soal ${code}`;

      // Cari atau buat Subject yang sesuai
      let subjectId = subjectIdMap.get(code);
      if (!subjectId) {
        const fallbackSub = await prisma.subject.upsert({
          where: { code: code.substring(0, 10) },
          update: {},
          create: {
            code: code.substring(0, 10),
            name: title,
          },
        });
        subjectId = fallbackSub.id;
      }

      const qb = await prisma.questionBank.upsert({
        where: { code },
        update: {
          title,
          subjectId,
        },
        create: {
          code,
          title,
          subjectId,
          createdById: fallbackUser.id,
        },
      });
      bankIdMap.set(idMapelOld, qb.id);
      totalBanks++;
    }
    console.log(`   ✅ Berhasil mengimpor ${totalBanks} bank soal.`);
  }

  // -----------------------------------------------------------------
  // 7. MIGRASI BUTIR SOAL & OPSI (soal -> Question & QuestionOption)
  // -----------------------------------------------------------------
  let totalQuestions = 0;
  let totalOptions = 0;

  if (data["soal"]) {
    console.log(`⏳ Memigrasi Butir Soal (soal: ${data["soal"].length} data)...`);
    for (const s of data["soal"]) {
      const idMapelOld = s.id_mapel;
      const bankId = bankIdMap.get(idMapelOld);

      // Jika bank soal belum ada, lewati atau masukkan ke bank default
      if (!bankId) continue;

      const content = s.soal ? String(s.soal).trim() : "<p>Soal tanpa teks</p>";
      const isEssay = Number(s.jenis) === 2 || (!s.pilA && !s.pilB);
      const correctAnswer = s.jawaban ? String(s.jawaban).trim().toUpperCase() : "";

      const question = await prisma.question.create({
        data: {
          bankId,
          type: isEssay ? "ESSAY" : "MULTIPLE_CHOICE",
          content,
          weight: 1.0,
          orderIndex: Number(s.nomor) || 0,
          mediaUrl: s.file || s.file1 || null,
          mediaType: (s.file || s.file1) ? "IMAGE" : "NONE",
        },
      });
      totalQuestions++;

      if (!isEssay) {
        // Ambil pilihan A, B, C, D, E jika ada isinya
        const choices = [
          { label: "A", content: s.pilA, media: s.fileA },
          { label: "B", content: s.pilB, media: s.fileB },
          { label: "C", content: s.pilC, media: s.fileC },
          { label: "D", content: s.pilD, media: s.fileD },
          { label: "E", content: s.pilE, media: s.fileE },
        ];

        let optOrder = 1;
        for (const choice of choices) {
          if (choice.content && String(choice.content).trim() !== "") {
            await prisma.questionOption.create({
              data: {
                questionId: question.id,
                label: choice.label,
                content: String(choice.content).trim(),
                mediaUrl: choice.media || null,
                isCorrect: choice.label === correctAnswer,
                orderIndex: optOrder++,
              },
            });
            totalOptions++;
          }
        }
      }
    }
    console.log(`   ✅ Berhasil mengimpor ${totalQuestions} soal dan ${totalOptions} opsi jawaban.`);
  }

  console.log(`\n======================================================`);
  console.log(`🎉 MIGRASI CANDY CBT SELESAI DENGAN SUKSES!`);
  console.log(`   - Pengaturan Sekolah   : Berhasil`);
  console.log(`   - Akun Pengawas/Guru   : ${totalStaff}`);
  console.log(`   - Kelas Terdaftar      : ${totalClass}`);
  console.log(`   - Siswa Terdaftar      : ${totalStudents}`);
  console.log(`   - Mata Pelajaran       : ${totalSubjects}`);
  console.log(`   - Bank Soal            : ${totalBanks}`);
  console.log(`   - Butir Soal & Pilihan : ${totalQuestions} Soal (${totalOptions} Opsi)`);
  console.log(`======================================================\n`);
}

// Eksekusi argumen dari command line
const targetSqlFile =
  process.argv[2] ||
  path.resolve(process.cwd(), "../Candy-CBT-2.9.4-R2/config/candy294.sql");

migrateCandyCbt(targetSqlFile)
  .catch((err) => {
    console.error("❌ Terjadi kegagalan saat migrasi:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
