import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const classes = await prisma.class.findMany({
      include: {
        _count: { select: { students: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ classes });
  } catch (error: any) {
    console.error("Error fetching classes:", error);
    return NextResponse.json({ error: "Gagal memuat daftar kelas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, level, major } = body;

    if (!name) {
      return NextResponse.json({ error: "Nama kelas wajib diisi" }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanLevel = (level || "X").trim();

    const newClass = await prisma.class.create({
      data: {
        name: cleanName,
        level: cleanLevel,
        major: major?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Kelas berhasil ditambahkan",
      class: newClass,
    });
  } catch (error: any) {
    console.error("Error creating class:", error);
    return NextResponse.json({ error: "Gagal menambahkan kelas" }, { status: 500 });
  }
}
