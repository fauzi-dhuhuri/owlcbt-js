import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth-helper";

/**
 * Normalisasi header dan nilai baris spreadsheet agar kompatibel dengan berbagai
 * variasi penamaan kolom Excel/CSV dari berbagai aplikasi sekolah (misal: 'nisn', 'nis', 'no_peserta').
 *
 * @param raw Objek baris mentah dari parser XLSX
 * @returns Data siswa yang telah dinormalisasi dengan nilai fallback yang aman
 */
function normalizeRow(raw: Record<string, any>) {
  const keys = Object.keys(raw);
  const getVal = (possibleKeys: string[]) => {
    for (const key of keys) {
      const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const pk of possibleKeys) {
        if (cleanKey === pk.toLowerCase().replace(/[^a-z0-9]/g, "")) {
          return raw[key];
        }
      }
    }
    return undefined;
  };

  const username = getVal(["nisn", "nis", "username", "nopeserta", "no_peserta", "nomorpeserta"]);
  const name = getVal(["nama", "namasiswa", "namalengkap", "nama_siswa", "name"]);
  const className = getVal(["kelas", "rombel", "idkelas", "id_kelas", "namakelas"]);
  const genderRaw = getVal(["jeniskelamin", "jk", "lp", "gender", "kelamin"]);
  const password = getVal(["password", "katasandi", "pass"]);
  const phone = getVal(["nohp", "telepon", "whatsapp", "wa", "nohpwali", "hp"]);
  const email = getVal(["email", "surel"]);

  // Format jenis kelamin L atau P
  let gender = "L";
  if (genderRaw) {
    const g = String(genderRaw).trim().toUpperCase();
    if (g.startsWith("P") || g === "PEREMPUAN" || g === "W") {
      gender = "P";
    }
  }

  return {
    username: username ? String(username).trim().replace(/['"`]/g, "") : "",
    name: name ? String(name).trim() : "",
    className: className ? String(className).trim() : "UMUM",
    gender,
    password: password ? String(password).trim() : "123456",
    phone: phone ? String(phone).trim() : "",
    email: email ? String(email).trim() : "",
  };
}

/**
 * Endpoint Download File Template Excel Master Siswa.
 *
 * Menghasilkan file .xlsx siap pakai lengkap dengan baris contoh dan lebar kolom yang presisi.
 */
export async function GET(req: NextRequest) {
  try {
    const templateData = [
      {
        NISN: "1001",
        "Nama Siswa": "Ahmad Fauzi",
        Kelas: "XII-MIPA-1",
        "Jenis Kelamin (L/P)": "L",
        Password: "password123",
        "No HP Wali": "081234567890",
        Email: "ahmad.fauzi@sekolah.sch.id",
      },
      {
        NISN: "1002",
        "Nama Siswa": "Siti Nurhaliza",
        Kelas: "XII-MIPA-1",
        "Jenis Kelamin (L/P)": "P",
        Password: "password123",
        "No HP Wali": "081234567891",
        Email: "siti.nur@sekolah.sch.id",
      },
      {
        NISN: "1003",
        "Nama Siswa": "Budi Pratama",
        Kelas: "XII-IPS-1",
        "Jenis Kelamin (L/P)": "L",
        Password: "password123",
        "No HP Wali": "081234567892",
        Email: "budi.p@sekolah.sch.id",
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Styling kolom lebar
    ws["!cols"] = [
      { wch: 15 }, // NISN
      { wch: 25 }, // Nama Siswa
      { wch: 15 }, // Kelas
      { wch: 18 }, // Jenis Kelamin
      { wch: 15 }, // Password
      { wch: 18 }, // No HP
      { wch: 25 }, // Email
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Template_Siswa");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="template_import_siswa_owlcbt.xlsx"',
      },
    });
  } catch (error: any) {
    console.error("Error generating student template:", error);
    return NextResponse.json({ error: "Gagal membuat template siswa" }, { status: 500 });
  }
}

/**
 * Endpoint Impor Data Siswa dari File Excel (.xlsx, .xls) atau CSV.
 *
 * Menerima file multipart/form-data, membaca tabel data siswa, membuat kelas baru
 * secara otomatis jika belum ada, dan melakukan upsert (buat siswa baru atau update data
 * siswa yang sudah ada tanpa menghapus riwayat sesi ujian).
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Akses ditolak: Import Master Data hanya dapat dilakukan oleh Administrator." },
        { status: 403 }
      );
    }

    let rows: any[] = [];
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "File Excel/CSV tidak ditemukan" }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    } else {
      const body = await req.json();
      rows = body.rows || [];
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada baris data yang ditemukan pada file spreadsheet" },
        { status: 400 }
      );
    }

    // 1. Ambil atau siapkan peta kelas yang sudah ada di DB
    const existingClasses = await prisma.class.findMany();
    const classMap = new Map<string, string>(); // lowercase name -> id
    existingClasses.forEach((c) => classMap.set(c.name.trim().toLowerCase(), c.id));

    // Cache hash password default
    const defaultPasswordHash = await bcrypt.hash("123456", 10);

    let createdCount = 0;
    let updatedCount = 0;
    const errors: { row: number; username: string; error: string }[] = [];

    // Loop proses per baris
    for (let index = 0; index < rows.length; index++) {
      const rowNum = index + 2; // Baris Excel (asumsi baris 1 header)
      const parsed = normalizeRow(rows[index]);

      if (!parsed.username) {
        errors.push({ row: rowNum, username: "-", error: "NISN/Username kosong" });
        continue;
      }

      if (!parsed.name) {
        errors.push({ row: rowNum, username: parsed.username, error: "Nama siswa kosong" });
        continue;
      }

      try {
        // Tentukan ID kelas (auto create jika kelas belum ada)
        let classId: string | undefined = undefined;
        if (parsed.className) {
          const lowerClass = parsed.className.trim().toLowerCase();
          if (classMap.has(lowerClass)) {
            classId = classMap.get(lowerClass);
          } else {
            // Deteksi level otomatis (misal: "XII-MIPA-1" -> "XII")
            let level = "XII";
            if (/^x\b/i.test(parsed.className)) level = "X";
            else if (/^xi\b/i.test(parsed.className)) level = "XI";
            else if (/^xii\b/i.test(parsed.className)) level = "XII";

            const newClass = await prisma.class.create({
              data: {
                name: parsed.className.trim().toUpperCase(),
                level,
              },
            });
            classMap.set(lowerClass, newClass.id);
            classId = newClass.id;
          }
        }

        // Cek apakah siswa sudah ada di database
        const existingStudent = await prisma.user.findFirst({
          where: {
            username: parsed.username,
            role: "STUDENT",
          },
        });

        const customHash =
          parsed.password && parsed.password !== "123456"
            ? await bcrypt.hash(parsed.password, 10)
            : defaultPasswordHash;

        if (existingStudent) {
          // Update data siswa yang sudah ada tanpa menghapus history sesi ujian
          await prisma.user.update({
            where: { id: existingStudent.id },
            data: {
              name: parsed.name,
              gender: parsed.gender,
              classId: classId || existingStudent.classId,
              phone: parsed.phone || existingStudent.phone,
              email: parsed.email || existingStudent.email,
              ...(parsed.password && parsed.password !== "123456" ? { passwordHash: customHash } : {}),
            },
          });
          updatedCount++;
        } else {
          // Buat siswa baru
          await prisma.user.create({
            data: {
              username: parsed.username,
              name: parsed.name,
              passwordHash: customHash,
              role: "STUDENT",
              gender: parsed.gender,
              classId,
              phone: parsed.phone || null,
              email: parsed.email || null,
              isActive: true,
            },
          });
          createdCount++;
        }
      } catch (err: any) {
        errors.push({
          row: rowNum,
          username: parsed.username,
          error: err.message || "Gagal menyimpan ke database",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import selesai: ${createdCount} siswa baru ditambahkan, ${updatedCount} siswa diperbarui.`,
      total: rows.length,
      created: createdCount,
      updated: updatedCount,
      failed: errors.length,
      errors,
    });
  } catch (error: any) {
    console.error("Error importing students:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan saat memproses file import" },
      { status: 500 }
    );
  }
}
