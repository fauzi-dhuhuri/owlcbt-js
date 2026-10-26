"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  BookOpen,
  FileText,
  CheckCircle,
  Plus,
  ArrowRight,
  Download,
  Search,
  Award,
  Sparkles,
  Loader2,
  Trash2,
  Edit,
  ExternalLink,
  Layers,
  Check,
  AlertCircle,
  FileCheck,
  Calendar,
} from "lucide-react";
import ExamsScheduleManager from "./components/ExamsScheduleManager";

export default function TeacherPortalPage() {
  const [activeTab, setActiveTab] = useState<"EXAMS" | "BANKS" | "GRADING" | "GRADES">("EXAMS");

  // Bank Soal states
  const [banks, setBanks] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [showNewBankModal, setShowNewBankModal] = useState(false);
  const [bankForm, setBankForm] = useState({
    code: "",
    title: "",
    subjectId: "",
    description: "",
  });
  const [creatingBank, setCreatingBank] = useState(false);

  // Grading & Grades states
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [gradingSubmissions, setGradingSubmissions] = useState<any[]>([]);
  const [loadingGrading, setLoadingGrading] = useState(false);
  const [essayScores, setEssayScores] = useState<Record<string, number>>({});
  const [savingGradeId, setSavingGradeId] = useState<string | null>(null);

  // Grades Report state
  const [gradeReport, setGradeReport] = useState<any>(null);
  const [loadingGrades, setLoadingGrades] = useState(false);

  // Alert
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 1. Fetch Banks on mount
  useEffect(() => {
    async function fetchBanksData() {
      try {
        setLoadingBanks(true);
        const res = await fetch("/api/teacher/banks");
        const json = await res.json();
        setBanks(json.banks || []);
        setSubjects(json.subjects || []);
        if (json.subjects?.length > 0 && !bankForm.subjectId) {
          setBankForm((prev) => ({ ...prev, subjectId: json.subjects[0].id }));
        }
      } catch (err) {
        console.error("Error loading banks:", err);
      } finally {
        setLoadingBanks(false);
      }
    }

    async function fetchExamsData() {
      try {
        const res = await fetch("/api/proctor/exams");
        const json = await res.json();
        setExams(json.exams || []);
        if (json.exams?.length > 0) {
          setSelectedExamId(json.exams[0].id);
        }
      } catch (err) {
        console.error("Error loading exams:", err);
      }
    }

    fetchBanksData();
    fetchExamsData();
  }, []);

  // 2. Fetch Grading items when selectedExamId changes and tab is GRADING
  useEffect(() => {
    if (activeTab === "GRADING" && selectedExamId) {
      async function loadGrading() {
        setLoadingGrading(true);
        try {
          const res = await fetch(`/api/teacher/grading/${selectedExamId}`);
          const json = await res.json();
          setGradingSubmissions(json.submissions || []);

          // Inisialisasi input skor yang sudah ada
          const initialScores: Record<string, number> = {};
          (json.submissions || []).forEach((s: any) => {
            initialScores[s.id] = s.scoreEarned;
          });
          setEssayScores(initialScores);
        } catch (err) {
          console.error("Error loading grading:", err);
        } finally {
          setLoadingGrading(false);
        }
      }
      loadGrading();
    }
  }, [activeTab, selectedExamId]);

  // 3. Fetch Grades report when selectedExamId changes and tab is GRADES
  useEffect(() => {
    if (activeTab === "GRADES" && selectedExamId) {
      async function loadGradesReport() {
        setLoadingGrades(true);
        try {
          const res = await fetch(`/api/teacher/grades/${selectedExamId}`);
          const json = await res.json();
          setGradeReport(json);
        } catch (err) {
          console.error("Error loading grades report:", err);
        } finally {
          setLoadingGrades(false);
        }
      }
      loadGradesReport();
    }
  }, [activeTab, selectedExamId]);

  // Create new Bank Soal
  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingBank(true);
    try {
      const res = await fetch("/api/teacher/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bankForm),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat bank soal");

      setNotice({ type: "success", text: "Bank soal baru berhasil ditambahkan!" });
      setShowNewBankModal(false);
      setBankForm({ code: "", title: "", subjectId: subjects[0]?.id || "", description: "" });

      // Refresh list
      const updatedRes = await fetch("/api/teacher/banks");
      const updatedJson = await updatedRes.json();
      setBanks(updatedJson.banks || []);

      setTimeout(() => setNotice(null), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreatingBank(false);
    }
  };

  // Submit single essay grade
  const handleSaveEssayScore = async (answerId: string, maxWeight: number) => {
    const score = essayScores[answerId] ?? 0;
    if (score > maxWeight) {
      alert(`Skor tidak boleh melebihi bobot maksimal (${maxWeight})`);
      return;
    }

    setSavingGradeId(answerId);
    try {
      const res = await fetch(`/api/teacher/grading/${selectedExamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentAnswerId: answerId,
          scoreEarned: score,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan skor");

      setNotice({ type: "success", text: "Skor esai berhasil disimpan dan nilai akhir diperbarui!" });
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingGradeId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Manajemen Ujian</span>
          <span className="text-slate-400">/</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {activeTab === "EXAMS" && "Jadwal & Pengaturan Ujian"}
            {activeTab === "BANKS" && "Bank Soal & Butir Soal"}
            {activeTab === "GRADING" && "Koreksi Esai Siswa"}
            {activeTab === "GRADES" && "Rekapitulasi Nilai"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
            <GraduationCap className="w-3.5 h-3.5" />
            Portal Guru &amp; Admin
          </span>
        </div>
      </header>

      {/* Notice Banner */}
      {notice && (
        <div
          className={`px-4 py-2.5 text-xs font-medium text-center flex items-center justify-center gap-2 ${
            notice.type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
          }`}
        >
          <Check className="w-4 h-4" />
          <span>{notice.text}</span>
        </div>
      )}

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2">
          <button
            onClick={() => setActiveTab("EXAMS")}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "EXAMS"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Jadwal &amp; Pengaturan Ujian
          </button>

          <button
            onClick={() => setActiveTab("BANKS")}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "BANKS"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Bank Soal ({banks.length})
          </button>

          <button
            onClick={() => setActiveTab("GRADING")}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "GRADING"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <FileCheck className="w-4 h-4" />
            Koreksi Esai Siswa
          </button>

          <button
            onClick={() => setActiveTab("GRADES")}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === "GRADES"
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Award className="w-4 h-4" />
            Rekap Nilai &amp; Ekspor
          </button>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* ======================================================== */}
        {/* TAB 0: JADWAL & PENGATURAN UJIAN OWLCBT */}
        {/* ======================================================== */}
        {activeTab === "EXAMS" && <ExamsScheduleManager />}

        {/* ======================================================== */}
        {/* TAB 1: BANK SOAL MANAJEMEN */}
        {/* ======================================================== */}
        {activeTab === "BANKS" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Katalog Bank Soal
                </h2>
                <p className="text-xs text-slate-500">
                  Kelola paket bank soal untuk mata pelajaran dan ujian sekolah
                </p>
              </div>

              <button
                onClick={() => setShowNewBankModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01]"
              >
                <Plus className="w-4 h-4" />
                Buat Bank Soal Baru
              </button>
            </div>

            {loadingBanks ? (
              <div className="py-20 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
                <p className="text-xs text-slate-400">Memuat katalog bank soal...</p>
              </div>
            ) : banks.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Belum Ada Bank Soal
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  Mulai dengan membuat bank soal pertama untuk menginput butir-butir soal.
                </p>
                <button
                  onClick={() => setShowNewBankModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white"
                >
                  Tambah Sekarang
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {banks.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:border-indigo-400 dark:hover:border-indigo-500 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900">
                          {b.subjectCode} • {b.subjectName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {b.code}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight mb-2">
                        {b.title}
                      </h3>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                        {b.description || "Tidak ada deskripsi khusus."}
                      </p>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div>
                          Butir Soal: <strong className="text-slate-900 dark:text-white">{b.totalQuestions} Soal</strong>
                        </div>
                        <div>
                          Digunakan: <strong className="text-slate-900 dark:text-white">{b.totalExams} Ujian</strong>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <Link
                        href={`/teacher/bank/${b.id}`}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 transition-colors"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        Kelola & Edit Butir Soal
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: KOREKSI ESAI SISWA */}
        {/* ======================================================== */}
        {activeTab === "GRADING" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Pilih Ujian untuk Koreksi Esai
                </h2>
                <p className="text-xs text-slate-500">
                  Tinjau jawaban tertulis siswa dan berikan penilaian manual
                </p>
              </div>

              <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} ({ex.subject})
                  </option>
                ))}
              </select>
            </div>

            {loadingGrading ? (
              <div className="py-20 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
                <p className="text-xs text-slate-400">Memuat jawaban esai siswa...</p>
              </div>
            ) : gradingSubmissions.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <FileCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Tidak Ada Jawaban Esai Menunggu Koreksi
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ujian ini mungkin tidak memiliki soal esai atau belum ada siswa yang menyelesaikan ujian.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {gradingSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {sub.studentName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          NISN: {sub.studentNisn} • Kelas: {sub.studentClass}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Bobot Maksimal: <strong>{sub.maxWeight}</strong></span>
                      </div>
                    </div>

                    {/* Question Content */}
                    <div className="mb-3 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                      Pertanyaan Soal:
                    </div>
                    <div
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-800 dark:text-slate-200 mb-4"
                      dangerouslySetInnerHTML={{ __html: sub.questionContent }}
                    />

                    {/* Student Answer */}
                    <div className="mb-2 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                      Jawaban Siswa:
                    </div>
                    <div className="p-4 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-xs text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap mb-4">
                      {sub.essayAnswer}
                    </div>

                    {/* Grading Form */}
                    <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <label htmlFor={`score-${sub.id}`} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Beri Nilai (0 - {sub.maxWeight}):
                      </label>
                      <input
                        id={`score-${sub.id}`}
                        type="number"
                        step="0.5"
                        min="0"
                        max={sub.maxWeight}
                        value={essayScores[sub.id] ?? 0}
                        onChange={(e) =>
                          setEssayScores({
                            ...essayScores,
                            [sub.id]: Number(e.target.value),
                          })
                        }
                        className="w-20 px-3 py-1.5 text-xs font-bold text-center bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      />
                      <button
                        onClick={() => handleSaveEssayScore(sub.id, sub.maxWeight)}
                        disabled={savingGradeId === sub.id}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white transition-colors"
                      >
                        {savingGradeId === sub.id ? "Menyimpan..." : "Simpan Nilai"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: REKAPITULASI NILAI & EKSPOR CSV */}
        {/* ======================================================== */}
        {activeTab === "GRADES" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Rekapitulasi Hasil Ujian
                </h2>
                <p className="text-xs text-slate-500">
                  Laporan perolehan nilai siswa lengkap dengan kalkulasi KKM
                </p>
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.subject})
                    </option>
                  ))}
                </select>

                {selectedExamId && (
                  <a
                    href={`/api/teacher/grades/${selectedExamId}?format=csv`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh CSV / Excel
                  </a>
                )}
              </div>
            </div>

            {loadingGrades ? (
              <div className="py-20 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
                <p className="text-xs text-slate-400">Menyusun laporan nilai...</p>
              </div>
            ) : !gradeReport || gradeReport.grades?.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <Award className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Belum Ada Data Nilai
                </h3>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4">No</th>
                        <th className="py-3 px-4">NISN</th>
                        <th className="py-3 px-4">Nama Siswa</th>
                        <th className="py-3 px-4">Kelas</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Skor PG</th>
                        <th className="py-3 px-4 text-center">Nilai Akhir</th>
                        <th className="py-3 px-4 text-center">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {gradeReport.grades.map((st: any, idx: number) => (
                        <tr key={st.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                          <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{st.username}</td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{st.name}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{st.className}</td>
                          <td className="py-3 px-4">
                            {st.status === "SUBMITTED" ? (
                              <span className="text-[10px] font-bold text-emerald-600">Selesai</span>
                            ) : st.status === "IN_PROGRESS" ? (
                              <span className="text-[10px] font-bold text-amber-500">Mengerjakan</span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Belum Ikut</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                            {st.multipleChoiceScore !== null ? st.multipleChoiceScore : "-"}
                          </td>
                          <td className="py-3 px-4 text-center font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                            {st.finalScore !== null ? st.finalScore : "-"}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {st.isPassed === true ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                TUNTAS
                              </span>
                            ) : st.isPassed === false ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                REMEDIAL
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 4. MODAL BUAT BANK SOAL BARU */}
      {showNewBankModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Buat Bank Soal Baru
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Isi data paket bank soal untuk mata pelajaran terkait
            </p>

            <form onSubmit={handleCreateBank} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Mata Pelajaran
                </label>
                <select
                  value={bankForm.subjectId}
                  onChange={(e) => setBankForm({ ...bankForm, subjectId: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  required
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Kode Bank Soal (Unik)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: BNK-MAT-XI-2026"
                  value={bankForm.code}
                  onChange={(e) => setBankForm({ ...bankForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 text-xs font-mono uppercase bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Judul Bank Soal
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Soal Ujian Tengah Semester Matematika XI"
                  value={bankForm.title}
                  onChange={(e) => setBankForm({ ...bankForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Deskripsi / Catatan
                </label>
                <textarea
                  placeholder="Catatan tambahan untuk bank soal ini..."
                  value={bankForm.description}
                  onChange={(e) => setBankForm({ ...bankForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewBankModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={creatingBank}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                >
                  {creatingBank ? "Menyimpan..." : "Simpan Bank Soal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
