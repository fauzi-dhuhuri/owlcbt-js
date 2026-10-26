import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await context.params;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        bank: {
          include: {
            subject: true,
            questions: {
              where: { type: "ESSAY" },
              select: {
                id: true,
                orderIndex: true,
                content: true,
                weight: true,
              },
            },
          },
        },
        sessions: {
          where: { status: "SUBMITTED" },
          include: {
            student: {
              select: { id: true, name: true, username: true, class: { select: { name: true } } },
            },
            answers: {
              include: {
                question: {
                  select: { id: true, type: true, content: true, weight: true },
                },
              },
            },
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
    }

    const essayQuestions = exam.bank.questions;

    // Kumpulkan seluruh jawaban esai dari siswa yang sudah submit
    const essaySubmissions: any[] = [];

    for (const session of exam.sessions) {
      for (const ans of session.answers) {
        if (ans.question.type === "ESSAY") {
          essaySubmissions.push({
            id: ans.id,
            sessionId: session.id,
            studentId: session.student.id,
            studentName: session.student.name,
            studentNisn: session.student.username,
            studentClass: session.student.class?.name || "Umum",
            questionId: ans.question.id,
            questionContent: ans.question.content,
            maxWeight: ans.question.weight,
            essayAnswer: ans.essayAnswer || "(Tidak ada jawaban tertulis)",
            scoreEarned: ans.scoreEarned ?? 0,
            submittedAt: session.submittedAt,
          });
        }
      }
    }

    return NextResponse.json({
      exam: {
        id: exam.id,
        title: exam.title,
        subject: exam.bank.subject.name,
      },
      essayQuestionsCount: essayQuestions.length,
      submissions: essaySubmissions,
    });
  } catch (error: any) {
    console.error("Error fetching grading items:", error);
    return NextResponse.json({ error: "Gagal memuat daftar koreksi esai" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await context.params;
    const body = await request.json();
    const { studentAnswerId, scoreEarned } = body;

    if (!studentAnswerId || scoreEarned === undefined) {
      return NextResponse.json({ error: "studentAnswerId dan scoreEarned wajib diisi" }, { status: 400 });
    }

    const numScore = Math.max(0, Number(scoreEarned));

    // Update nilai butir esai
    const updatedAnswer = await prisma.studentAnswer.update({
      where: { id: studentAnswerId },
      data: { scoreEarned: numScore },
      include: {
        session: {
          include: {
            exam: {
              include: {
                bank: {
                  include: {
                    questions: true,
                  },
                },
              },
            },
            answers: true,
          },
        },
      },
    });

    const session = updatedAnswer.session;
    const allQuestions = session.exam.bank.questions;
    const totalMaxWeight = allQuestions.reduce((sum, q) => sum + q.weight, 0);

    // Hitung total skor yang diperoleh
    const totalEarnedWeight = session.answers.reduce(
      (sum, a) => sum + (a.scoreEarned || 0),
      0
    );

    const finalCalculated =
      totalMaxWeight > 0 ? (totalEarnedWeight / totalMaxWeight) * 100 : 0;
    const roundedFinal = Number(finalCalculated.toFixed(1));

    // Update total nilai akhir sesi
    await prisma.examSession.update({
      where: { id: session.id },
      data: {
        finalScore: roundedFinal,
        isGraded: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Nilai esai berhasil disimpan",
      updatedScore: numScore,
      newFinalScore: roundedFinal,
    });
  } catch (error: any) {
    console.error("Error saving essay grade:", error);
    return NextResponse.json({ error: "Gagal menyimpan nilai esai" }, { status: 500 });
  }
}
