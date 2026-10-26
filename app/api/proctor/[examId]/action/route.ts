import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function generateRandomToken(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Tanpa karakter membingungkan (0/O, 1/I)
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await context.params;
    const body = await request.json();
    const { action, studentId, extraMinutes } = body;

    if (!action) {
      return NextResponse.json({ error: "Aksi tidak ditentukan" }, { status: 400 });
    }

    // 1. REGENERATE TOKEN
    if (action === "REGENERATE_TOKEN") {
      const newToken = generateRandomToken(6);
      const updatedExam = await prisma.exam.update({
        where: { id: examId },
        data: { token: newToken },
        select: { token: true },
      });

      return NextResponse.json({
        success: true,
        message: "Token ujian baru berhasil digenerate",
        newToken: updatedExam.token,
      });
    }

    // Aksi yang membutuhkan studentId
    if (!studentId) {
      return NextResponse.json({ error: "studentId diperlukan untuk aksi ini" }, { status: 400 });
    }

    const session = await prisma.examSession.findUnique({
      where: {
        examId_studentId: {
          examId,
          studentId,
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Sesi ujian siswa tidak ditemukan" }, { status: 404 });
    }

    // 2. RESET SESSION (Buka Kunci Login kembali tanpa menghapus jawaban)
    if (action === "RESET_SESSION") {
      await prisma.examSession.update({
        where: { id: session.id },
        data: {
          status: "IN_PROGRESS",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Sesi ujian siswa berhasil dibuka kunci. Siswa dapat login kembali.",
      });
    }

    // 3. TAMBAH WAKTU (ADD_TIME)
    if (action === "ADD_TIME") {
      const minutesToAdd = Number(extraMinutes) || 10;
      if (session.startedAt) {
        // Menggeser startedAt ke waktu yang lebih baru agar sisa waktu bertambah
        const newStartedAt = new Date(
          session.startedAt.getTime() + minutesToAdd * 60 * 1000
        );

        await prisma.examSession.update({
          where: { id: session.id },
          data: {
            startedAt: newStartedAt,
          },
        });
      }

      return NextResponse.json({
        success: true,
        message: `Tambahan waktu ${minutesToAdd} menit berhasil diberikan.`,
      });
    }

    // 4. PAKSA SELESAI (FORCE_SUBMIT)
    if (action === "FORCE_SUBMIT") {
      await prisma.examSession.update({
        where: { id: session.id },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "Ujian siswa berhasil diserahkan secara paksa oleh proktor.",
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
  } catch (error: any) {
    console.error("Error executing proctor action:", error);
    return NextResponse.json({ error: "Gagal menjalankan aksi proktor" }, { status: 500 });
  }
}
