import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await context.params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format");

    const [exam, setting] = await Promise.all([
      prisma.exam.findUnique({
        where: { id: examId },
        include: {
          bank: {
            include: { subject: true },
          },
          classes: {
            include: {
              students: {
                where: { role: "STUDENT", isActive: true },
                select: {
                  id: true,
                  name: true,
                  username: true,
                  class: { select: { name: true } },
                },
                orderBy: { name: "asc" },
              },
            },
          },
          sessions: {
            include: {
              student: {
                select: { id: true, name: true, username: true, class: { select: { name: true } } },
              },
            },
          },
        },
      }),
      prisma.systemSetting.findFirst(),
    ]);

    if (!exam) {
      return NextResponse.json({ error: "Ujian tidak ditemukan" }, { status: 404 });
    }

    const sessionMap = new Map(exam.sessions.map((s: any) => [s.studentId, s]));
    const passingGrade = exam.passingGrade || 75;

    // Kumpulkan semua siswa dari kelas terdaftar
    const gradeList: any[] = [];
    for (const cls of exam.classes) {
      for (const st of cls.students) {
        const sess = sessionMap.get(st.id);
        const finalScore = sess?.finalScore ?? null;
        const isPassed = finalScore !== null ? finalScore >= passingGrade : null;

        gradeList.push({
          id: st.id,
          name: st.name,
          username: st.username,
          className: st.class?.name || "Umum",
          status: sess?.status || "NOT_STARTED",
          multipleChoiceScore: sess?.multipleChoiceScore ?? null,
          finalScore,
          isPassed,
          isGraded: sess?.isGraded ?? false,
          submittedAt: sess?.submittedAt || null,
        });
      }
    }

    // Jika format CSV diminta, generate string CSV
    if (format === "csv") {
      const schoolName = setting?.schoolName || "SMA Owl Nusantara";
      const rows = [
        [`REKAPITULASI HASIL UJIAN - ${schoolName}`],
        [`Judul Ujian: ${exam.title}`],
        [`Mata Pelajaran: ${exam.bank.subject.name} (${exam.bank.subject.code})`],
        [`KKM: ${passingGrade}`],
        [`Tanggal Unduh: ${new Date().toLocaleDateString("id-ID")}`],
        [],
        ["No", "NISN", "Nama Siswa", "Kelas", "Status", "Skor PG", "Nilai Akhir", "Keterangan KKM"],
      ];

      gradeList.forEach((item, index) => {
        rows.push([
          String(index + 1),
          `'${item.username}`,
          `"${item.name.replace(/"/g, '""')}"`,
          item.className,
          item.status === "SUBMITTED" ? "Selesai" : item.status === "IN_PROGRESS" ? "Sedang Ujian" : "Belum Ikut",
          item.multipleChoiceScore !== null ? String(item.multipleChoiceScore) : "-",
          item.finalScore !== null ? String(item.finalScore) : "-",
          item.isPassed === true ? "TUNTAS" : item.isPassed === false ? "REMEDIAL" : "BELUM LENGKAP",
        ]);
      });

      const csvString = rows.map((r) => r.join(",")).join("\r\n");

      return new NextResponse("\uFEFF" + csvString, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="rekap_nilai_${exam.bank.subject.code}_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({
      exam: {
        id: exam.id,
        title: exam.title,
        subject: exam.bank.subject.name,
        subjectCode: exam.bank.subject.code,
        passingGrade,
      },
      schoolName: setting?.schoolName || "SMA Owl Nusantara",
      grades: gradeList,
    });
  } catch (error: any) {
    console.error("Error generating grades report:", error);
    return NextResponse.json({ error: "Gagal memuat rekap nilai" }, { status: 500 });
  }
}
