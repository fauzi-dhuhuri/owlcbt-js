import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const [banks, subjects] = await Promise.all([
      prisma.questionBank.findMany({
        include: {
          subject: true,
          createdBy: { select: { name: true, username: true } },
          _count: {
            select: { questions: true, exams: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.subject.findMany({
        orderBy: { name: "asc" },
      }),
    ]);

    const formatted = banks.map((b: any) => ({
      id: b.id,
      code: b.code,
      title: b.title,
      description: b.description,
      subjectId: b.subjectId,
      subjectName: b.subject.name,
      subjectCode: b.subject.code,
      author: b.createdBy.name,
      totalQuestions: b._count.questions,
      totalExams: b._count.exams,
      updatedAt: b.updatedAt,
    }));

    return NextResponse.json({ banks: formatted, subjects });
  } catch (error: any) {
    console.error("Error fetching question banks:", error);
    return NextResponse.json({ error: "Gagal memuat bank soal" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, title, subjectId, description } = body;

    if (!code || !title || !subjectId) {
      return NextResponse.json(
        { error: "Kode, Judul, dan Mata Pelajaran wajib diisi" },
        { status: 400 }
      );
    }

    // Ambil default teacher/admin pembuat
    const author = await prisma.user.findFirst({
      where: { role: { in: ["TEACHER", "ADMIN"] } },
    });

    if (!author) {
      return NextResponse.json({ error: "Akun pengajar tidak ditemukan" }, { status: 404 });
    }

    const bank = await prisma.questionBank.create({
      data: {
        code: code.trim().toUpperCase(),
        title: title.trim(),
        subjectId,
        description: description?.trim() || null,
        createdById: author.id,
      },
      include: {
        subject: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Bank soal berhasil dibuat",
      bank,
    });
  } catch (error: any) {
    console.error("Error creating question bank:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Kode bank soal sudah pernah digunakan." }, { status: 400 });
    }
    return NextResponse.json({ error: "Gagal membuat bank soal" }, { status: 500 });
  }
}
