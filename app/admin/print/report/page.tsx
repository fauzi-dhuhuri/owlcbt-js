"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  FileCheck,
  Calendar,
  Loader2,
  Sliders,
  ChevronDown,
  ChevronUp,
  User,
  Building,
  Clock,
  X,
} from "lucide-react";

export default function PrintExamReportPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Fields & Schedule Dynamic State
  const [selectedExamId, setSelectedExamId] = useState("");
  const [schoolName, setSchoolName] = useState("SMA OWL NUSANTARA");
  const [roomName, setRoomName] = useState("LABORATORIUM KOMPUTER 1");
  const [sessionName, setSessionName] = useState("SESI 1");
  const [examDate, setExamDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("10:00");

  // Peserta Counts
  const [expectedCount, setExpectedCount] = useState<number>(30);
  const [presentCount, setPresentCount] = useState<number>(30);
  const [absentNotes, setAbsentNotes] = useState("-");
  const [notes, setNotes] = useState("Pelaksanaan ujian berlangsung tertib, lancar, dan aman terkendali.");

  // Pejabat & Petugas Inputs
  const [proctorName, setProctorName] = useState("Budi Santoso, S.Pd");
  const [proctorNip, setProctorNip] = useState("19820415 200801 1 012");
  const [supervisorName, setSupervisorName] = useState("Siti Rahmawati, M.Pd");
  const [supervisorNip, setSupervisorNip] = useState("19860920 201001 2 021");
  const [headmasterName, setHeadmasterName] = useState("Dr. Muhammad Fauzi, M.Pd");
  const [headmasterNip, setHeadmasterNip] = useState("19780512 200312 1 002");

  useEffect(() => {
    async function loadData() {
      try {
        const [resExams, resStudents, resTeachers] = await Promise.all([
          fetch("/api/proctor/exams"),
          fetch("/api/admin/students"),
          fetch("/api/admin/teachers"),
        ]);

        const jsonExams = await resExams.json();
        const jsonStudents = await resStudents.json();
        const jsonTeachers = await resTeachers.json();

        const loadedExams = jsonExams.exams || [];
        const loadedStudents = jsonStudents.students || [];
        setExams(loadedExams);
        setStudents(loadedStudents);

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
          applyExamSchedule(firstExam, loadedStudents);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const applyExamSchedule = (exam: any, studentList: any[]) => {
    if (!exam) return;

    if (exam.startTime) {
      const sDate = new Date(exam.startTime);
      setExamDate(sDate.toISOString().slice(0, 10));
      setStartTime(sDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));

      if (exam.endTime) {
        const eDate = new Date(exam.endTime);
        setEndTime(eDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
      }
    }

    // Hitung jumlah siswa sesuai target kelas jadwal
    let matchingStudentsCount = studentList.length;
    if (exam.targetClasses && exam.targetClasses.length > 0) {
      const targetIds = exam.targetClasses.map((c: any) => c.id);
      const filtered = studentList.filter((s: any) => targetIds.includes(s.classId));
      matchingStudentsCount = filtered.length;
    }

    setExpectedCount(matchingStudentsCount);
    setPresentCount(matchingStudentsCount);
  };

  const handleSelectExam = (examId: string) => {
    setSelectedExamId(examId);
    const chosen = exams.find((e) => e.id === examId);
    if (chosen) {
      applyExamSchedule(chosen, students);
    }
  };

  const selectedExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const dateObj = new Date(examDate);
  const dayName = dateObj.toLocaleDateString("id-ID", { weekday: "long" });
  const fullDate = dateObj.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

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
                <FileCheck className="w-4 h-4 text-violet-600" />
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Cetak Berita Acara Ujian
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Dokumen berita acara resmi pelaksanaan ujian di lab (Sesuai Jadwal)
              </p>
            </div>
          </div>

          {/* Right: Quick Switcher, Exam Dropdown, Modal Button, Print Button */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Switcher */}
            <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <Link href="/admin/print/cards" className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                Kartu
              </Link>
              <Link href="/admin/print/attendance" className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
                Daftar Hadir
              </Link>
              <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-xs font-bold">
                Berita Acara
              </span>
            </div>

            {/* Select Exam Dropdown */}
            <select
              value={selectedExamId}
              onChange={(e) => handleSelectExam(e.target.value)}
              className="max-w-[200px] sm:max-w-[260px] px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 truncate"
              title="Pilih Jadwal Ujian"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  [{ex.subject}] {ex.title}
                </option>
              ))}
            </select>

            {/* Modal Trigger Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-colors"
              title="Atur Ruang, Sesi, Kehadiran, dan Pejabat Ruangan"
            >
              <Sliders className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              <span className="hidden sm:inline">Atur Rincian &amp; Pejabat</span>
              <span className="sm:hidden">Atur</span>
            </button>

            {/* Print Button */}
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/25 transition-all hover:scale-105 active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Berita Acara</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MODAL PENGATURAN RINCIAN & PEJABAT (Hidden on Print) */}
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
                <div className="w-9 h-9 rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Pengaturan Rincian &amp; Pejabat Berita Acara
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Data pelaksanaan, kehadiran peserta, serta pejabat ruangan
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
              {/* Bagian 1: Ruang, Sesi, & Waktu */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400 mb-3 flex items-center gap-2">
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
                      placeholder="LABORATORIUM KOMPUTER 1"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Sesi Ujian
                    </label>
                    <input
                      type="text"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value.toUpperCase())}
                      placeholder="SESI 1"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Waktu Pelaksanaan (Mulai - Selesai)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        placeholder="08:00"
                        className="w-24 px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-center font-medium"
                      />
                      <span className="text-slate-400">s.d.</span>
                      <input
                        type="text"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        placeholder="10:00"
                        className="w-24 px-2.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-center font-medium"
                      />
                      <span className="font-semibold text-slate-500 text-xs">WIB</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tanggal Pelaksanaan
                    </label>
                    <input
                      type="date"
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                </div>
              </div>

              {/* Bagian 2: Kehadiran Peserta */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>2. Data Kehadiran Peserta &amp; Catatan Khusus</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs mb-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Jumlah Seharusnya
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={expectedCount}
                      onChange={(e) => setExpectedCount(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-indigo-600 dark:text-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Jumlah yang Hadir
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={presentCount}
                      onChange={(e) => setPresentCount(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-emerald-600 dark:text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Peserta Tidak Hadir
                    </label>
                    <input
                      type="text"
                      value={absentNotes}
                      onChange={(e) => setAbsentNotes(e.target.value)}
                      placeholder="Contoh: 1004 (Sakit), 1009 (Izin)"
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Catatan Khusus Selama Ujian Berlangsung
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Pelaksanaan ujian berlangsung tertib, lancar, dan aman terkendali."
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl italic"
                  />
                </div>
              </div>

              {/* Bagian 3: Pejabat Ruangan & Pengesahan */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400 mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  <span>3. Pejabat Ruangan &amp; Pengesahan</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
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
                className="px-5 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/25 transition-all hover:scale-105 active:scale-95"
              >
                Selesai &amp; Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. PRINT SHEET CANVAS (A4 Format) */}
      <main className="max-w-4xl mx-auto my-6 p-10 bg-white text-slate-900 border border-slate-200 shadow-lg print:border-none print:shadow-none print:m-0 print:p-0 print:max-w-none text-xs leading-relaxed">
        {/* Kop Surat Resmi */}
        <div className="border-b-4 border-double border-black pb-3 mb-6 text-center">
          <div className="font-extrabold text-base uppercase tracking-tight">
            BERITA ACARA PELAKSANAAN UJIAN BERBASIS KOMPUTER (CBT)
          </div>
          <div className="font-bold text-sm uppercase">
            {schoolName} • TAHUN PELAJARAN 2026/2027
          </div>
          <div className="text-[11px] text-slate-600 print:text-black">
            Jl. Pendidikan No. 1, Jakarta • Telp. (021) 1234567 • info@owlcbt.edu
          </div>
        </div>

        {/* Paragraf Pembuka */}
        <p className="mb-4 text-justify">
          Pada hari ini <strong>{dayName}</strong> tanggal <strong>{fullDate}</strong>, di <strong>{schoolName}</strong> telah diselenggarakan Ujian Berbasis Komputer dengan rincian pelaksanaan sebagai berikut:
        </p>

        {/* Tabel Rincian Pelaksanaan Sesuai Jadwal & Input */}
        <table className="w-full border-collapse border border-black text-xs mb-5">
          <tbody>
            <tr>
              <td className="border border-black py-2.5 px-3 w-56 font-semibold bg-slate-100 print:bg-slate-50">
                Mata Pelajaran
              </td>
              <td className="border border-black py-2.5 px-3 font-bold uppercase">
                {selectedExam?.subject || "Matematika"}
              </td>
            </tr>
            <tr>
              <td className="border border-black py-2.5 px-3 font-semibold bg-slate-100 print:bg-slate-50">
                Nama / Judul Ujian
              </td>
              <td className="border border-black py-2.5 px-3 font-medium">
                {selectedExam?.title || "Penilaian Akhir Semester"}
              </td>
            </tr>
            <tr>
              <td className="border border-black py-2.5 px-3 font-semibold bg-slate-100 print:bg-slate-50">
                Ruang / Laboratorium
              </td>
              <td className="border border-black py-2.5 px-3 uppercase font-semibold">
                {roomName}
              </td>
            </tr>
            <tr>
              <td className="border border-black py-2.5 px-3 font-semibold bg-slate-100 print:bg-slate-50">
                Sesi Pelaksanaan
              </td>
              <td className="border border-black py-2.5 px-3 uppercase font-semibold">
                {sessionName} (Pukul {startTime} s.d. {endTime} WIB)
              </td>
            </tr>
            <tr>
              <td className="border border-black py-2.5 px-3 font-semibold bg-slate-100 print:bg-slate-50">
                Jumlah Peserta Seharusnya
              </td>
              <td className="border border-black py-2.5 px-3 font-bold">
                {expectedCount} Orang
              </td>
            </tr>
            <tr>
              <td className="border border-black py-2.5 px-3 font-semibold bg-slate-100 print:bg-slate-50">
                Jumlah Peserta yang Hadir
              </td>
              <td className="border border-black py-2.5 px-3 font-bold text-emerald-700 print:text-black">
                {presentCount} Orang
              </td>
            </tr>
            <tr>
              <td className="border border-black py-2.5 px-3 font-semibold bg-slate-100 print:bg-slate-50">
                Peserta Tidak Hadir (NISN)
              </td>
              <td className="border border-black py-2.5 px-3 text-slate-700 print:text-black">
                {absentNotes}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Catatan Khusus Pelaksanaan */}
        <div className="mb-6">
          <div className="font-bold uppercase text-[11px] mb-1">
            Catatan Khusus Selama Ujian Berlangsung:
          </div>
          <div className="border border-black p-3 min-h-[60px] italic text-slate-800 print:text-black">
            "{notes}"
          </div>
        </div>

        {/* Paragraf Penutup */}
        <p className="mb-8 text-justify">
          Demikian Berita Acara ini dibuat dengan sesungguhnya dan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.
        </p>

        {/* Tanda Tangan */}
        <div className="grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div>Pengawas Ruang Ujian,</div>
            <div className="h-20" />
            <div className="font-bold underline">{supervisorName}</div>
            <div className="text-[10px] text-slate-600 print:text-black">NIP. {supervisorNip || "-"}</div>
          </div>

          <div>
            <div>Proktor Ruang Ujian,</div>
            <div className="h-20" />
            <div className="font-bold underline">{proctorName}</div>
            <div className="text-[10px] text-slate-600 print:text-black">NIP. {proctorNip || "-"}</div>
          </div>

          <div className="col-span-2 text-center pt-4">
            <div>Mengetahui,</div>
            <div>Kepala Sekolah {schoolName},</div>
            <div className="h-20" />
            <div className="font-bold underline">{headmasterName}</div>
            <div className="text-[10px] text-slate-600 print:text-black">NIP. {headmasterNip || "-"}</div>
          </div>
        </div>
      </main>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
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
