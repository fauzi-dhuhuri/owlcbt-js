"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Search,
  Shield,
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
  BookOpen,
  X,
  FileSpreadsheet,
} from "lucide-react";
import DataImportModal from "../components/DataImportModal";

export default function TeachersManagementPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Modal Tambah Guru
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    username: "",
    name: "",
    password: "",
    role: "TEACHER",
    phone: "",
    email: "",
    gender: "L",
  });
  const [savingTeacher, setSavingTeacher] = useState(false);

  // Modal Edit Guru
  const [editTeacher, setEditTeacher] = useState<any>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/teachers");
      const json = await res.json();
      setTeachers(json.teachers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  // Simpan Guru Baru
  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTeacher(true);
    try {
      const res = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menambah guru");

      setNotice({ type: "success", text: "Akun pengajar berhasil ditambahkan!" });
      setShowAddModal(false);
      setForm({
        username: "",
        name: "",
        password: "",
        role: "TEACHER",
        phone: "",
        email: "",
        gender: "L",
      });

      fetchTeachers();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingTeacher(false);
    }
  };

  // Simpan Edit Guru
  const handleUpdateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTeacher) return;
    setSavingEdit(true);

    try {
      const res = await fetch("/api/admin/teachers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editTeacher),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengupdate pengajar");

      setNotice({ type: "success", text: "Data pengajar berhasil diperbarui!" });
      setEditTeacher(null);
      fetchTeachers();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Hapus Guru
  const handleDeleteTeacher = async (id: string, name: string) => {
    if (!confirm(`Yakin ingin menghapus akun ${name}?`)) return;

    try {
      const res = await fetch(`/api/admin/teachers?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus akun pengajar");
      setNotice({ type: "success", text: `Akun ${name} berhasil dihapus.` });
      fetchTeachers();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = teachers.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" ? true : t.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Master Data</span>
          <span className="text-slate-400">/</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">Data Guru &amp; Staf</span>
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
              Daftar Guru &amp; Tenaga Pendidik
            </h1>
            <p className="text-xs text-slate-500">
              Total {teachers.length} akun pengajar, pengawas, dan administrator terdaftar
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
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/20 transition-all hover:scale-[1.01]"
            >
              <UserPlus className="w-4 h-4" />
              Tambah Guru / Staf Baru
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama atau NIP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">Semua Peran</option>
              <option value="TEACHER">Guru Pengampu</option>
              <option value="PROCTOR">Pengawas / Proktor</option>
              <option value="ADMIN">Administrator Utama</option>
            </select>
          </div>
        </div>

        {/* Teachers Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">No</th>
                  <th className="py-3 px-4">Nama Lengkap</th>
                  <th className="py-3 px-4">Username / NIP</th>
                  <th className="py-3 px-4">Peran Hak Akses</th>
                  <th className="py-3 px-4">Kontak / Email</th>
                  <th className="py-3 px-4 text-center">Bank Soal</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-600" />
                      Memuat daftar pengajar...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Tidak ada pengajar yang cocok dengan pencarian.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-mono text-slate-400">{idx + 1}</td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{t.name}</div>
                        <div className="text-[10px] text-slate-400">Gender: {t.gender || "-"}</div>
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {t.username}
                      </td>

                      <td className="py-3 px-4">
                        {t.role === "ADMIN" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            Administrator
                          </span>
                        ) : t.role === "PROCTOR" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Pengawas / Proktor
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 dark:bg-violet-950 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                            Guru Pengampu
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {t.phone && <div className="text-slate-700 dark:text-slate-300">{t.phone}</div>}
                        {t.email ? (
                          <div className="text-[10px] text-slate-400">{t.email}</div>
                        ) : (
                          !t.phone && <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        {t.totalQuestionBanks} Bank
                      </td>

                      <td className="py-3 px-4 text-center">
                        {t.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            Nonaktif
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditTeacher(t)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950 transition-colors"
                            title="Edit Data Pengajar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTeacher(t.id, t.name)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                            title="Hapus Akun Pengajar"
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

      {/* MODAL TAMBAH GURU */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Tambah Pengajar / Staf Baru
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Buat akun akses guru, proktor, atau administrator CBT
            </p>

            <form onSubmit={handleSaveTeacher} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Username / NIP
                </label>
                <input
                  type="text"
                  placeholder="Contoh: guru2 atau 198501..."
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Nama Lengkap (beserta gelar)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Siti Rahmawati, S.Pd"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Peran Hak Akses
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="TEACHER">Guru Pengampu</option>
                    <option value="PROCTOR">Pengawas / Proktor</option>
                    <option value="ADMIN">Administrator Utama</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Jenis Kelamin
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Password Login (Default: guru123)
                </label>
                <input
                  type="password"
                  placeholder="Kosongkan jika default (guru123)"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  No HP / WhatsApp (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="08123456789"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingTeacher}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/20"
                >
                  {savingTeacher ? "Menyimpan..." : "Simpan Akun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT GURU */}
      {editTeacher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Edit Data Pengajar
            </h3>
            <p className="text-xs text-slate-500 mb-5">Username: {editTeacher.username}</p>

            <form onSubmit={handleUpdateTeacher} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={editTeacher.name}
                  onChange={(e) => setEditTeacher({ ...editTeacher, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Peran Hak Akses
                  </label>
                  <select
                    value={editTeacher.role}
                    onChange={(e) => setEditTeacher({ ...editTeacher, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="TEACHER">Guru Pengampu</option>
                    <option value="PROCTOR">Pengawas / Proktor</option>
                    <option value="ADMIN">Administrator Utama</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Status Akun
                  </label>
                  <select
                    value={editTeacher.isActive ? "1" : "0"}
                    onChange={(e) => setEditTeacher({ ...editTeacher, isActive: e.target.value === "1" })}
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
                  value={editTeacher.password || ""}
                  onChange={(e) => setEditTeacher({ ...editTeacher, password: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  No HP / WhatsApp
                </label>
                <input
                  type="text"
                  value={editTeacher.phone || ""}
                  onChange={(e) => setEditTeacher({ ...editTeacher, phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditTeacher(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/20"
                >
                  {savingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Data Guru & Staf */}
      <DataImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Data Guru & Staf dari Excel / CSV"
        description="Tambahkan atau perbarui data pengajar, proktor, dan admin secara massal dari file spreadsheet."
        templateUrl="/api/admin/teachers/import"
        uploadUrl="/api/admin/teachers/import"
        templateFilename="template_import_guru_staf_owlcbt.xlsx"
        onSuccess={() => {
          fetchTeachers();
        }}
      />
    </div>
  );
}
