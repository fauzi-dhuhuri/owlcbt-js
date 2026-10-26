import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const exams = await prisma.exam.findMany({
      where: {
        status: { in: ["ACTIVE", "SCHEDULED", "COMPLETED"] },
      },
      include: {
        bank: {
          include: {
            subject: true,
            _count: { select: { questions: true } },
          },
        },
        classes: {
          select: { id: true, name: true },
        },
        _count: {
          select: { sessions: true },
        },
      },
      orderBy: { startTime: "desc" },
    });

    const formatted = exams.map((exam: any) => ({
      id: exam.id,
      title: exam.title,
      subject: exam.bank.subject.name,
      token: exam.token,
      durationMinutes: exam.durationMinutes,
      startTime: exam.startTime.toISOString(),
      endTime: exam.endTime.toISOString(),
      status: exam.status,
      questionCount: exam.bank._count.questions,
      classes: exam.classes.map((c: any) => c.name),
      targetClasses: exam.classes.map((c: any) => ({ id: c.id, name: c.name })),
      totalSessions: exam._count.sessions,
    }));

    return NextResponse.json({ exams: formatted });
  } catch (error: any) {
    console.error("Error fetching proctor exams:", error);
    return NextResponse.json({ error: "Gagal memuat daftar ujian proktor" }, { status: 500 });
  }
}
