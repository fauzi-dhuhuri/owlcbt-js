"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Search,
  MessageCircle,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Plus,
  Loader2,
  Check,
  GraduationCap,
  Sparkles,
  Phone,
  Mail,
  Shield,
  Layers,
  X,
  Printer,
  FileText,
  FileCheck,
  FileSpreadsheet,
} from "lucide-react";
import DataImportModal from "../components/DataImportModal";

export default function StudentsManagementPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("ALL");

  // Modal Tambah Siswa
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [studentForm, setStudentForm] = useState({
    username: "",
    name: "",
    password: "",
    classId: "",
    gender: "L",
    phone: "",
    email: "",
  });
  const [savingStudent, setSavingStudent] = useState(false);

  // Modal Tambah Kelas
  const [showAddClass, setShowAddClass] = useState(false);
  const [classForm, setClassForm] = useState({ name: "", level: "XII", major: "MIPA" });
  const [savingClass, setSavingClass] = useState(false);

  // Edit Student Modal
  const [editStudent, setEditStudent] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/students");
      const json = await res.json();
      setStudents(json.students || []);
      setClasses(json.classes || []);

      if (json.classes?.length > 0 && !studentForm.classId) {
        setStudentForm((prev) => ({ ...prev, classId: json.classes[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Simpan Siswa Baru
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingStudent(true);
    try {
      const res = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(studentForm),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menambah siswa");

      setNotice({ type: "success", text: "Siswa berhasil ditambahkan!" });
      setShowAddStudent(false);
      setStudentForm({
        username: "",
        name: "",
        password: "",
        classId: classes[0]?.id || "",
        gender: "L",
        phone: "",
        email: "",
      });

      fetchStudents();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingStudent(false);
    }
  };

  // Simpan Edit Siswa
  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudent) return;
    setSavingEdit(true);

    try {
      const res = await fetch("/api/admin/students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editStudent),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengupdate siswa");

      setNotice({ type: "success", text: "Data siswa berhasil diperbarui!" });
      setEditStudent(null);
      fetchStudents();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Hapus Siswa
  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus siswa ${name}?`)) return;

    try {
      const res = await fetch(`/api/admin/students?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus siswa");
      setNotice({ type: "success", text: `Siswa ${name} berhasil dihapus.` });
      fetchStudents();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Simpan Kelas Baru
  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingClass(true);
    try {
      const res = await fetch("/api/admin/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(classForm),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menambah kelas");

      setNotice({ type: "success", text: `Kelas ${classForm.name} berhasil ditambahkan!` });
      setShowAddClass(false);
      setClassForm({ name: "", level: "XII", major: "MIPA" });
      fetchStudents();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingClass(false);
    }
  };

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter === "ALL" ? true : s.classId === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Master Data</span>
          <span className="text-slate-400">/</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">Data Siswa &amp; Kelas</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <Shield className="w-3 h-3 text-rose-500" />
            Khusus Administrator
          </span>
        </div>
      </header>

      {/* Notice Alert */}
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

      {/* Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Daftar Peserta Didik
            </h1>
            <p className="text-xs text-slate-500">
              Total {students.length} siswa terdaftar di sistem CBT
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Import Excel / CSV
            </button>
            <button
              onClick={() => setShowAddClass(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              + Kelas Baru
            </button>
            <button
              onClick={() => setShowAddStudent(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01]"
            >
              <UserPlus className="w-4 h-4" />
              Tambah Siswa Baru
            </button>
          </div>
        </div>

        {/* Cetak Dokumen Administrasi Ujian Resmi */}
        <div className="bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-indigo-900/10 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 rounded-3xl p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
                <Printer className="w-3.5 h-3.5" />
                <span>Dokumen Administrasi Ujian (Siap Cetak A4)</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Format standar cetak resmi Kementerian/Dinas Pendidikan untuk keperluan ruang ujian fisik.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/admin/print/cards"
                target="_blank"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 shadow-sm transition-all hover:scale-[1.02]"
              >
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>Cetak Kartu Ujian</span>
              </Link>
              <Link
                href="/admin/print/attendance"
                target="_blank"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 shadow-sm transition-all hover:scale-[1.02]"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Cetak Daftar Hadir</span>
              </Link>
              <Link
                href="/admin/print/report"
                target="_blank"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 shadow-sm transition-all hover:scale-[1.02]"
              >
                <FileCheck className="w-4 h-4 text-amber-600" />
                <span>Cetak Berita Acara</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama atau NISN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">Semua Kelas ({classes.length} Kelas)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c._count?.students || 0} Siswa)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Student Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-4">NISN / Akun</th>
                  <th className="py-3 px-4">Kelas</th>
                  <th className="py-3 px-4">L/P</th>
                  <th className="py-3 px-4">WhatsApp Wali</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                      Memuat daftar siswa...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Tidak ada siswa yang sesuai dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{s.name}</div>
                        {s.email && <div className="text-[10px] text-slate-400">{s.email}</div>}
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {s.username}
                      </td>

                      <td className="py-3 px-4 font-semibold text-indigo-600 dark:text-indigo-400">
                        {s.className}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-500">{s.gender || "-"}</span>
                      </td>

                      {/* WhatsApp API Link */}
                      <td className="py-3 px-4">
                        {s.phone ? (
                          <a
                            href={`https://api.whatsapp.com/send?phone=${s.phone.replace(/[^0-9]/g, "")}&text=Halo%20Wali%20Murid%20dari%20${encodeURIComponent(s.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                            {s.phone}
                          </a>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>

                      {/* Status Aktif */}
                      <td className="py-3 px-4 text-center">
                        {s.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            Nonaktif
                          </span>
                        )}
                      </td>

                      {/* Aksi Edit & Hapus */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditStudent(s)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
                            title="Edit Data Siswa"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(s.id, s.name)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                            title="Hapus Siswa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL TAMBAH SISWA */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Tambah Siswa Baru
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Masukkan data peserta didik ke dalam database CBT
            </p>

            <form onSubmit={handleSaveStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  NISN / No Peserta (Username)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 1002"
                  value={studentForm.username}
                  onChange={(e) => setStudentForm({ ...studentForm, username: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Nama Lengkap Siswa
                </label>
                <input
                  type="text"
                  placeholder="Nama lengkap peserta..."
                  value={studentForm.name}
                  onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Kelas
                  </label>
                  <select
                    value={studentForm.classId}
                    onChange={(e) => setStudentForm({ ...studentForm, classId: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={studentForm.gender}
                    onChange={(e) => setStudentForm({ ...studentForm, gender: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Password Login (Default: 123456)
                </label>
                <input
                  type="password"
                  placeholder="Kosongkan jika default (123456)"
                  value={studentForm.password}
                  onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  No HP / WhatsApp Orang Tua (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 08123456789"
                  value={studentForm.phone}
                  onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddStudent(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingStudent}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                >
                  {savingStudent ? "Menyimpan..." : "Simpan Siswa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT SISWA */}
      {editStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Edit Data Siswa
            </h3>
            <p className="text-xs text-slate-500 mb-5">NISN: {editStudent.username}</p>

            <form onSubmit={handleUpdateStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Nama Lengkap Siswa
                </label>
                <input
                  type="text"
                  value={editStudent.name}
                  onChange={(e) => setEditStudent({ ...editStudent, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Kelas
                  </label>
                  <select
                    value={editStudent.classId || ""}
                    onChange={(e) => setEditStudent({ ...editStudent, classId: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Status Akun
                  </label>
                  <select
                    value={editStudent.isActive ? "1" : "0"}
                    onChange={(e) => setEditStudent({ ...editStudent, isActive: e.target.value === "1" })}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="1">Aktif</option>
                    <option value="0">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Ganti Password (Kosongkan jika tidak diubah)
                </label>
                <input
                  type="password"
                  placeholder="Password baru..."
                  value={editStudent.password || ""}
                  onChange={(e) => setEditStudent({ ...editStudent, password: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  No HP / WhatsApp
                </label>
                <input
                  type="text"
                  value={editStudent.phone || ""}
                  onChange={(e) => setEditStudent({ ...editStudent, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditStudent(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                >
                  {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH KELAS */}
      {showAddClass && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Tambah Kelas Baru
            </h3>
            <p className="text-xs text-slate-500 mb-4">Buat rombel / tingkatan kelas baru</p>

            <form onSubmit={handleSaveClass} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Nama Kelas
                </label>
                <input
                  type="text"
                  placeholder="Contoh: X TKJ 1, XII MIPA 2"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Tingkat (Level)
                  </label>
                  <select
                    value={classForm.level}
                    onChange={(e) => setClassForm({ ...classForm, level: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="X">Kelas X</option>
                    <option value="XI">Kelas XI</option>
                    <option value="XII">Kelas XII</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Jurusan
                  </label>
                  <input
                    type="text"
                    placeholder="MIPA / IPS / TKJ"
                    value={classForm.major}
                    onChange={(e) => setClassForm({ ...classForm, major: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddClass(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingClass}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                >
                  {savingClass ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Data Siswa dari Excel/CSV */}
      <DataImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Data Siswa dari Excel / CSV"
        description="Tambahkan atau perbarui data siswa secara massal dari file spreadsheet."
        templateUrl="/api/admin/students/import"
        uploadUrl="/api/admin/students/import"
        templateFilename="template_import_siswa_owlcbt.xlsx"
        onSuccess={() => {
          fetchStudents();
        }}
      />
    </div>
  );
}
