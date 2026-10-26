import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentStudent } from "@/lib/auth-helper";

export async function GET() {
  try {
    const student = await getCurrentStudent();
    if (!student) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
    }

    // Filter kelas siswa: ujian terbuka untuk semua kelas atau sesuai kelas siswa
    const classFilter = student.classId
      ? {
          OR: [
            { classes: { none: {} } },
            { classes: { some: { id: student.classId } } },
          ],
        }
      : {};

    const exams = await prisma.exam.findMany({
      where: {
        status: { in: ["ACTIVE", "SCHEDULED"] },
        ...classFilter,
      },
      include: {
        bank: {
          include: {
            subject: true,
            _count: { select: { questions: true } },
          },
        },
        sessions: {
          where: { studentId: student.id },
          select: {
            id: true,
            status: true,
            startedAt: true,
            submittedAt: true,
            finalScore: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    const formatted = exams.map((exam: any) => {
      const session = exam.sessions[0] || null;
      return {
        id: exam.id,
        title: exam.title,
        subject: exam.bank.subject.name,
        subjectCode: exam.bank.subject.code,
        durationMinutes: exam.durationMinutes,
        startTime: exam.startTime,
        endTime: exam.endTime,
        questionCount: exam.bank._count.questions,
        tokenRequired: !!exam.token,
        status: exam.status,
        sessionStatus: session?.status || "NOT_STARTED",
        sessionId: session?.id || null,
        finalScore: session?.finalScore ?? null,
      };
    });

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        username: student.username,
        class: student.class?.name || "Umum",
      },
      exams: formatted,
    });
  } catch (error: any) {
    console.error("Error fetching exams:", error);
    return NextResponse.json({ error: "Gagal memuat jadwal ujian" }, { status: 500 });
  }
}
