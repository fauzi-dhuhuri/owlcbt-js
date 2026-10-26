import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Endpoint Monitoring Status Peserta Ujian Realtime.
 *
 * Mengumpulkan data seluruh siswa terdaftar pada kelas yang diujikan beserta:
 * - Status sesi (NOT_STARTED, IN_PROGRESS, SUBMITTED)
 * - Progres jumlah soal yang telah dijawab
 * - Sisa waktu pengerjaan aktual siswa
 * - Log dan jumlah pelanggaran anti-cheat (violationsCount)
 * - Statistik agregat ruangan (total siswa, aktif, selesai, belum mulai)
 */
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
            _count: { select: { questions: true } },
          },
        },
        classes: {
          include: {
            students: {
              where: { role: "STUDENT", isActive: true },
              select: {
                id: true,
                name: true,
                username: true,
                classId: true,
                class: { select: { name: true } },
              },
            },
          },
        },
        sessions: {
          include: {
            answers: {
              select: {
                questionId: true,
                selectedOptionIds: true,
                essayAnswer: true,
                isDoubtful: true,
              },
            },
            violationLogs: {
              orderBy: { timestamp: "desc" },
              take: 5,
            },
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
    }

    const totalQuestions = exam.bank._count.questions;
    const now = Date.now();

    // Map all assigned students
    const studentMap = new Map<string, any>();
    for (const cls of exam.classes) {
      for (const st of cls.students) {
        studentMap.set(st.id, {
          id: st.id,
          name: st.name,
          username: st.username,
          className: st.class?.name || "Umum",
          session: null,
        });
      }
    }

    // Attach sessions to students
    const sessionMap = new Map(exam.sessions.map((s: any) => [s.studentId, s]));

    // Hitung statistik
    let notStartedCount = 0;
    let inProgressCount = 0;
    let submittedCount = 0;
    let totalViolations = 0;

    const studentList = Array.from(studentMap.values()).map((st) => {
      const sess = sessionMap.get(st.id);
      if (!sess) {
        notStartedCount++;
        return {
          ...st,
          status: "NOT_STARTED",
          answeredCount: 0,
          doubtfulCount: 0,
          violationsCount: 0,
          finalScore: null,
          remainingSeconds: exam.durationMinutes * 60,
          startedAt: null,
          submittedAt: null,
          violationLogs: [],
        };
      }

      const answeredCount = sess.answers.filter(
        (a: any) =>
          (a.selectedOptionIds && a.selectedOptionIds.length > 0) ||
          (a.essayAnswer && a.essayAnswer.trim() !== "")
      ).length;

      const doubtfulCount = sess.answers.filter((a: any) => a.isDoubtful).length;

      let remainingSeconds = exam.durationMinutes * 60;
      if (sess.startedAt) {
        const elapsed = Math.floor((now - new Date(sess.startedAt).getTime()) / 1000);
        remainingSeconds = Math.max(0, exam.durationMinutes * 60 - elapsed);
      }

      if (sess.status === "SUBMITTED") {
        submittedCount++;
      } else if (sess.status === "IN_PROGRESS") {
        inProgressCount++;
      } else {
        notStartedCount++;
      }

      totalViolations += sess.violationsCount || 0;

      return {
        ...st,
        sessionId: sess.id,
        status: sess.status,
        answeredCount,
        doubtfulCount,
        violationsCount: sess.violationsCount || 0,
        finalScore: sess.finalScore,
        remainingSeconds,
        startedAt: sess.startedAt,
        submittedAt: sess.submittedAt,
        violationLogs: sess.violationLogs,
      };
    });

    return NextResponse.json({
      exam: {
        id: exam.id,
        title: exam.title,
        subject: exam.bank.subject.name,
        token: exam.token,
        durationMinutes: exam.durationMinutes,
        totalQuestions,
        status: exam.status,
      },
      stats: {
        totalStudents: studentList.length,
        notStartedCount,
        inProgressCount,
        submittedCount,
        totalViolations,
      },
      students: studentList,
      serverTime: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error monitoring proctor exam:", error);
    return NextResponse.json({ error: "Gagal memuat monitoring ujian" }, { status: 500 });
  }
}
