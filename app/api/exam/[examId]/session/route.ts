import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentStudent } from "@/lib/auth-helper";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await context.params;
    const student = await getCurrentStudent();
    if (!student) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        bank: {
          include: {
            subject: true,
            questions: {
              include: {
                options: {
                  orderBy: { orderIndex: "asc" },
                  select: {
                    id: true,
                    label: true,
                    content: true,
                    mediaUrl: true,
                    // Note: isCorrect is deliberately EXCLUDED so student cannot inspect it from DevTools!
                  },
                },
              },
            },
          },
        },
        sessions: {
          where: { studentId: student.id },
          include: {
            answers: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
    }

    const session = exam.sessions[0] || null;

    // Hitung sisa waktu jika ujian sedang berjalan
    let remainingSeconds = exam.durationMinutes * 60;
    if (session && session.startedAt) {
      const elapsedSeconds = Math.floor(
        (Date.now() - new Date(session.startedAt).getTime()) / 1000
      );
      remainingSeconds = Math.max(0, exam.durationMinutes * 60 - elapsedSeconds);
    }

    // Urutkan soal sesuai urutan yang diacak untuk sesi siswa ini (atau orderIndex default)
    let questions = exam.bank.questions;
    if (session && session.assignedQuestionOrder && Array.isArray(session.assignedQuestionOrder)) {
      const orderMap = new Map(
        (session.assignedQuestionOrder as string[]).map((id, index) => [id, index])
      );
      questions = [...questions].sort((a, b) => {
        const orderA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999;
        const orderB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999;
        return orderA - orderB;
      });
    }

    // Map jawaban siswa yang sudah tersimpan
    const answersMap: Record<
      string,
      { selectedOptionIds: string[]; essayAnswer: string; isDoubtful: boolean }
    > = {};

    if (session?.answers) {
      for (const ans of session.answers) {
        answersMap[ans.questionId] = {
          selectedOptionIds: (ans.selectedOptionIds as string[]) || [],
          essayAnswer: ans.essayAnswer || "",
          isDoubtful: ans.isDoubtful,
        };
      }
    }

    return NextResponse.json({
      exam: {
        id: exam.id,
        title: exam.title,
        subject: exam.bank.subject.name,
        durationMinutes: exam.durationMinutes,
        passingGrade: exam.passingGrade,
        showResultImmediate: exam.showResultImmediate,
        totalQuestions: questions.length,
      },
      session: session
        ? {
            id: session.id,
            status: session.status,
            startedAt: session.startedAt,
            submittedAt: session.submittedAt,
            violationsCount: session.violationsCount,
            finalScore: session.finalScore,
            isGraded: session.isGraded,
          }
        : null,
      serverTime: new Date().toISOString(),
      remainingSeconds,
      questions: questions.map((q: any, idx: number) => ({
        id: q.id,
        number: idx + 1,
        type: q.type,
        content: q.content,
        mediaUrl: q.mediaUrl,
        mediaType: q.mediaType,
        weight: q.weight,
        options: q.options,
      })),
      savedAnswers: answersMap,
      student: {
        id: student.id,
        name: student.name,
        username: student.username,
        class: student.class?.name || "Umum",
      },
    });
  } catch (error: any) {
    console.error("Error fetching exam session:", error);
    return NextResponse.json({ error: "Gagal memuat sesi ujian" }, { status: 500 });
  }
}
