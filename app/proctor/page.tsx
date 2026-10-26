"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Monitor,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  MoreVertical,
  Unlock,
  PlusCircle,
  StopCircle,
  FileText,
  X,
  ChevronDown,
  Sparkles,
  Loader2,
  Check,
} from "lucide-react";

interface StudentMonitor {
  id: string;
  name: string;
  username: string;
  className: string;
  sessionId?: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "SUBMITTED" | "FORCE_STOPPED";
  answeredCount: number;
  doubtfulCount: number;
  violationsCount: number;
  finalScore?: number | null;
  remainingSeconds: number;
  startedAt?: string | null;
  submittedAt?: string | null;
  violationLogs: Array<{ action: string; message: string; timestamp: string }>;
}

export default function ProctorDashboardPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [loadingExams, setLoadingExams] = useState(true);

  // Monitoring data
  const [monitoringData, setMonitoringData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [classFilter, setClassFilter] = useState<string>("ALL");

  // Selected student for details/violation drawer
  const [selectedStudent, setSelectedStudent] = useState<StudentMonitor | null>(null);

  // Action status message
  const [actionNotice, setActionNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 1. Fetch available exams list
  useEffect(() => {
    async function loadExams() {
      try {
        const res = await fetch("/api/proctor/exams");
        if (!res.ok) throw new Error("Gagal mengambil daftar ujian");
        const json = await res.json();
        setExams(json.exams || []);

        if (json.exams && json.exams.length > 0) {
          setSelectedExamId(json.exams[0].id);
        }
      } catch (err) {
        console.error("Error loading exams:", err);
      } finally {
        setLoadingExams(false);
      }
    }

    loadExams();
  }, []);

  // 2. Fetch Monitoring Data for Selected Exam
  const fetchMonitoring = useCallback(async () => {
    if (!selectedExamId) return;
    try {
      setLoadingData(true);
      const res = await fetch(`/api/proctor/${selectedExamId}/monitoring`);
      if (!res.ok) throw new Error("Gagal memuat data monitoring");
      const json = await res.json();
      setMonitoringData(json);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Error fetching monitoring data:", err);
    } finally {
      setLoadingData(false);
    }
  }, [selectedExamId]);

  useEffect(() => {
    fetchMonitoring();
  }, [fetchMonitoring]);

  // 3. Auto-refresh polling every 5 seconds
  useEffect(() => {
    if (!autoRefresh || !selectedExamId) return;

    const interval = setInterval(() => {
      fetchMonitoring();
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, selectedExamId, fetchMonitoring]);

  // 4. Proctor Actions Handlers
  const handleProctorAction = async (action: string, studentId?: string, extraMinutes?: number) => {
    if (!selectedExamId) return;

    try {
      const res = await fetch(`/api/proctor/${selectedExamId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, studentId, extraMinutes }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Aksi gagal dijalankan");
      }

      setActionNotice({ type: "success", text: json.message || "Aksi berhasil diproses!" });
      fetchMonitoring();

      setTimeout(() => setActionNotice(null), 4000);
    } catch (err: any) {
      setActionNotice({ type: "error", text: err.message });
      setTimeout(() => setActionNotice(null), 5000);
    }
  };

  // Filter students
  const students: StudentMonitor[] = monitoringData?.students || [];
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.username.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "VIOLATION"
        ? s.violationsCount > 0
        : s.status === statusFilter;

    const matchesClass =
      classFilter === "ALL" ? true : s.className === classFilter;

    return matchesSearch && matchesStatus && matchesClass;
  });

  // Extract unique classes for filter dropdown
  const uniqueClasses = Array.from(new Set(students.map((s) => s.className)));

  const stats = monitoringData?.stats || {
    totalStudents: 0,
    inProgressCount: 0,
    submittedCount: 0,
    notStartedCount: 0,
    totalViolations: 0,
  };

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Pengawasan Ujian</span>
          <span className="text-slate-400">/</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">Monitoring Peserta Live</span>
          <span className="ml-2 hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Live Sync
          </span>
        </div>

        {/* Right Controls: Auto-refresh & Sync */}
        <div className="flex items-center gap-2.5">
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              autoRefresh
                ? "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh && loadingData ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Auto-Sync (5s): {autoRefresh ? "Aktif" : "Mati"}</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={fetchMonitoring}
            disabled={loadingData}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
            title="Segarkan Data Sekarang"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      {/* Action Notice Alert */}
      {actionNotice && (
        <div
          className={`px-4 py-2.5 text-xs font-medium text-center flex items-center justify-center gap-2 ${
            actionNotice.type === "success"
              ? "bg-emerald-600 text-white"
              : "bg-rose-600 text-white"
          }`}
        >
          {actionNotice.type === "success" ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{actionNotice.text}</span>
        </div>
      )}

      {/* 2. MAIN PROCTOR WORKSPACE */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Top Control Bar: Select Exam & Token Control Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Exam Selector */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Pilih Jadwal Ujian Aktif
              </span>
              <div className="mt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.subject} • {ex.durationMinutes} Menit)
                    </option>
                  ))}
                </select>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Update terakhir: {lastRefreshed.toLocaleTimeString()}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <div>Mata Pelajaran: <strong className="text-slate-900 dark:text-white">{monitoringData?.exam?.subject || "-"}</strong></div>
              <div>Alokasi Waktu: <strong className="text-slate-900 dark:text-white">{monitoringData?.exam?.durationMinutes || 0} Menit</strong></div>
              <div>Total Soal: <strong className="text-slate-900 dark:text-white">{monitoringData?.exam?.totalQuestions || 0} Butir</strong></div>
            </div>
          </div>

          {/* Token Card */}
          <div className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-3xl p-5 sm:p-6 shadow-lg shadow-violet-600/10 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-violet-200 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" /> Token Ujian Saat Ini
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-mono">
                Wajib untuk Masuk
              </span>
            </div>

            <div className="my-2 flex items-baseline justify-between">
              <div className="font-mono text-3xl sm:text-4xl font-extrabold tracking-widest">
                {monitoringData?.exam?.token || "BELUM DIATUR"}
              </div>
            </div>

            <button
              onClick={() => handleProctorAction("REGENERATE_TOKEN")}
              className="w-full mt-2 py-2 px-3.5 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 border border-white/20 transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Generate Token Baru
            </button>
          </div>
        </div>

        {/* 3. METRIC STATISTICS SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Total Peserta</span>
              <Users className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {stats.totalStudents}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-amber-500 mb-1">
              <span className="text-xs font-medium">Sedang Ujian</span>
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
              {stats.inProgressCount}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-emerald-500 mb-1">
              <span className="text-xs font-medium">Selesai</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats.submittedCount}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs font-medium">Belum Masuk</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold text-slate-500">
              {stats.notStartedCount}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-rose-500 mb-1">
              <span className="text-xs font-medium">Pelanggaran</span>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
              {stats.totalViolations}
            </div>
          </div>
        </div>

        {/* 4. SEARCH & FILTER TOOLBAR */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari nama atau NISN siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 dark:text-white"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">Semua Status</option>
              <option value="IN_PROGRESS">Sedang Mengerjakan</option>
              <option value="SUBMITTED">Selesai</option>
              <option value="NOT_STARTED">Belum Masuk</option>
              <option value="VIOLATION">Ada Pelanggaran</option>
            </select>

            {/* Class Filter */}
            {uniqueClasses.length > 1 && (
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">Semua Kelas</option>
                {uniqueClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* 5. STUDENTS LIVE MONITORING TABLE */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">No</th>
                  <th className="py-3.5 px-4">Peserta Siswa</th>
                  <th className="py-3.5 px-4">Kelas</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Progres Soal</th>
                  <th className="py-3.5 px-4">Sisa Waktu</th>
                  <th className="py-3.5 px-4">Pelanggaran</th>
                  <th className="py-3.5 px-4 text-center">Aksi Proktor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Tidak ada peserta yang cocok dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st, index) => {
                    const totalQ = monitoringData?.exam?.totalQuestions || 1;
                    const percentAnswered = Math.round((st.answeredCount / totalQ) * 100);

                    // Timer calculation
                    const mins = Math.floor(st.remainingSeconds / 60);
                    const secs = st.remainingSeconds % 60;
                    const timerText = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

                    return (
                      <tr
                        key={st.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-slate-400">{index + 1}</td>

                        {/* Student Name & NISN */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {st.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            NISN: {st.username}
                          </div>
                        </td>

                        {/* Class */}
                        <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-300">
                          {st.className}
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4">
                          {st.status === "IN_PROGRESS" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                              Mengerjakan
                            </span>
                          ) : st.status === "SUBMITTED" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              Selesai {st.finalScore !== null && st.finalScore !== undefined ? `(${st.finalScore})` : ""}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                              Belum Masuk
                            </span>
                          )}
                        </td>

                        {/* Progress Bar */}
                        <td className="py-3 px-4">
                          {st.status !== "NOT_STARTED" ? (
                            <div className="w-32">
                              <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                <span>{st.answeredCount} / {totalQ} Soal</span>
                                {st.doubtfulCount > 0 && (
                                  <span className="text-amber-500">({st.doubtfulCount} ragu)</span>
                                )}
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all"
                                  style={{ width: `${percentAnswered}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Remaining Time */}
                        <td className="py-3 px-4 font-mono text-xs">
                          {st.status === "IN_PROGRESS" ? (
                            <span className={st.remainingSeconds < 300 ? "text-rose-600 font-bold" : "text-slate-700 dark:text-slate-300 font-semibold"}>
                              {timerText}
                            </span>
                          ) : st.status === "SUBMITTED" ? (
                            <span className="text-slate-400 text-[10px]">Telah Diserahkan</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>

                        {/* Violation Indicator */}
                        <td className="py-3 px-4">
                          {st.violationsCount > 0 ? (
                            <button
                              onClick={() => setSelectedStudent(st)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 hover:scale-105 transition-transform"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              {st.violationsCount} Pelanggaran
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[10px]">Bersih</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Unlock / Reset Login */}
                            <button
                              onClick={() => handleProctorAction("RESET_SESSION", st.id)}
                              title="Buka Kunci / Izinkan Login Kembali"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>

                            {/* Add +10 Mins */}
                            {st.status === "IN_PROGRESS" && (
                              <button
                                onClick={() => handleProctorAction("ADD_TIME", st.id, 10)}
                                title="Beri Tambahan Waktu +10 Menit"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                              >
                                <PlusCircle className="w-4 h-4" />
                              </button>
                            )}

                            {/* Force Submit */}
                            {st.status === "IN_PROGRESS" && (
                              <button
                                onClick={() => {
                                  if (confirm(`Yakin ingin menghentikan dan menyerahkan ujian atas nama ${st.name}?`)) {
                                    handleProctorAction("FORCE_SUBMIT", st.id);
                                  }
                                }}
                                title="Paksa Selesai & Serahkan Ujian"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                              >
                                <StopCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 6. SLIDE-OVER DRAWER FOR STUDENT VIOLATION AUDIT */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                  <ShieldAlert className="w-5 h-5" />
                  Audit Pelanggaran Layar
                </div>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Student Info */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl my-4 text-xs">
                <div className="font-bold text-sm text-slate-900 dark:text-white">
                  {selectedStudent.name}
                </div>
                <div className="text-slate-500">
                  NISN: {selectedStudent.username} • Kelas: {selectedStudent.className}
                </div>
                <div className="mt-2 text-rose-600 font-semibold">
                  Total Pelanggaran Terdeteksi: {selectedStudent.violationsCount} kali
                </div>
              </div>

              {/* Log Timeline */}
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Rekaman Log Aktivitas
              </h4>
              <div className="space-y-3">
                {selectedStudent.violationLogs.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Belum ada rincian log teks.</p>
                ) : (
                  selectedStudent.violationLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/40 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <div className="flex justify-between items-center font-bold text-rose-700 dark:text-rose-400 mb-1">
                        <span>{log.action}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400">{log.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedStudent(null)}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
