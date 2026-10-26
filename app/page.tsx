import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentStudent, getCurrentUser } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import StudentLogoutButton from "@/components/StudentLogoutButton";
import {
  BookOpen,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  GraduationCap,
  FileQuestion,
  Calendar,
} from "lucide-react";

export default async function HomePage() {
  const currentUser = await getCurrentUser();

  // 1. Jika belum login, arahkan ke halaman login
  if (!currentUser) {
    redirect("/login");
  }

  // 2. Administrator, Guru, dan Proktor TIDAK BISA masuk ke portal siswa
  // Mereka otomatis diarahkan ke panel kerja masing-masing
  if (currentUser.role === "ADMIN") {
    redirect("/admin/students");
  }
  if (currentUser.role === "TEACHER") {
    redirect("/teacher");
  }
  if (currentUser.role === "PROCTOR") {
    redirect("/proctor");
  }

  // 3. Hanya siswa yang sah yang dapat mengakses
  const student = await getCurrentStudent();
  if (!student) {
    redirect("/login");
  }

  const setting = await prisma.systemSetting.findFirst();

  const exams = await prisma.exam.findMany({
    where: {
      status: { in: ["ACTIVE", "SCHEDULED"] },
      ...(student.classId
        ? {
            OR: [
              { classes: { none: {} } },
              { classes: { some: { id: student.classId } } },
            ],
          }
        : {}),
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/50 to-slate-200/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  OwlCBT
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/50 dark:border-indigo-800/50">
                  Portal Siswa
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-none">
                {setting?.schoolName || "SMA Owl Nusantara"}
              </p>
            </div>
          </div>

          {/* Student Profile Info & Logout */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2.5 bg-slate-100 dark:bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-200/60 dark:border-slate-700/60">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 text-white flex items-center justify-center text-xs font-bold">
                {student.name.charAt(0)}
              </div>
              <div className="text-left text-xs">
                <div className="font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                  {student.name}
                </div>
                <div className="text-slate-500 dark:text-slate-400 text-[10px]">
                  NISN: {student.username} • {student.class?.name || "Peserta"}
                </div>
              </div>
              <div className="ml-1 pl-2 border-l border-slate-300 dark:border-slate-700">
                <StudentLogoutButton />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 text-white p-6 sm:p-8 shadow-xl shadow-indigo-600/10 mb-8">
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium text-indigo-100 mb-3 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              Sistem Ujian Berbasis Komputer Modern
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat Datang, {student?.name || "Peserta Ujian"}!
            </h1>
            <p className="mt-2 text-indigo-100 text-sm sm:text-base leading-relaxed">
              Silakan periksa jadwal ujian Anda di bawah ini. Pastikan koneksi internet stabil dan siapkan token ujian jika diminta sebelum memulai.
            </p>
          </div>
        </div>

        {/* Exam Section Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Daftar Ujian Aktif
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pilih ujian yang sedang berlangsung untuk memulai pengerjaan
            </p>
          </div>
          <div className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {exams.length} Ujian Terdaftar
          </div>
        </div>

        {/* Exam Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {exams.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <AlertCircle className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                Belum Ada Jadwal Ujian Aktif
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Saat ini belum ada ujian yang dijadwalkan untuk kelas Anda. Silakan hubungi proktor atau guru jika ada kendala.
              </p>
            </div>
          ) : (
            exams.map((exam: any) => {
              const session = exam.sessions?.[0] || null;
              const isSubmitted = session?.status === "SUBMITTED";
              const isInProgress = session?.status === "IN_PROGRESS";

              return (
                <div
                  key={exam.id}
                  className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm hover:shadow-md transition-all duration-200 p-6 flex flex-col justify-between"
                >
                  <div>
                    {/* Header Card: Subject & Status Pill */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40">
                        {exam.bank.subject.code} • {exam.bank.subject.name}
                      </span>

                      {isSubmitted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Selesai
                        </span>
                      ) : isInProgress ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse">
                          <Clock className="w-3.5 h-3.5" />
                          Sedang Dikerjakan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5" />
                          Siap Dimulai
                        </span>
                      )}
                    </div>

                    {/* Exam Title */}
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {exam.title}
                    </h3>

                    {/* Metadata Info */}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 pt-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>Durasi: <strong>{exam.durationMinutes} Menit</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <FileQuestion className="w-4 h-4 text-slate-400" />
                        <span>Jumlah: <strong>{exam.bank._count.questions} Soal</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                    {isSubmitted ? (
                      <Link
                        href={`/exam/${exam.id}/result`}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                      >
                        Lihat Rincian Selesai
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    ) : isInProgress ? (
                      <Link
                        href={`/exam/${exam.id}/room`}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/20 transition-all hover:scale-[1.01]"
                      >
                        Lanjutkan Pengerjaan
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <Link
                        href={`/exam/${exam.id}/confirm`}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01]"
                      >
                        Masuk Ruang Konfirmasi
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Information Box */}
        <div className="mt-10 p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex items-start gap-3.5 text-xs text-indigo-900 dark:text-indigo-200">
          <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold block mb-0.5">Petunjuk & Integritas Ujian:</strong>
            Sistem OwlCBT dilengkapi dengan deteksi fokus layar dan autosave otomatis. Jawaban Anda akan tersimpan di setiap klik tombol opsi. Jangan berpindah tab atau meminimalkan browser selama ujian berlangsung.
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
        © {new Date().getFullYear()} {setting?.schoolName || "SMA Owl Nusantara"} • Didukung oleh OwlCBT Next.js
      </footer>
    </div>
  );
}
