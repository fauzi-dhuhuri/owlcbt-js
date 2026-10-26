"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  FileText,
  Calendar,
  CheckCircle,
  Loader2,
  Sliders,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  Building,
  X,
} from "lucide-react";

export default function PrintAttendancePage() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters & Schedule Dynamic State
  const [selectedClass, setSelectedClass] = useState("ALL");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [roomName, setRoomName] = useState("LAB KOMPUTER 1");
  const [sessionName, setSessionName] = useState("SESI 1");
  const [sessionTime, setSessionTime] = useState("08.00 - 10.00 WIB");
  const [examDate, setExamDate] = useState(new Date().toISOString().slice(0, 10));
  const [schoolName, setSchoolName] = useState("SMA OWL NUSANTARA");

  // Pejabat & Petugas Inputs
  const [proctorName, setProctorName] = useState("Budi Santoso, S.Pd");
  const [proctorNip, setProctorNip] = useState("19820415 200801 1 012");
  const [supervisorName, setSupervisorName] = useState("Siti Rahmawati, M.Pd");
  const [supervisorNip, setSupervisorNip] = useState("19860920 201001 2 021");
  const [headmasterName, setHeadmasterName] = useState("Dr. Muhammad Fauzi, M.Pd");
  const [headmasterNip, setHeadmasterNip] = useState("19780512 200312 1 002");

  // Kehadiran manual override
  const [presentCount, setPresentCount] = useState<number | null>(null);
  const [absentCount, setAbsentCount] = useState<number>(0);

  useEffect(() => {
    async function loadData() {
      try {
        const [resStudents, resExams, resTeachers] = await Promise.all([
          fetch("/api/admin/students"),
          fetch("/api/proctor/exams"),
          fetch("/api/admin/teachers"),
        ]);

        const jsonStudents = await resStudents.json();
        const jsonExams = await resExams.json();
        const jsonTeachers = await resTeachers.json();

        setStudents(jsonStudents.students || []);
        setClasses(jsonStudents.classes || []);
        const loadedExams = jsonExams.exams || [];
        setExams(loadedExams);

        // Autofill proctor & supervisor if teachers list is available
        const teacherList = jsonTeachers.teachers || [];
        const foundProctor = teacherList.find((t: any) => t.role === "PROCTOR");
        const foundSupervisor = teacherList.find((t: any) => t.role === "TEACHER");
        if (foundProctor) {
          setProctorName(foundProctor.name);
          setProctorNip(foundProctor.username || "-");
        }
        if (foundSupervisor) {
          setSupervisorName(foundSupervisor.name);
          setSupervisorNip(foundSupervisor.username || "-");
        }

        if (loadedExams.length > 0) {
          const firstExam = loadedExams[0];
          setSelectedExamId(firstExam.id);
          applyExamSchedule(firstExam);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Update schedule details whenever selected exam changes
  const applyExamSchedule = (exam: any) => {
    if (!exam) return;

    if (exam.startTime) {
      const sDate = new Date(exam.startTime);
      setExamDate(sDate.toISOString().slice(0, 10));

      if (exam.endTime) {
        const eDate = new Date(exam.endTime);
        const sTime = sDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".");
        const eTime = eDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(":", ".");
        setSessionTime(`${sTime} - ${eTime} WIB`);
      }
    }
  };

  const handleSelectExam = (examId: string) => {
    setSelectedExamId(examId);
    const chosen = exams.find((e) => e.id === examId);
    if (chosen) {
      applyExamSchedule(chosen);
    }
  };

  const selectedExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  // Filter students based on selected class and exam target classes
  const filteredStudents = students.filter((s) => {
    // If specific class chosen in dropdown
    if (selectedClass !== "ALL") {
      return s.classId === selectedClass;
    }

    // If exam has target classes specified, restrict to those classes
    if (selectedExam?.targetClasses && selectedExam.targetClasses.length > 0) {
      const targetIds = selectedExam.targetClasses.map((c: any) => c.id);
      return targetIds.includes(s.classId);
    }

    return true;
  });

  const activePresentCount = presentCount !== null ? presentCount : filteredStudents.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 print:bg-white print:text-black">
      {/* 1. TOP BAR CONTROLS (Hidden on Print) */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        {/* Main Toolbar */}
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Back Link & Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/admin/students"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Kembali ke Data Siswa"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Cetak Daftar Hadir Peserta Ujian
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Presensi fisik meja ujian per ruang dan sesi (Sesuai Jadwal)
              </p>
            </div>
          </div>

          {/* Right: Quick Switcher, Exam & Class Dropdowns, Modal Button, Print Button */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Switcher */}
            <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <Link href="/admin/print/cards" className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                Kartu
              </Link>
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold">
                Daftar Hadir
              </span>
              <Link href="/admin/print/report" className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                Berita Acara
              </Link>
            </div>

            {/* Select Exam Dropdown */}
            <select
              value={selectedExamId}
              onChange={(e) => handleSelectExam(e.target.value)}
              className="max-w-[200px] sm:max-w-[240px] px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 truncate"
              title="Pilih Jadwal Ujian"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  [{ex.subject}] {ex.title}
                </option>
              ))}
            </select>

            {/* Select Class Dropdown */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="max-w-[130px] sm:max-w-[160px] px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 truncate"
              title="Target Kelas"
            >
              <option value="ALL">
                Semua ({filteredStudents.length} Siswa)
              </option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Kelas {c.name}
                </option>
              ))}
            </select>

            {/* Modal Trigger Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
              title="Atur Ruang, Sesi, dan Pejabat Ruangan"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Atur Pejabat &amp; Ruang</span>
              <span className="sm:hidden">Atur</span>
            </button>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition-all hover:scale-105 active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak ({filteredStudents.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MODAL PENGATURAN PEJABAT & RUANG (Hidden on Print) */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden animate-in fade-in duration-150"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Pengaturan Ruang &amp; Pejabat Ujian
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Data ini akan otomatis tercetak pada lembar daftar hadir
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Tutup Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Bagian 1: Pelaksanaan Ujian */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>1. Ruang &amp; Waktu Pelaksanaan</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Ruang / Laboratorium
                    </label>
                    <input
                      type="text"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value.toUpperCase())}
                      placeholder="Contoh: LAB KOMPUTER 1"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Sesi Pelaksanaan
                    </label>
                    <input
                      type="text"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value.toUpperCase())}
                      placeholder="Contoh: SESI 1"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Jam Pelaksanaan
                    </label>
                    <input
                      type="text"
                      value={sessionTime}
                      onChange={(e) => setSessionTime(e.target.value)}
                      placeholder="Contoh: 08.00 - 10.00 WIB"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tanggal Pelaksanaan
                    </label>
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 2: Pejabat Ruangan & Pengesahan */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>2. Pejabat Ruangan &amp; Pengesahan</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  {/* Proktor */}
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 block">
                      Proktor Ruangan
                    </span>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Nama &amp; Gelar</label>
                      <input
                        type="text"
                        value={proctorName}
                        onChange={(e) => setProctorName(e.target.value)}
                        placeholder="Nama Proktor"
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">NIP</label>
                      <input
                        type="text"
                        value={proctorNip}
                        onChange={(e) => setProctorNip(e.target.value)}
                        placeholder="NIP atau tanda -"
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Pengawas */}
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 block">
                      Pengawas Ruangan
                    </span>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Nama &amp; Gelar</label>
                      <input
                        type="text"
                        value={supervisorName}
                        onChange={(e) => setSupervisorName(e.target.value)}
                        placeholder="Nama Pengawas"
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">NIP</label>
                      <input
                        type="text"
                        value={supervisorNip}
                        onChange={(e) => setSupervisorNip(e.target.value)}
                        placeholder="NIP atau tanda -"
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Kepala Sekolah */}
                  <div className="space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 block">
                      Kepala Sekolah (Mengetahui)
                    </span>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Nama &amp; Gelar</label>
                      <input
                        type="text"
                        value={headmasterName}
                        onChange={(e) => setHeadmasterName(e.target.value)}
                        placeholder="Nama Kepala Sekolah"
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">NIP</label>
                      <input
                        type="text"
                        value={headmasterNip}
                        onChange={(e) => setHeadmasterNip(e.target.value)}
                        placeholder="NIP Kepala Sekolah"
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/80 dark:bg-slate-800/40">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition-all hover:scale-105 active:scale-95"
              >
                Selesai &amp; Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. PRINT SHEET CANVAS (A4 Format) */}
      <main className="max-w-4xl mx-auto my-6 p-8 bg-white text-slate-900 border border-slate-200 shadow-lg print:border-none print:shadow-none print:m-0 print:p-0 print:max-w-none text-xs">
        {/* Kop Surat Resmi */}
        <div className="border-b-4 border-double border-black pb-3 mb-4 text-center">
          <div className="font-extrabold text-base uppercase tracking-tight">
            DAFTAR HADIR PESERTA UJIAN BERBASIS KOMPUTER
          </div>
          <div className="font-bold text-sm uppercase">
            {schoolName} • TAHUN PELAJARAN 2026/2027
          </div>
          <div className="text-[11px] text-slate-600 print:text-black">
            Jl. Pendidikan No. 1, Jakarta • Telp. (021) 1234567 • info@owlcbt.edu
          </div>
        </div>

        {/* Informasi Ujian Header Matrix Sesuai Jadwal */}
        <div className="grid grid-cols-2 gap-2 text-[11px] mb-4 border border-black p-3 bg-slate-50 print:bg-transparent">
          <div className="space-y-1">
            <div className="flex">
              <span className="w-28 font-medium">Mata Pelajaran</span>
              <strong className="flex-1">: {selectedExam?.subject || "Matematika"}</strong>
            </div>
            <div className="flex">
              <span className="w-28 font-medium">Judul Ujian</span>
              <span className="flex-1">: {selectedExam?.title || "Ujian Sekolah"}</span>
            </div>
            <div className="flex">
              <span className="w-28 font-medium">Kelas Peserta</span>
              <span className="flex-1">
                : {selectedClass === "ALL" 
                    ? (selectedExam?.targetClasses?.length 
                        ? selectedExam.targetClasses.map((c: any) => c.name).join(", ") 
                        : "Seluruh Kelas Terdaftar")
                    : classes.find(c => c.id === selectedClass)?.name}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex">
              <span className="w-28 font-medium">Hari / Tanggal</span>
              <span className="flex-1">
                : {new Date(examDate).toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
            <div className="flex">
              <span className="w-28 font-medium">Ruang / Lab</span>
              <strong className="flex-1">: {roomName}</strong>
            </div>
            <div className="flex">
              <span className="w-28 font-medium">Sesi Ujian</span>
              <strong className="flex-1">: {sessionName} ({sessionTime})</strong>
            </div>
          </div>
        </div>

        {/* Tabel Presensi Siswa dengan Desain Tanda Tangan Zig-Zag Standar Resmi */}
        <table className="w-full border-collapse border border-black text-[11px] mb-6">
          <thead>
            <tr className="bg-slate-200 print:bg-slate-100 text-center font-bold">
              <th className="border border-black py-2.5 px-1.5 w-9">No</th>
              <th className="border border-black py-2.5 px-2 w-28">NISN / No Peserta</th>
              <th className="border border-black py-2.5 px-3 text-left">Nama Peserta Didik</th>
              <th className="border border-black py-2.5 px-2 w-24">Kelas</th>
              <th className="border border-black py-2.5 px-2 w-56 text-center" colSpan={2}>
                Tanda Tangan Peserta
              </th>
              <th className="border border-black py-2.5 px-2 w-16">Ket</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-black py-8 text-center text-slate-400">
                  Tidak ada peserta untuk jadwal dan filter kelas ini.
                </td>
              </tr>
            ) : (
              filteredStudents.map((s, idx) => {
                const isEven = (idx + 1) % 2 === 0;

                return (
                  <tr key={s.id} className="h-12">
                    <td className="border border-black text-center font-mono">{idx + 1}</td>
                    <td className="border border-black text-center font-mono font-bold">{s.username}</td>
                    <td className="border border-black px-3 uppercase font-medium truncate">{s.name}</td>
                    <td className="border border-black text-center font-semibold">{s.className}</td>

                    {/* Sub-Kolom Tanda Tangan Kiri (Ganjil: 1, 3, 5...) */}
                    <td className="border border-black w-28 px-2 py-1 align-top text-left">
                      {!isEven ? (
                        <div className="flex flex-col justify-between h-9">
                          <span className="text-[11px] font-bold text-black">{idx + 1}.</span>
                          <div className="w-full border-b border-dotted border-black mb-0.5"></div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-slate-50/50 print:bg-transparent" />
                      )}
                    </td>

                    {/* Sub-Kolom Tanda Tangan Kanan (Genap: 2, 4, 6...) */}
                    <td className="border border-black w-28 px-2 py-1 align-top text-left">
                      {isEven ? (
                        <div className="flex flex-col justify-between h-9">
                          <span className="text-[11px] font-bold text-black">{idx + 1}.</span>
                          <div className="w-full border-b border-dotted border-black mb-0.5"></div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-slate-50/50 print:bg-transparent" />
                      )}
                    </td>

                    <td className="border border-black text-center text-[10px] text-slate-500 print:text-black">
                      Hadir
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Rekapitulasi & Tanda Tangan Pejabat & Petugas */}
        <div className="space-y-6 pt-2">
          <div className="grid grid-cols-2 gap-4 text-[11px]">
            {/* Rekap Kehadiran Sesuai Jadwal */}
            <div className="border border-black p-3 space-y-1.5">
              <div className="font-bold mb-1 border-b border-black pb-1">REKAPITULASI KEHADIRAN:</div>
              <div className="flex justify-between">
                <span>Jumlah Peserta Terdaftar:</span>
                <strong>{filteredStudents.length} Orang</strong>
              </div>
              <div className="flex justify-between">
                <span>Jumlah Peserta Hadir:</span>
                <strong>{activePresentCount} Orang</strong>
              </div>
              <div className="flex justify-between">
                <span>Jumlah Peserta Tidak Hadir:</span>
                <strong>{absentCount} Orang</strong>
              </div>
            </div>

            {/* Tanda Tangan Proktor & Pengawas */}
            <div className="grid grid-cols-2 text-center text-[11px] gap-2">
              <div>
                <div>Pengawas Ruang Ujian,</div>
                <div className="h-16" />
                <div className="font-bold underline">{supervisorName}</div>
                <div className="text-[10px] text-slate-600 print:text-black">NIP. {supervisorNip || "-"}</div>
              </div>

              <div>
                <div>Proktor Ruang Ujian,</div>
                <div className="h-16" />
                <div className="font-bold underline">{proctorName}</div>
                <div className="text-[10px] text-slate-600 print:text-black">NIP. {proctorNip || "-"}</div>
              </div>
            </div>
          </div>

          {/* Mengetahui Kepala Sekolah */}
          <div className="text-center text-[11px] pt-2">
            <div>Mengetahui,</div>
            <div>Kepala Sekolah {schoolName},</div>
            <div className="h-16" />
            <div className="font-bold underline text-xs">{headmasterName}</div>
            <div className="text-[10px] text-slate-600 print:text-black">NIP. {headmasterNip || "-"}</div>
          </div>
        </div>
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            background: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}
