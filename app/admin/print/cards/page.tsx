"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  GraduationCap,
  Sparkles,
  Filter,
  CheckCircle,
  Loader2,
} from "lucide-react";

export default function PrintStudentCardsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings / Customization
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [examTitle, setExamTitle] = useState("PENILAIAN AKHIR SEMESTER");
  const [academicYear, setAcademicYear] = useState("2026/2027");
  const [schoolName, setSchoolName] = useState("SMA OWL NUSANTARA");
  const [headmaster, setHeadmaster] = useState("Dr. Muhammad Fauzi, M.Pd");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/admin/students");
        const json = await res.json();
        setStudents(json.students || []);
        setClasses(json.classes || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredStudents = students.filter((s) => {
    return selectedClass === "ALL" ? true : s.classId === selectedClass;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 print:bg-white print:text-black">
      {/* 1. TOP BAR & PRINT CONTROLS (Hidden on Print) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-sm p-4 print:hidden">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/students"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Kembali"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Printer className="w-4 h-4 text-indigo-600" />
                Cetak Kartu Peserta Ujian
              </h1>
              <p className="text-xs text-slate-500">
                Format resmi siap cetak (4 kartu per lembar A4)
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <span className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold">Kartu</span>
              <Link href="/admin/print/attendance" className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Daftar Hadir</Link>
              <Link href="/admin/print/report" className="px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Berita Acara</Link>
            </div>

            {/* Filter Kelas */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
            >
              <option value="ALL">Semua Kelas ({students.length} Siswa)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Kelas {c.name}
                </option>
              ))}
            </select>

            {/* Nama Ujian */}
            <input
              type="text"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value.toUpperCase())}
              placeholder="Nama Ujian..."
              className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl w-44"
              title="Nama Ujian"
            />

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all hover:scale-105"
            >
              <Printer className="w-4 h-4" />
              Cetak Kartu ({filteredStudents.length} Siswa)
            </button>
          </div>
        </div>
      </header>

      {/* 2. PRINT SHEET CANVAS */}
      <main className="max-w-5xl mx-auto p-4 sm:p-8 print:p-0 print:m-0 print:max-w-none">
        {filteredStudents.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 print:hidden">
            <p className="text-xs text-slate-400">Tidak ada data siswa untuk kelas yang dipilih.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4 print:p-2">
            {filteredStudents.map((s, index) => (
              <div
                key={s.id}
                className="bg-white text-slate-900 rounded-2xl border-2 border-slate-300 print:border-black p-4 shadow-sm print:shadow-none flex flex-col justify-between text-xs relative overflow-hidden break-inside-avoid print:break-inside-avoid"
                style={{ minHeight: "260px" }}
              >
                {/* Header Card (Kop) */}
                <div>
                  <div className="flex items-center gap-3 border-b-2 border-slate-800 pb-2 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-700 text-white flex items-center justify-center font-bold text-xs shrink-0 print:border print:border-black">
                      OWL
                    </div>
                    <div className="text-center flex-1">
                      <div className="font-extrabold text-[13px] tracking-tight text-slate-900 leading-tight uppercase">
                        KARTU PESERTA CBT
                      </div>
                      <div className="text-[11px] font-bold text-indigo-700 print:text-black uppercase leading-tight">
                        {examTitle}
                      </div>
                      <div className="text-[10px] text-slate-500 print:text-black leading-tight">
                        {schoolName} • TP. {academicYear}
                      </div>
                    </div>
                  </div>

                  {/* Body Student Info & Photo */}
                  <div className="flex items-start gap-3.5 mb-3">
                    {/* Foto Box */}
                    <div className="w-16 h-20 rounded-lg border border-slate-300 print:border-black bg-slate-100 flex flex-col items-center justify-center text-center p-1 shrink-0">
                      <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center font-bold text-slate-600 text-xs mb-1">
                        {s.name.charAt(0)}
                      </div>
                      <span className="text-[8px] text-slate-400 font-mono">FOTO 2x3</span>
                    </div>

                    {/* Table Info */}
                    <div className="flex-1 space-y-1 text-[11px]">
                      <div className="flex">
                        <span className="w-24 text-slate-500 print:text-black">No. Peserta / NISN</span>
                        <strong className="flex-1 font-mono font-bold">: {s.username}</strong>
                      </div>
                      <div className="flex">
                        <span className="w-24 text-slate-500 print:text-black">Nama Siswa</span>
                        <strong className="flex-1 font-bold uppercase truncate">: {s.name}</strong>
                      </div>
                      <div className="flex">
                        <span className="w-24 text-slate-500 print:text-black">Kelas / Sesi</span>
                        <span className="flex-1 font-semibold">: {s.className} / Sesi 1</span>
                      </div>
                      <div className="flex">
                        <span className="w-24 text-slate-500 print:text-black">Ruang Ujian</span>
                        <span className="flex-1 font-semibold">: LAB KOMPUTER 1</span>
                      </div>
                      <div className="flex pt-1 mt-1 border-t border-dashed border-slate-200 print:border-black">
                        <span className="w-24 text-slate-500 print:text-black">Username</span>
                        <strong className="flex-1 font-mono font-extrabold text-indigo-700 print:text-black">
                          : {s.username}
                        </strong>
                      </div>
                      <div className="flex">
                        <span className="w-24 text-slate-500 print:text-black">Password Default</span>
                        <strong className="flex-1 font-mono font-extrabold text-indigo-700 print:text-black">
                          : 123456
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Signature */}
                <div className="pt-2 border-t border-slate-200 print:border-black flex items-end justify-between text-[10px]">
                  <div className="text-[9px] text-slate-400 font-mono">
                    *Harap kartu ini disimpan selama ujian berlangsung.
                  </div>
                  <div className="text-center font-sans">
                    <div className="text-[9px]">Kepala Sekolah,</div>
                    <div className="h-6" /> {/* Spasi Tanda Tangan */}
                    <div className="font-bold underline text-[10px]">{headmaster}</div>
                    <div className="text-[8px] text-slate-500 print:text-black">NIP. 19780512 200312 1 002</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            background: white !important;
            color: black !important;
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
