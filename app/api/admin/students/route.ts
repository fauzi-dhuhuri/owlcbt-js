import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth-helper";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Akses ditolak: Menu Master Data hanya dapat diakses oleh Administrator." },
        { status: 403 }
      );
    }
    const [students, classes] = await Promise.all([
      prisma.user.findMany({
        where: { role: "STUDENT" },
        include: {
          class: true,
          _count: { select: { examSessions: true } },
        },
        orderBy: { name: "asc" },
      }),
      prisma.class.findMany({
        orderBy: { name: "asc" },
      }),
    ]);

    const formatted = students.map((s: any) => ({
      id: s.id,
      username: s.username, // NISN
      name: s.name,
      classId: s.classId,
      className: s.class?.name || "Belum Ditentukan",
      gender: s.gender,
      phone: s.phone,
      email: s.email,
      isActive: s.isActive,
      totalExamsTaken: s._count.examSessions,
      createdAt: s.createdAt,
    }));

    return NextResponse.json({ students: formatted, classes });
  } catch (error: any) {
    console.error("Error fetching students:", error);
    return NextResponse.json({ error: "Gagal memuat data siswa" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Akses ditolak: Master Data hanya dapat diakses oleh Administrator." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, name, password, classId, gender, phone, email } = body;

    if (!username || !name) {
      return NextResponse.json(
        { error: "NISN/Username dan Nama Siswa wajib diisi." },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim();
    const rawPassword = password ? String(password).trim() : "123456";
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    const newStudent = await prisma.user.create({
      data: {
        username: cleanUsername,
        passwordHash,
        name: name.trim(),
        role: "STUDENT",
        classId: classId || null,
        gender: gender || null,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
      },
      include: { class: true },
    });

    return NextResponse.json({
      success: true,
      message: "Siswa berhasil ditambahkan!",
      student: newStudent,
    });
  } catch (error: any) {
    console.error("Error creating student:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "NISN/Username tersebut sudah terdaftar di sistem." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Gagal menambahkan siswa" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Akses ditolak: Master Data hanya dapat diakses oleh Administrator." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, classId, gender, phone, email, password, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "ID siswa diperlukan" }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (classId !== undefined) updateData.classId = classId || null;
    if (gender !== undefined) updateData.gender = gender || null;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    if (password && String(password).trim().length > 0) {
      updateData.passwordHash = await bcrypt.hash(String(password).trim(), 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "Data siswa berhasil diperbarui!",
      student: updated,
    });
  } catch (error: any) {
    console.error("Error updating student:", error);
    return NextResponse.json({ error: "Gagal memperbarui data siswa" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Akses ditolak: Master Data hanya dapat diakses oleh Administrator." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID siswa diperlukan" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Siswa berhasil dihapus dari sistem.",
    });
  } catch (error: any) {
    console.error("Error deleting student:", error);
    return NextResponse.json({ error: "Gagal menghapus siswa" }, { status: 500 });
  }
}
