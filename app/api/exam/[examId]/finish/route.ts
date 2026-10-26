import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentStudent } from "@/lib/auth-helper";

/**
 * Endpoint Penyerahan Ujian Siswa (Finish & Auto-Grading).
 *
 * Mengunci sesi pengerjaan menjadi 'SUBMITTED', mencatat waktu serah, dan menjalankan
 * algoritma auto-grading untuk butir Pilihan Ganda & Pilihan Ganda Kompleks.
 * Jika terdapat soal Esai, sesi ditandai `isGraded: false` hingga guru melakukan koreksi manual.
 */
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

    const session = await prisma.examSession.findUnique({
      where: {
        examId_studentId: {
          examId,
          studentId: student.id,
        },
      },
      include: {
        exam: {
          include: {
            bank: {
              include: {
                questions: {
                  include: {
                    options: true,
                  },
                },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Sesi ujian tidak ditemukan" }, { status: 404 });
    }

    if (session.status === "SUBMITTED") {
      return NextResponse.json({
        success: true,
        message: "Ujian sudah pernah diserahkan",
        finalScore: session.finalScore,
        submittedAt: session.submittedAt,
      });
    }

    // Auto-grading untuk Pilihan Ganda & Pilihan Ganda Kompleks
    const questions = session.exam.bank.questions;
    const answersMap = new Map(session.answers.map((a: any) => [a.questionId, a]));

    let totalWeight = 0;
    let earnedWeight = 0;
    let hasEssay = false;

    for (const q of questions) {
      totalWeight += q.weight;

      if (q.type === "ESSAY") {
        hasEssay = true;
        continue;
      }

      const answer = answersMap.get(q.id);
      if (!answer) continue;

      const selectedIds = ((answer.selectedOptionIds as string[]) || []).sort();

      if (q.type === "MULTIPLE_CHOICE") {
        const correctOption = q.options.find((opt: any) => opt.isCorrect);
        if (correctOption && selectedIds.includes(correctOption.id)) {
          earnedWeight += q.weight;
          await prisma.studentAnswer.update({
            where: { id: answer.id },
            data: { scoreEarned: q.weight },
          });
        }
      } else if (q.type === "MULTIPLE_RESPONSE") {
        const correctIds = q.options
          .filter((opt: any) => opt.isCorrect)
          .map((opt: any) => opt.id)
          .sort();

        const isExactMatch =
          selectedIds.length === correctIds.length &&
          selectedIds.every((val, index) => val === correctIds[index]);

        if (isExactMatch) {
          earnedWeight += q.weight;
          await prisma.studentAnswer.update({
            where: { id: answer.id },
            data: { scoreEarned: q.weight },
          });
        }
      }
    }

    // Nilai skala 0 - 100
    const calculatedScore = totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 0;
    const finalScore = Number(calculatedScore.toFixed(1));

    const updatedSession = await prisma.examSession.update({
      where: { id: session.id },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        multipleChoiceScore: finalScore,
        finalScore: hasEssay ? null : finalScore,
        isGraded: !hasEssay,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Ujian berhasil diselesaikan dan diserahkan!",
      finalScore: updatedSession.finalScore,
      submittedAt: updatedSession.submittedAt,
      hasEssay,
      showResult: session.exam.showResultImmediate,
    });
  } catch (error: any) {
    console.error("Error submitting exam:", error);
    return NextResponse.json({ error: "Gagal menyelesaikan ujian" }, { status: 500 });
  }
}
