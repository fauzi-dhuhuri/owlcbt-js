"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  FileQuestion,
  KeyRound,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  Loader2,
  CheckCircle,
} from "lucide-react";

export default function ExamConfirmPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const router = useRouter();
  const { examId } = use(params);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/exam/${examId}/session`);
        if (!res.ok) {
          throw new Error("Gagal mengambil data ujian");
        }
        const json = await res.json();
        setData(json);

        // Jika siswa sudah pernah submit, langsung redirect ke halaman hasil
        if (json.session?.status === "SUBMITTED") {
          router.replace(`/exam/${examId}/result`);
        } else if (json.session?.status === "IN_PROGRESS") {
          // Jika sudah in progress, bisa langsung diarahkan ke exam room
          router.replace(`/exam/${examId}/room`);
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Terjadi kesalahan saat memuat data.");
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [examId, router]);

  async function handleStartExam(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setStarting(true);

    try {
      const res = await fetch(`/api/exam/${examId}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenInput }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Gagal memulai ujian.");
      }

      // Masuk ke ruang ujian
      router.push(`/exam/${examId}/room`);
    } catch (err: any) {
      setErrorMsg(err.message);
      setStarting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Memuat rincian ujian...</p>
        </div>
      </div>
    );
  }

  if (!data?.exam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-6 text-center border border-slate-200 dark:border-slate-800">
          <ShieldAlert className="w-12 h-12 mx-auto text-amber-500 mb-3" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ujian Tidak Tersedia</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6">{errorMsg || "Jadwal ujian ini tidak dapat diakses."}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const { exam, student } = data;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Ujian
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 flex flex-col justify-center">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Konfirmasi Peserta Ujian
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {exam.title}
              </h1>
            </div>
          </div>

          {/* Student Info Box */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 mb-6">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Nama Peserta</span>
                <strong className="text-slate-900 dark:text-white text-sm">{student.name}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">NISN / Kelas</span>
                <strong className="text-slate-900 dark:text-white text-sm">{student.username} ({student.class})</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Mata Pelajaran</span>
                <strong className="text-slate-900 dark:text-white">{exam.subject}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Alokasi Waktu</span>
                <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{exam.durationMinutes} Menit</strong>
              </div>
            </div>
          </div>

          {/* Exam Rules List */}
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Tata Tertib & Ketentuan Ujian
            </h3>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Timer akan mulai menghitung mundur begitu tombol <strong>Mulai Ujian</strong> ditekan.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Jawaban Anda disimpan otomatis ke server pada setiap pilihan yang Anda klik.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>Dilarang berpindah tab browser, membuka aplikasi lain, atau meminimalkan jendela selama ujian.</span>
              </li>
            </ul>
          </div>

          {/* Token Input Form */}
          <form onSubmit={handleStartExam} className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="mb-4">
              <label htmlFor="tokenInput" className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                Masukkan Token Ujian
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input
                  id="tokenInput"
                  type="text"
                  placeholder="Contoh: OWL888"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
                  className="w-full pl-11 pr-4 py-3 text-base font-mono tracking-widest uppercase bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 dark:text-white"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                Token diberikan oleh pengawas/proktor di ruang ujian.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={starting}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.01]"
            >
              {starting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memverifikasi & Menyiapkan Soal...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Mulai Kerjakan Ujian Sekarang
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
