import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentStudent } from "@/lib/auth-helper";

/**
 * Mengacak urutan elemen array secara merata tanpa bias menggunakan algoritma
 * Fisher-Yates (Knuth) Shuffle. Digunakan untuk menghasilkan susunan nomor soal
 * yang unik bagi setiap peserta ketika opsi pengacakan aktif.
 *
 * @param array Array elemen yang akan diacak
 * @returns Array baru dengan urutan acak
 */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Endpoint Mulai / Konfirmasi Pengerjaan Ujian Siswa.
 *
 * Memverifikasi validitas token ujian, status ujian, dan menginisialisasi
 * sesi pengerjaan (ExamSession). Jika opsi acak soal aktif, urutan butir soal
 * disimpan di kolom `assignedQuestionOrder` agar konsisten sepanjang sesi siswa.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const { token } = body;

    const student = await getCurrentStudent();
    if (!student) {
      return NextResponse.json({ error: "Siswa tidak ditemukan" }, { status: 404 });
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        bank: {
          include: {
            questions: { select: { id: true } },
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
    }

    if (exam.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Ujian saat ini belum dibuka atau telah selesai." },
        { status: 400 }
      );
    }

    // Validasi token ujian jika diatur
    if (exam.token) {
      if (!token || token.trim().toUpperCase() !== exam.token.trim().toUpperCase()) {
        return NextResponse.json(
          { error: "Token ujian yang Anda masukkan tidak valid." },
          { status: 400 }
        );
      }
    }

    // Cek apakah siswa sudah memiliki sesi ujian
    let session = await prisma.examSession.findUnique({
      where: {
        examId_studentId: {
          examId: exam.id,
          studentId: student.id,
        },
      },
    });

    if (session && session.status === "SUBMITTED") {
      return NextResponse.json(
        { error: "Anda telah menyelesaikan ujian ini dan tidak dapat mengerjakan kembali." },
        { status: 400 }
      );
    }

    // Jika belum ada sesi atau belum mulai, inisialisasi sesi
    if (!session) {
      // Acak urutan butir soal jika randomizeQuestions aktif
      const questionIds = exam.bank.questions.map((q: any) => q.id);
      const assignedOrder = exam.randomizeQuestions
        ? shuffle(questionIds)
        : questionIds;

      session = await prisma.examSession.create({
        data: {
          examId: exam.id,
          studentId: student.id,
          status: "IN_PROGRESS",
          startedAt: new Date(),
          assignedQuestionOrder: assignedOrder,
        },
      });
    } else if (session.status === "NOT_STARTED") {
      session = await prisma.examSession.update({
        where: { id: session.id },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Sesi ujian berhasil dimulai",
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error("Error starting exam session:", error);
    return NextResponse.json({ error: "Gagal memulai sesi ujian" }, { status: 500 });
  }
}
