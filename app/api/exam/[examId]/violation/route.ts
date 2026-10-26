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
    const { action, message } = body;

    const session = await prisma.examSession.findUnique({
      where: {
        examId_studentId: {
          examId,
          studentId: student.id,
        },
      },
    });

    if (!session || session.status !== "IN_PROGRESS") {
      return NextResponse.json({ success: false });
    }

    await prisma.$transaction([
      prisma.examViolationLog.create({
        data: {
          sessionId: session.id,
          action: action || "TAB_SWITCH",
          message: message || "Terdeteksi meninggalkan layar ujian",
        },
      }),
      prisma.examSession.update({
        where: { id: session.id },
        data: { violationsCount: { increment: 1 } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      currentViolations: session.violationsCount + 1,
    });
  } catch (error: any) {
    console.error("Error logging exam violation:", error);
    return NextResponse.json({ error: "Gagal mencatat log" }, { status: 500 });
  }
}
