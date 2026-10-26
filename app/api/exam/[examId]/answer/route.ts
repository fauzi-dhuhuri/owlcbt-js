import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentStudent } from "@/lib/auth-helper";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await context.params;
    const student = await getCurrentStudent();
    if (!student) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
    }

    const body = await request.json();
    const { questionId, selectedOptionIds, essayAnswer, isDoubtful } = body;

    if (!questionId) {
      return NextResponse.json({ error: "questionId diperlukan" }, { status: 400 });
    }

    // Pastikan sesi siswa aktif
    const session = await prisma.examSession.findUnique({
      where: {
        examId_studentId: {
          examId,
          studentId: student.id,
        },
      },
    });

    if (!session || session.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Sesi ujian tidak aktif atau sudah selesai diserahkan" },
        { status: 403 }
      );
    }

    // Upsert jawaban siswa
    const answer = await prisma.studentAnswer.upsert({
      where: {
        sessionId_questionId: {
          sessionId: session.id,
          questionId,
        },
      },
      update: {
        selectedOptionIds: selectedOptionIds || [],
        essayAnswer: essayAnswer !== undefined ? essayAnswer : null,
        isDoubtful: Boolean(isDoubtful),
        updatedAt: new Date(),
      },
      create: {
        sessionId: session.id,
        questionId,
        selectedOptionIds: selectedOptionIds || [],
        essayAnswer: essayAnswer !== undefined ? essayAnswer : null,
        isDoubtful: Boolean(isDoubtful),
      },
    });

    return NextResponse.json({
      success: true,
      savedAt: answer.updatedAt,
    });
  } catch (error: any) {
    console.error("Error saving student answer:", error);
    return NextResponse.json({ error: "Gagal menyimpan jawaban" }, { status: 500 });
  }
}
