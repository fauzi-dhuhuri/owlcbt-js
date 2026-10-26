import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth-helper";

// Normalisasi baris data guru & staf
function normalizeTeacherRow(raw: Record<string, any>) {
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

  const username = getVal(["nip", "nuptk", "username", "id", "kode"]);
  const name = getVal(["nama", "namaguru", "namalengkap", "nama_guru", "name"]);
  const roleRaw = getVal(["role", "jabatan", "level", "posisi"]);
  const genderRaw = getVal(["jeniskelamin", "jk", "lp", "gender"]);
  const password = getVal(["password", "katasandi", "pass"]);
  const phone = getVal(["nohp", "telepon", "whatsapp", "wa", "hp"]);
  const email = getVal(["email", "surel"]);

  // Role detection
  let role: "TEACHER" | "PROCTOR" | "ADMIN" = "TEACHER";
  if (roleRaw) {
    const r = String(roleRaw).trim().toUpperCase();
    if (r.includes("ADMIN")) role = "ADMIN";
    else if (r.includes("PROKTOR") || r.includes("PROCTOR") || r.includes("PENGAWAS")) role = "PROCTOR";
    else role = "TEACHER";
  }

  // Gender detection
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
    role,
    gender,
    password: password ? String(password).trim() : "guru123",
    phone: phone ? String(phone).trim() : "",
    email: email ? String(email).trim() : "",
  };
}

// 1. GET: Download Template Format Excel Guru & Staf
export async function GET(req: NextRequest) {
  try {
    const templateData = [
      {
        "NIP / Username": "198501012010011001",
        "Nama Lengkap": "Drs. Budi Santoso, M.Pd",
        "Role (TEACHER / PROCTOR / ADMIN)": "TEACHER",
        "Jenis Kelamin (L/P)": "L",
        Password: "guru123",
        "No HP / WhatsApp": "081234567800",
        Email: "budi.santoso@sekolah.sch.id",
      },
      {
        "NIP / Username": "198802022012022002",
        "Nama Lengkap": "Siti Rahmawati, S.Pd",
        "Role (TEACHER / PROCTOR / ADMIN)": "PROCTOR",
        "Jenis Kelamin (L/P)": "P",
        Password: "guru123",
        "No HP / WhatsApp": "081234567801",
        Email: "siti.rahmawati@sekolah.sch.id",
      },
      {
        "NIP / Username": "admin_cbt",
        "Nama Lengkap": "Tim Administrator IT",
        "Role (TEACHER / PROCTOR / ADMIN)": "ADMIN",
        "Jenis Kelamin (L/P)": "L",
        Password: "admin123",
        "No HP / WhatsApp": "081234567802",
        Email: "admin@sekolah.sch.id",
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    ws["!cols"] = [
      { wch: 22 }, // NIP
      { wch: 28 }, // Nama
      { wch: 30 }, // Role
      { wch: 18 }, // Gender
      { wch: 15 }, // Password
      { wch: 18 }, // HP
      { wch: 28 }, // Email
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Template_Guru_Staf");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="template_import_guru_staf_owlcbt.xlsx"',
      },
    });
  } catch (error: any) {
    console.error("Error generating teacher template:", error);
    return NextResponse.json({ error: "Gagal membuat template guru" }, { status: 500 });
  }
}

// 2. POST: Upload & Import Data Guru & Staf
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
        { error: "Tidak ada data baris yang ditemukan pada spreadsheet" },
        { status: 400 }
      );
    }

    const defaultPasswordHash = await bcrypt.hash("guru123", 10);
    let createdCount = 0;
    let updatedCount = 0;
    const errors: { row: number; username: string; error: string }[] = [];

    for (let index = 0; index < rows.length; index++) {
      const rowNum = index + 2;
      const parsed = normalizeTeacherRow(rows[index]);

      if (!parsed.username) {
        errors.push({ row: rowNum, username: "-", error: "NIP/Username kosong" });
        continue;
      }

      if (!parsed.name) {
        errors.push({ row: rowNum, username: parsed.username, error: "Nama lengkap kosong" });
        continue;
      }

      try {
        const existing = await prisma.user.findFirst({
          where: {
            username: parsed.username,
            role: { in: ["TEACHER", "PROCTOR", "ADMIN"] },
          },
        });

        const customHash =
          parsed.password && parsed.password !== "guru123"
            ? await bcrypt.hash(parsed.password, 10)
            : defaultPasswordHash;

        if (existing) {
          await prisma.user.update({
            where: { id: existing.id },
            data: {
              name: parsed.name,
              role: parsed.role,
              gender: parsed.gender,
              phone: parsed.phone || existing.phone,
              email: parsed.email || existing.email,
              ...(parsed.password && parsed.password !== "guru123" ? { passwordHash: customHash } : {}),
            },
          });
          updatedCount++;
        } else {
          await prisma.user.create({
            data: {
              username: parsed.username,
              name: parsed.name,
              role: parsed.role,
              gender: parsed.gender,
              passwordHash: customHash,
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
      message: `Import selesai: ${createdCount} guru/staf baru ditambahkan, ${updatedCount} data diperbarui.`,
      total: rows.length,
      created: createdCount,
      updated: updatedCount,
      failed: errors.length,
      errors,
    });
  } catch (error: any) {
    console.error("Error importing teachers:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan saat memproses file import" },
      { status: 500 }
    );
  }
}
