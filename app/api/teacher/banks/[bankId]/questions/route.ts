import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ bankId: string }> }
) {
  try {
    const { bankId } = await context.params;

    const bank = await prisma.questionBank.findUnique({
      where: { id: bankId },
      include: {
        subject: true,
        questions: {
          include: {
            options: {
              orderBy: { orderIndex: "asc" },
            },
          },
          orderBy: { orderIndex: "asc" },
        },
      },
    });

    if (!bank) {
      return NextResponse.json({ error: "Bank soal tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ bank });
  } catch (error: any) {
    console.error("Error fetching bank questions:", error);
    return NextResponse.json({ error: "Gagal memuat butir soal" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ bankId: string }> }
) {
  try {
    const { bankId } = await context.params;
    const body = await request.json();
    const { type, content, weight, mediaUrl, options } = body;

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Konten soal tidak boleh kosong" }, { status: 400 });
    }

    const questionType = type || "MULTIPLE_CHOICE";
    const parsedWeight = Number(weight) > 0 ? Number(weight) : 1.0;

    // Hitung orderIndex berikutnya
    const lastQuestion = await prisma.question.findFirst({
      where: { bankId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });
    const nextOrder = (lastQuestion?.orderIndex || 0) + 1;

    // Buat pertanyaan beserta opsi (jika bukan ESSAY)
    const question = await prisma.question.create({
      data: {
        bankId,
        type: questionType,
        content: content.trim(),
        weight: parsedWeight,
        orderIndex: nextOrder,
        mediaUrl: mediaUrl || null,
        mediaType: mediaUrl ? "IMAGE" : "NONE",
        options:
          questionType !== "ESSAY" && Array.isArray(options) && options.length > 0
            ? {
                create: options.map((opt: any, idx: number) => ({
                  label: opt.label || String.fromCharCode(65 + idx), // A, B, C...
                  content: opt.content.trim(),
                  mediaUrl: opt.mediaUrl || null,
                  isCorrect: Boolean(opt.isCorrect),
                  orderIndex: idx + 1,
                })),
              }
            : undefined,
      },
      include: {
        options: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Butir soal berhasil ditambahkan",
      question,
    });
  } catch (error: any) {
    console.error("Error creating question:", error);
    return NextResponse.json({ error: "Gagal membuat butir soal" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ bankId: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      return NextResponse.json({ error: "questionId diperlukan" }, { status: 400 });
    }

    await prisma.question.delete({
      where: { id: questionId },
    });

    return NextResponse.json({
      success: true,
      message: "Butir soal berhasil dihapus",
    });
  } catch (error: any) {
    console.error("Error deleting question:", error);
    return NextResponse.json({ error: "Gagal menghapus butir soal" }, { status: 500 });
  }
}
