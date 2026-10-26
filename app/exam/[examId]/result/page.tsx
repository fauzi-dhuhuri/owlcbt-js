"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  Trophy,
  Clock,
  ArrowLeft,
  Calendar,
  Sparkles,
  FileCheck,
  Award,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function ExamResultPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = use(params);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchResult() {
      try {
        const res = await fetch(`/api/exam/${examId}/session`);
        if (!res.ok) throw new Error("Gagal mengambil data hasil");
        const json = await res.json();
        setData(json);

        // Pemicu konfeti perayaan 🎉
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.error("Error loading result:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchResult();
  }, [examId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500">Memuat hasil ujian...</p>
        </div>
      </div>
    );
  }

  const session = data?.session;
  const exam = data?.exam;
  const student = data?.student;

  const isGraded = session?.isGraded;
  const score = session?.finalScore;
  const passingGrade = exam?.passingGrade || 75;
  const isPassed = score !== null && score !== undefined && score >= passingGrade;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 sm:p-8 text-center flex flex-col items-center">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold mb-4 shadow-md shadow-emerald-500/20">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          Ujian Berhasil Diserahkan
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 mb-2">
          Terima Kasih, {student?.name}!
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
          Seluruh lembar jawaban Anda untuk ujian <strong>{exam?.title}</strong> telah tersimpan dengan aman di server.
        </p>

        {/* Score Badge Card (if immediate result enabled) */}
        {exam?.showResultImmediate ? (
          <div className="w-full bg-gradient-to-b from-indigo-50/70 to-slate-50 dark:from-indigo-950/40 dark:to-slate-900 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-900/50 mb-6">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Perolehan Nilai Akhir
            </div>

            {score !== null && score !== undefined ? (
              <div>
                <div className="text-5xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent my-1">
                  {score}
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      isPassed
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200"
                        : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200"
                    }`}
                  >
                    {isPassed ? "Tuntas (Di Atas KKM)" : "Perlu Remedial"}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    KKM: {passingGrade}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-2 text-xs text-slate-600 dark:text-slate-300">
                <FileCheck className="w-6 h-6 mx-auto text-indigo-500 mb-1" />
                <span>Menunggu koreksi soal esai oleh guru pengampu.</span>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 mb-6 text-xs text-slate-600 dark:text-slate-400">
            <Award className="w-6 h-6 mx-auto text-indigo-500 mb-2" />
            Nilai ujian akan diumumkan oleh guru setelah seluruh sesi ujian berakhir.
          </div>
        )}

        {/* Student Session Details */}
        <div className="w-full bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 mb-6 text-left text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Mata Pelajaran:</span>
            <strong className="text-slate-800 dark:text-slate-200">{exam?.subject}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Kelas / NISN:</span>
            <strong className="text-slate-800 dark:text-slate-200">{student?.class} • {student?.username}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Waktu Penyerahan:</span>
            <strong className="text-slate-800 dark:text-slate-200">
              {session?.submittedAt
                ? new Date(session.submittedAt).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "-"}
            </strong>
          </div>
        </div>

        {/* Home Button */}
        <Link
          href="/"
          className="w-full py-3 px-6 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Dashboard Utama
        </Link>
      </div>
    </div>
  );
}
