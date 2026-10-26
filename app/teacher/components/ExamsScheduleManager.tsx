"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Key,
  Shuffle,
  Eye,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  BookOpen,
  MonitorPlay,
  Layers,
  Sparkles,
  Loader2,
  Check,
  X,
  Copy,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

interface ExamItem {
  id: string;
  title: string;
  bankId: string;
  bankTitle: string;
  bankCode: string;
  subjectName: string;
  subjectCode: string;
  questionCount: number;
  token: string | null;
  durationMinutes: number;
  startTime: string;
  endTime: string;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  showResultImmediate: boolean;
  passingGrade: number | null;
  status: "DRAFT" | "SCHEDULED" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  classes: { id: string; name: string; level: string }[];
  totalSessions: number;
}

interface BankOption {
  id: string;
  title: string;
  code: string;
  subjectName: string;
  questionCount: number;
}

interface ClassOption {
  id: string;
  name: string;
  level: string;
  studentCount: number;
}

export default function ExamsScheduleManager() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [banks, setBanks] = useState<BankOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal State (Create & Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [savingExam, setSavingExam] = useState(false);

  // Form State
  const defaultStartTime = new Date();
  defaultStartTime.setMinutes(0, 0, 0);
  const defaultEndTime = new Date(defaultStartTime.getTime() + 4 * 60 * 60 * 1000); // +4 jam

  const formatDateTimeLocal = (date: Date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const [form, setForm] = useState({
    title: "",
    bankId: "",
    requireToken: true,
    token: "OWL789",
    durationMinutes: 90,
    startTime: formatDateTimeLocal(defaultStartTime),
    endTime: formatDateTimeLocal(defaultEndTime),
    randomizeQuestions: true,
    randomizeOptions: true,
    showResultImmediate: false,
    passingGrade: 75,
    status: "SCHEDULED" as "DRAFT" | "SCHEDULED" | "ACTIVE" | "COMPLETED" | "ARCHIVED",
    targetAllClasses: true,
    classIds: [] as string[],
  });

  // Notice alert
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/teacher/exams");
      const json = await res.json();
      setExams(json.exams || []);
      setBanks(json.banks || []);
      setClasses(json.classes || []);

      if (json.banks?.length > 0 && !form.bankId) {
        setForm((prev) => ({ ...prev, bankId: json.banks[0].id }));
      }
    } catch (err) {
      console.error("Gagal memuat jadwal ujian:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showModal) {
        setShowModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal]);

  // Quick Token Generator
  const generateNewToken = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let t = "OWL";
    for (let i = 0; i < 3; i++) {
      t += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return t;
  };

  // Open Modal for Create
  const handleOpenCreate = () => {
    setEditingExamId(null);
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const end = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    setForm({
      title: "",
      bankId: banks[0]?.id || "",
      requireToken: true,
      token: generateNewToken(),
      durationMinutes: 90,
      startTime: formatDateTimeLocal(now),
      endTime: formatDateTimeLocal(end),
      randomizeQuestions: true,
      randomizeOptions: true,
      showResultImmediate: false,
      passingGrade: 75,
      status: "SCHEDULED",
      targetAllClasses: true,
      classIds: [],
    });
    setShowModal(true);
  };

  // Open Modal for Edit
  const handleOpenEdit = (exam: ExamItem) => {
    setEditingExamId(exam.id);
    const assignedClassIds = exam.classes.map((c) => c.id);

    setForm({
      title: exam.title,
      bankId: exam.bankId,
      requireToken: !!exam.token,
      token: exam.token || generateNewToken(),
      durationMinutes: exam.durationMinutes,
      startTime: formatDateTimeLocal(new Date(exam.startTime)),
      endTime: formatDateTimeLocal(new Date(exam.endTime)),
      randomizeQuestions: exam.randomizeQuestions,
      randomizeOptions: exam.randomizeOptions,
      showResultImmediate: exam.showResultImmediate,
      passingGrade: exam.passingGrade ?? 75,
      status: exam.status,
      targetAllClasses: assignedClassIds.length === 0,
      classIds: assignedClassIds,
    });
    setShowModal(true);
  };

  // Toggle Kelas Checkbox
  const handleToggleClass = (classId: string) => {
    setForm((prev) => {
      const exists = prev.classIds.includes(classId);
      const nextIds = exists
        ? prev.classIds.filter((id) => id !== classId)
        : [...prev.classIds, classId];
      return { ...prev, classIds: nextIds };
    });
  };

  // Select / Unselect All Classes
  const handleToggleAllClasses = () => {
    if (form.classIds.length === classes.length) {
      setForm((prev) => ({ ...prev, classIds: [] }));
    } else {
      setForm((prev) => ({ ...prev, classIds: classes.map((c) => c.id) }));
    }
  };

  // Submit Save Exam (Create / Edit)
  const handleSubmitExam = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi Tanggal
    const startDate = new Date(form.startTime);
    const endDate = new Date(form.endTime);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      alert("Format tanggal dan jam pelaksanaan ujian tidak valid.");
      return;
    }

    if (endDate <= startDate) {
      alert("Waktu batas selesai harus lebih besar daripada waktu mulai akses ujian.");
      return;
    }

    setSavingExam(true);

    try {
      const payload = {
        id: editingExamId,
        title: form.title.trim(),
        bankId: form.bankId,
        token: form.requireToken ? form.token.trim().toUpperCase() : null,
        durationMinutes: form.durationMinutes,
        startTime: form.startTime,
        endTime: form.endTime,
        randomizeQuestions: form.randomizeQuestions,
        randomizeOptions: form.randomizeOptions,
        showResultImmediate: form.showResultImmediate,
        passingGrade: form.passingGrade,
        status: form.status,
        classIds: form.targetAllClasses ? [] : form.classIds,
      };

      const res = await fetch("/api/teacher/exams", {
        method: editingExamId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan jadwal ujian");

      setNotice({
        type: "success",
        text: editingExamId
          ? "Pengaturan jadwal ujian berhasil diperbarui!"
          : "Jadwal ujian baru berhasil dibuat dan dijadwalkan!",
      });

      setShowModal(false);
      fetchData();
      setTimeout(() => setNotice(null), 3500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingExam(false);
    }
  };


  // Delete Exam
  const handleDeleteExam = async (id: string, title: string) => {
    if (!confirm(`Yakin ingin menghapus jadwal ujian "${title}"? Seluruh sesi dan jawaban ujian yang terkait akan dihapus.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/teacher/exams?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus ujian");

      setNotice({ type: "success", text: `Jadwal "${title}" berhasil dihapus.` });
      fetchData();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Fast Status Switcher
  const handleQuickStatusChange = async (id: string, nextStatus: string) => {
    try {
      const res = await fetch("/api/teacher/exams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "TOGGLE_STATUS", status: nextStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengubah status ujian");

      setNotice({ type: "success", text: `Status ujian berhasil diubah ke ${nextStatus}` });
      fetchData();
      setTimeout(() => setNotice(null), 2500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Quick Regenerate Token
  const handleQuickRegenerateToken = async (id: string) => {
    try {
      const res = await fetch("/api/teacher/exams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "REGENERATE_TOKEN" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat token baru");

      setNotice({ type: "success", text: `Token berhasil diperbarui: ${json.token}` });
      fetchData();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Filtered Exams
  const filteredExams = exams.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.bankCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" ? true : e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = exams.filter((e) => e.status === "ACTIVE").length;
  const scheduledCount = exams.filter((e) => e.status === "SCHEDULED").length;
  const completedCount = exams.filter((e) => e.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      {/* Alert Notice */}
      {notice && (
        <div
          className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
            notice.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
          }`}
        >
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{notice.text}</span>
        </div>
      )}

      {/* 1. HEADER & ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <span>Jadwal &amp; Pengaturan Ujian</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
              {exams.length} Ujian
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Atur waktu ujian, durasi menit, token dinamis, acak soal &amp; opsi, serta pembatasan kelas peserta.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Buat Jadwal Ujian Baru
        </button>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{exams.length}</div>
            <div className="text-[11px] font-semibold text-slate-500">Total Jadwal</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <MonitorPlay className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{activeCount}</div>
            <div className="text-[11px] font-semibold text-slate-500">Sedang Aktif (Live)</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-blue-600 dark:text-blue-400">{scheduledCount}</div>
            <div className="text-[11px] font-semibold text-slate-500">Terjadwal</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center font-bold">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-lg font-black text-slate-900 dark:text-white">{completedCount}</div>
            <div className="text-[11px] font-semibold text-slate-500">Selesai</div>
          </div>
        </div>
      </div>

      {/* 3. FILTER & SEARCH */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <input
          type="text"
          placeholder="Cari berdasarkan nama ujian, mapel, atau kode bank soal..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:w-96 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif (Live)</option>
            <option value="SCHEDULED">Terjadwal</option>
            <option value="DRAFT">Draft</option>
            <option value="COMPLETED">Selesai</option>
            <option value="ARCHIVED">Diarsipkan</option>
          </select>
        </div>
      </div>

      {/* 4. EXAMS LIST */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
          <p className="text-xs">Memuat data jadwal ujian...</p>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8">
          <Calendar className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Belum Ada Jadwal Ujian
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Buat jadwal ujian baru untuk menghubungkan bank soal dengan kelas peserta dan mengatur waktu ujian.
          </p>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="w-4 h-4" />
            Buat Jadwal Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExams.map((exam) => {
            const startDate = new Date(exam.startTime);
            const endDate = new Date(exam.endTime);

            return (
              <div
                key={exam.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                {/* Left: Info Ujian */}
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        exam.status === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60 animate-pulse"
                          : exam.status === "SCHEDULED"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                          : exam.status === "COMPLETED"
                          ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                      }`}
                    >
                      {exam.status === "ACTIVE"
                        ? "● AKTIF (LIVE)"
                        : exam.status === "SCHEDULED"
                        ? "TERJADWAL"
                        : exam.status === "COMPLETED"
                        ? "SELESAI"
                        : "DRAFT"}
                    </span>

                    {/* Subject badge */}
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                      {exam.subjectName}
                    </span>

                    {/* Bank Soal badge */}
                    <span className="text-xs text-slate-500 font-medium">
                      Bank: <strong className="text-slate-700 dark:text-slate-300">{exam.bankTitle}</strong> ({exam.questionCount} Soal)
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {exam.title}
                  </h3>

                  {/* Meta Details Pills */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.durationMinutes} Menit</span>
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {startDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}{" "}
                        {startDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        {" - "}
                        {endDate.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}{" "}
                        {endDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </span>

                    {/* Token */}
                    <span className="flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-amber-500" />
                      {exam.token ? (
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800/60">
                          {exam.token}
                        </span>
                      ) : (
                        <span className="text-slate-400">Tanpa Token</span>
                      )}
                      {exam.token && (
                        <button
                          onClick={() => handleQuickRegenerateToken(exam.id)}
                          title="Generate Token Baru"
                          className="p-1 text-slate-400 hover:text-amber-600 transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      )}
                    </span>

                    {/* Sesi Peserta */}
                    <span className="flex items-center gap-1 text-slate-500">
                      <Users className="w-3.5 h-3.5" />
                      <span>{exam.totalSessions} Peserta Telah Mulai</span>
                    </span>
                  </div>

                  {/* Settings badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    <span className={`px-2 py-0.5 rounded-md font-semibold ${exam.randomizeQuestions ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                      Acak Soal: {exam.randomizeQuestions ? "ON" : "OFF"}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-semibold ${exam.randomizeOptions ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                      Acak Opsi: {exam.randomizeOptions ? "ON" : "OFF"}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md font-semibold ${exam.showResultImmediate ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                      Skor Instan: {exam.showResultImmediate ? "ON" : "OFF"}
                    </span>
                    {exam.passingGrade && (
                      <span className="px-2 py-0.5 rounded-md font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
                        KKM: {exam.passingGrade}
                      </span>
                    )}

                    {/* Assigned Classes */}
                    <div className="flex items-center gap-1 ml-auto">
                      <span className="text-slate-400 font-semibold">Kelas:</span>
                      {exam.classes.length === 0 ? (
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold">
                          Semua Kelas
                        </span>
                      ) : (
                        exam.classes.map((c) => (
                          <span
                            key={c.id}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                          >
                            {c.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex lg:flex-col items-center lg:items-end justify-between gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                  {/* Status Toggle Dropdown / Buttons */}
                  <div className="flex items-center gap-1.5">
                    {exam.status !== "ACTIVE" && (
                      <button
                        onClick={() => handleQuickStatusChange(exam.id, "ACTIVE")}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
                        title="Aktifkan Ujian Sekarang"
                      >
                        Aktifkan
                      </button>
                    )}
                    {exam.status === "ACTIVE" && (
                      <button
                        onClick={() => handleQuickStatusChange(exam.id, "COMPLETED")}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-800 text-white shadow-sm transition-all"
                        title="Tutup & Selesaikan Ujian"
                      >
                        Selesaikan
                      </button>
                    )}
                    <Link
                      href="/proctor"
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 transition-colors"
                      title="Buka Ruang Monitor Proktor"
                    >
                      Monitor
                    </Link>
                  </div>

                  {/* Edit & Delete */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(exam)}
                      className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Pengaturan Ujian"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteExam(exam.id, exam.title)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Hapus Jadwal Ujian"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL FORM: BUAT / EDIT PENGATURAN JADWAL UJIAN       */}
      {/* ======================================================== */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* 1. Fixed Sticky Header */}
            <div className="flex-none px-6 py-4 sm:px-7 sm:py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>{editingExamId ? "Edit Pengaturan Jadwal Ujian" : "Buat Jadwal Ujian Baru"}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tentukan waktu, durasi, kelas target, serta aturan keamanan ujian.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Tutup (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. Scrollable Form Body */}
            <form id="exam-schedule-form" onSubmit={handleSubmitExam} className="flex-1 overflow-y-auto px-6 py-5 sm:px-7 sm:py-6 space-y-5 text-xs custom-scrollbar">
              {/* SECTION A: JUDUL & BANK SOAL */}
              <div className="space-y-3.5">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Judul Ujian <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Penilaian Akhir Semester Ganjil 2026/2027"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Pilih Bank Soal <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={form.bankId}
                      onChange={(e) => setForm({ ...form, bankId: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {banks.length === 0 ? (
                        <option value="">Belum ada bank soal tersedia</option>
                      ) : (
                        banks.map((b) => (
                          <option key={b.id} value={b.id}>
                            [{b.code}] {b.title} — {b.subjectName} ({b.questionCount} Soal)
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {editingExamId ? "Status Ujian" : "Status Awal"}
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    >
                      <option value="SCHEDULED">SCHEDULED (Terjadwal)</option>
                      <option value="ACTIVE">ACTIVE (Sedang Berjalan / Aktif)</option>
                      <option value="DRAFT">DRAFT (Disimpan Dulu)</option>
                      {editingExamId && (
                        <>
                          <option value="COMPLETED">COMPLETED (Selesai)</option>
                          <option value="ARCHIVED">ARCHIVED (Diarsipkan)</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION B: WAKTU & DURASI */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Jadwal Pelaksanaan &amp; Durasi Pengerjaan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Waktu Mulai Akses</label>
                    <input
                      type="datetime-local"
                      required
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Waktu Batas Selesai</label>
                    <input
                      type="datetime-local"
                      required
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-500 font-semibold">
                      Durasi Ujian Siswa (Menit): <strong className="text-indigo-600">{form.durationMinutes} Menit</strong>
                    </label>
                    <div className="flex items-center gap-1">
                      {[45, 60, 90, 120].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setForm({ ...form, durationMinutes: mins })}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                            form.durationMinutes === mins
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    min={5}
                    max={360}
                    required
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: parseInt(e.target.value, 10) || 60 })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* SECTION C: KELAS TARGET */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Target Peserta Ujian (Kelas)</span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-indigo-600 dark:text-indigo-400">
                    <input
                      type="checkbox"
                      checked={form.targetAllClasses}
                      onChange={(e) => setForm({ ...form, targetAllClasses: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <span>Buka untuk Seluruh Kelas</span>
                  </label>
                </div>

                {!form.targetAllClasses && (
                  <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Pilih kelas yang berhak login ke ujian ini:</span>
                      <button
                        type="button"
                        onClick={handleToggleAllClasses}
                        className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                      >
                        {form.classIds.length === classes.length ? "Batal Semua" : "Pilih Semua Kelas"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-1">
                      {classes.map((cls) => {
                        const isSelected = form.classIds.includes(cls.id);
                        return (
                          <button
                            key={cls.id}
                            type="button"
                            onClick={() => handleToggleClass(cls.id)}
                            className={`p-2 rounded-xl text-left border flex items-center justify-between transition-all ${
                              isSelected
                                ? "bg-indigo-50 dark:bg-indigo-950/50 border-indigo-500 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                            }`}
                          >
                            <span>{cls.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              {cls.studentCount} ssw
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION D: KEAMANAN & PENGATURAN INTEGRITAS */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-500" />
                  <span>Token &amp; Aturan Pengerjaan</span>
                </div>

                {/* Token */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.requireToken}
                      onChange={(e) => setForm({ ...form, requireToken: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <span>Wajibkan Token Ujian</span>
                  </label>

                  {form.requireToken && (
                    <div className="flex items-center gap-2 ml-auto">
                      <input
                        type="text"
                        maxLength={8}
                        value={form.token}
                        onChange={(e) => setForm({ ...form, token: e.target.value.toUpperCase() })}
                        className="w-28 px-3 py-1.5 font-mono font-bold text-center uppercase bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-amber-700 dark:text-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, token: generateNewToken() })}
                        className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 font-semibold"
                        title="Acak Token Baru"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <label className="flex items-center gap-2.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.randomizeQuestions}
                      onChange={(e) => setForm({ ...form, randomizeQuestions: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <span>Acak Susunan Soal per Siswa</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.randomizeOptions}
                      onChange={(e) => setForm({ ...form, randomizeOptions: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <span>Acak Opsi Pilihan Ganda</span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.showResultImmediate}
                      onChange={(e) => setForm({ ...form, showResultImmediate: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600"
                    />
                    <span>Tampilkan Nilai Langsung</span>
                  </label>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">KKM / Batas Tuntas:</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={form.passingGrade}
                      onChange={(e) => setForm({ ...form, passingGrade: parseFloat(e.target.value) || 75 })}
                      className="w-16 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-bold"
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* 3. Fixed Sticky Footer (Always in Viewport!) */}
            <div className="flex-none px-6 py-4 sm:px-7 sm:py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm flex items-center justify-between gap-3 z-10">
              <div className="text-[11px] text-slate-500">
                {editingExamId ? (
                  <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    Mode Edit Pengaturan Jadwal
                  </span>
                ) : (
                  <span className="text-slate-400">Jadwal baru akan langsung terdaftar</span>
                )}
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  form="exam-schedule-form"
                  disabled={savingExam}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white shadow-md shadow-indigo-600/25 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {savingExam && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{savingExam ? "Menyimpan..." : editingExamId ? "Simpan Perubahan" : "Buat Jadwal Ujian"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
