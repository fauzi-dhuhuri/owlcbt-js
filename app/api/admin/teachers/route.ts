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

    const teachers = await prisma.user.findMany({
      where: {
        role: { in: ["TEACHER", "PROCTOR", "ADMIN"] },
      },
      include: {
        _count: {
          select: { questionBanks: true },
        },
      },
      orderBy: { role: "asc" },
    });

    const formatted = teachers.map((t: any) => ({
      id: t.id,
      username: t.username,
      name: t.name,
      role: t.role,
      phone: t.phone,
      email: t.email,
      gender: t.gender,
      isActive: t.isActive,
      totalQuestionBanks: t._count.questionBanks,
      createdAt: t.createdAt,
    }));

    return NextResponse.json({ teachers: formatted });
  } catch (error: any) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json({ error: "Gagal memuat data guru & staf" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Akses ditolak: Menu Master Data hanya dapat diakses oleh Administrator." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, name, password, role, phone, email, gender } = body;

    if (!username || !name) {
      return NextResponse.json(
        { error: "Username/NIP dan Nama Lengkap wajib diisi." },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim();
    const rawPassword = password ? String(password).trim() : "guru123";
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    const validRole = ["TEACHER", "PROCTOR", "ADMIN"].includes(role) ? role : "TEACHER";

    const newTeacher = await prisma.user.create({
      data: {
        username: cleanUsername,
        passwordHash,
        name: name.trim(),
        role: validRole,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        gender: gender || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Akun pengajar/staf berhasil ditambahkan!",
      teacher: newTeacher,
    });
  } catch (error: any) {
    console.error("Error creating teacher:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Username/NIP tersebut sudah digunakan akun lain." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Gagal menambahkan guru/staf" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Akses ditolak: Menu Master Data hanya dapat diakses oleh Administrator." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, role, phone, email, gender, password, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "ID pengajar diperlukan" }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (role && ["TEACHER", "PROCTOR", "ADMIN"].includes(role)) updateData.role = role;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (gender !== undefined) updateData.gender = gender || null;
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
      message: "Data pengajar/staf berhasil diperbarui!",
      teacher: updated,
    });
  } catch (error: any) {
    console.error("Error updating teacher:", error);
    return NextResponse.json({ error: "Gagal memperbarui data pengajar" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Akses ditolak: Menu Master Data hanya dapat diakses oleh Administrator." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID pengajar diperlukan" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Akun pengajar berhasil dihapus.",
    });
  } catch (error: any) {
    console.error("Error deleting teacher:", error);
    return NextResponse.json({ error: "Gagal menghapus pengajar" }, { status: 500 });
  }
}

