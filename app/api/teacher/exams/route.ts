import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentStaff } from "@/lib/auth-helper";

// Helper untuk token acak 6 karakter (misal: "OWL482", "KBT921")
function generateRandomToken(prefix = "OWL") {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = prefix;
  for (let i = 0; i < 3; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// 1. GET: Ambil daftar seluruh jadwal ujian beserta bank soal dan kelas
export async function GET() {
  try {
    const staff = await getCurrentStaff();
    if (!staff) {
      return NextResponse.json({ error: "Akses ditolak: sesi guru/staf tidak valid" }, { status: 401 });
    }

    const [exams, banks, classes] = await Promise.all([
      prisma.exam.findMany({
        include: {
          bank: {
            include: {
              subject: true,
              _count: { select: { questions: true } },
            },
          },
          classes: {
            select: { id: true, name: true, level: true },
          },
          _count: {
            select: { sessions: true },
          },
        },
        orderBy: [{ startTime: "desc" }, { createdAt: "desc" }],
      }),
      prisma.questionBank.findMany({
        include: {
          subject: true,
          _count: { select: { questions: true } },
        },
        orderBy: { title: "asc" },
      }),
      prisma.class.findMany({
        include: {
          _count: { select: { students: true } },
        },
        orderBy: [{ level: "asc" }, { name: "asc" }],
      }),
    ]);

    const formattedExams = exams.map((ex) => ({
      id: ex.id,
      title: ex.title,
      bankId: ex.bankId,
      bankTitle: ex.bank.title,
      bankCode: ex.bank.code,
      subjectName: ex.bank.subject.name,
      subjectCode: ex.bank.subject.code,
      questionCount: ex.bank._count.questions,
      token: ex.token,
      durationMinutes: ex.durationMinutes,
      startTime: ex.startTime.toISOString(),
      endTime: ex.endTime.toISOString(),
      randomizeQuestions: ex.randomizeQuestions,
      randomizeOptions: ex.randomizeOptions,
      showResultImmediate: ex.showResultImmediate,
      passingGrade: ex.passingGrade,
      status: ex.status,
      classes: ex.classes,
      totalSessions: ex._count.sessions,
    }));

    return NextResponse.json({
      exams: formattedExams,
      banks: banks.map((b) => ({
        id: b.id,
        title: b.title,
        code: b.code,
        subjectName: b.subject.name,
        questionCount: b._count.questions,
      })),
      classes: classes.map((c) => ({
        id: c.id,
        name: c.name,
        level: c.level,
        studentCount: c._count.students,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching exams:", error);
    return NextResponse.json({ error: error?.message || "Gagal memuat jadwal ujian", stack: error?.stack }, { status: 500 });
  }
}

// 2. POST: Tambah Jadwal Ujian Baru
export async function POST(req: Request) {
  try {
    const staff = await getCurrentStaff();
    if (!staff) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      bankId,
      token,
      durationMinutes,
      startTime,
      endTime,
      randomizeQuestions = true,
      randomizeOptions = true,
      showResultImmediate = false,
      passingGrade = 75,
      status = "SCHEDULED",
      classIds = [],
    } = body;

    if (!title || !bankId || !durationMinutes || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Mohon lengkapi judul, bank soal, durasi, serta waktu mulai dan selesai ujian" },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Format tanggal/waktu tidak valid" }, { status: 400 });
    }

    if (end <= start) {
      return NextResponse.json({ error: "Waktu selesai harus lebih besar dari waktu mulai" }, { status: 400 });
    }

    const newExam = await prisma.exam.create({
      data: {
        title: title.trim(),
        bankId,
        token: token ? token.trim().toUpperCase() : null,
        durationMinutes: parseInt(durationMinutes, 10),
        startTime: start,
        endTime: end,
        randomizeQuestions: Boolean(randomizeQuestions),
        randomizeOptions: Boolean(randomizeOptions),
        showResultImmediate: Boolean(showResultImmediate),
        passingGrade: passingGrade ? parseFloat(passingGrade) : null,
        status: status,
        classes: classIds.length > 0
          ? {
              connect: classIds.map((id: string) => ({ id })),
            }
          : undefined,
      },
      include: {
        bank: {
          include: { subject: true, _count: { select: { questions: true } } },
        },
        classes: true,
      },
    });

    return NextResponse.json({
      message: "Jadwal ujian berhasil dibuat",
      exam: newExam,
    });
  } catch (error: any) {
    console.error("Error creating exam:", error);
    return NextResponse.json({ error: error.message || "Gagal membuat jadwal ujian" }, { status: 500 });
  }
}

// 3. PUT: Edit Pengaturan Jadwal Ujian
export async function PUT(req: Request) {
  try {
    const staff = await getCurrentStaff();
    if (!staff) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
    }

    const body = await req.json();
    const {
      id,
      title,
      bankId,
      token,
      durationMinutes,
      startTime,
      endTime,
      randomizeQuestions,
      randomizeOptions,
      showResultImmediate,
      passingGrade,
      status,
      classIds = [],
    } = body;

    if (!id) {
      return NextResponse.json({ error: "ID ujian diperlukan" }, { status: 400 });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Format tanggal/waktu tidak valid" }, { status: 400 });
    }

    if (end <= start) {
      return NextResponse.json({ error: "Waktu selesai harus lebih besar dari waktu mulai" }, { status: 400 });
    }

    const updatedExam = await prisma.exam.update({
      where: { id },
      data: {
        title: title.trim(),
        bankId,
        token: token ? token.trim().toUpperCase() : null,
        durationMinutes: parseInt(durationMinutes, 10),
        startTime: start,
        endTime: end,
        randomizeQuestions: Boolean(randomizeQuestions),
        randomizeOptions: Boolean(randomizeOptions),
        showResultImmediate: Boolean(showResultImmediate),
        passingGrade: passingGrade ? parseFloat(passingGrade) : null,
        status: status,
        classes: {
          set: (classIds || []).map((cId: string) => ({ id: cId })),
        },
      },
      include: {
        bank: {
          include: { subject: true, _count: { select: { questions: true } } },
        },
        classes: true,
      },
    });

    return NextResponse.json({
      message: "Jadwal ujian berhasil diperbarui",
      exam: updatedExam,
    });
  } catch (error: any) {
    console.error("Error updating exam:", error);
    return NextResponse.json({ error: error.message || "Gagal mengupdate jadwal ujian" }, { status: 500 });
  }
}

// 4. DELETE: Hapus Jadwal Ujian
export async function DELETE(req: Request) {
  try {
    const staff = await getCurrentStaff();
    if (!staff) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID ujian diperlukan" }, { status: 400 });
    }

    await prisma.exam.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Jadwal ujian berhasil dihapus" });
  } catch (error: any) {
    console.error("Error deleting exam:", error);
    return NextResponse.json({ error: error.message || "Gagal menghapus jadwal ujian" }, { status: 500 });
  }
}

// 5. PATCH: Aksi cepat (Ganti Status, Regenerate Token)
export async function PATCH(req: Request) {
  try {
    const staff = await getCurrentStaff();
    if (!staff) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
    }

    const body = await req.json();
    const { id, action, status } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "ID dan action diperlukan" }, { status: 400 });
    }

    if (action === "TOGGLE_STATUS") {
      const updated = await prisma.exam.update({
        where: { id },
        data: { status: status as any },
      });
      return NextResponse.json({ message: `Status berhasil diubah ke ${status}`, exam: updated });
    }

    if (action === "REGENERATE_TOKEN") {
      const newToken = generateRandomToken();
      const updated = await prisma.exam.update({
        where: { id },
        data: { token: newToken },
      });
      return NextResponse.json({ message: `Token baru: ${newToken}`, token: newToken, exam: updated });
    }

    return NextResponse.json({ error: "Action tidak dikenal" }, { status: 400 });
  } catch (error: any) {
    console.error("Error patching exam:", error);
    return NextResponse.json({ error: error.message || "Gagal memproses aksi ujian" }, { status: 500 });
  }
}
