"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  HelpCircle,
  FileQuestion,
  Layers,
  Sparkles,
  Loader2,
  Check,
  AlertCircle,
  X,
  Image,
  FileSpreadsheet,
} from "lucide-react";
import QuestionImportModal from "../../components/QuestionImportModal";

interface OptionInput {
  label: string;
  content: string;
  isCorrect: boolean;
  mediaUrl?: string;
}

export default function BankQuestionEditorPage({
  params,
}: {
  params: Promise<{ bankId: string }>;
}) {
  const { bankId } = use(params);

  const [bank, setBank] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Import Modal state
  const [showImportModal, setShowImportModal] = useState(false);

  // New Question Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [qType, setQType] = useState<"MULTIPLE_CHOICE" | "MULTIPLE_RESPONSE" | "ESSAY">("MULTIPLE_CHOICE");
  const [qContent, setQContent] = useState("");
  const [qWeight, setQWeight] = useState(1.0);
  const [qMediaUrl, setQMediaUrl] = useState("");
  const [options, setOptions] = useState<OptionInput[]>([
    { label: "A", content: "", isCorrect: true },
    { label: "B", content: "", isCorrect: false },
    { label: "C", content: "", isCorrect: false },
    { label: "D", content: "", isCorrect: false },
  ]);
  const [savingQuestion, setSavingQuestion] = useState(false);

  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetch Bank & Questions
  const loadBankData = async () => {
    try {
      const res = await fetch(`/api/teacher/banks/${bankId}/questions`);
      if (!res.ok) throw new Error("Gagal memuat bank soal");
      const json = await res.json();
      setBank(json.bank);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBankData();
  }, [bankId]);

  // Dynamic Options Management
  const addOption = () => {
    const nextChar = String.fromCharCode(65 + options.length); // E, F...
    setOptions([...options, { label: nextChar, content: "", isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      alert("Minimal 2 pilihan opsi jawaban!");
      return;
    }
    const filtered = options.filter((_, i) => i !== index);
    // Relabel
    const relabeled = filtered.map((opt, i) => ({
      ...opt,
      label: String.fromCharCode(65 + i),
    }));
    setOptions(relabeled);
  };

  const handleOptionContentChange = (index: number, text: string) => {
    const updated = [...options];
    updated[index].content = text;
    setOptions(updated);
  };

  const handleOptionCorrectToggle = (index: number) => {
    if (qType === "MULTIPLE_CHOICE") {
      // Radio logic: hanya 1 yang benar
      const updated = options.map((opt, i) => ({
        ...opt,
        isCorrect: i === index,
      }));
      setOptions(updated);
    } else {
      // Multi response checkbox
      const updated = [...options];
      updated[index].isCorrect = !updated[index].isCorrect;
      setOptions(updated);
    }
  };

  // Submit new question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qContent.trim()) {
      alert("Teks konten soal wajib diisi!");
      return;
    }

    if (qType !== "ESSAY") {
      const hasCorrect = options.some((opt) => opt.isCorrect);
      if (!hasCorrect) {
        alert("Wajib memilih minimal satu kunci jawaban yang benar!");
        return;
      }
      const emptyOption = options.some((opt) => !opt.content.trim());
      if (emptyOption) {
        alert("Semua teks pilihan jawaban harus diisi!");
        return;
      }
    }

    setSavingQuestion(true);
    try {
      const res = await fetch(`/api/teacher/banks/${bankId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: qType,
          content: qContent,
          weight: qWeight,
          mediaUrl: qMediaUrl || null,
          options: qType !== "ESSAY" ? options : [],
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menyimpan soal");

      setNotice({ type: "success", text: "Butir soal baru berhasil disimpan ke bank soal!" });
      setShowAddForm(false);
      setQContent("");
      setQMediaUrl("");
      setOptions([
        { label: "A", content: "", isCorrect: true },
        { label: "B", content: "", isCorrect: false },
        { label: "C", content: "", isCorrect: false },
        { label: "D", content: "", isCorrect: false },
      ]);

      loadBankData();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingQuestion(false);
    }
  };

  // Delete question
  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Yakin ingin menghapus butir soal ini?")) return;

    try {
      const res = await fetch(`/api/teacher/banks/${bankId}/questions?questionId=${questionId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Gagal menghapus butir soal");
      setNotice({ type: "success", text: "Butir soal berhasil dihapus!" });
      loadBankData();
      setTimeout(() => setNotice(null), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const questions = bank?.questions || [];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 sm:px-6">
        <Link
          href="/teacher"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Katalog Bank Soal
        </Link>
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

      {/* Main Workspace */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Bank Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900">
                {bank?.subject?.code} • {bank?.subject?.name}
              </span>
              <span className="text-xs font-mono text-slate-400">Kode: {bank?.code}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {bank?.title}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {bank?.description || "Kelola dan edit butir soal di bawah ini."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Import Soal (Excel/Word)
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01]"
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAddForm ? "Tutup Form Soal" : "Tambah Butir Soal Baru"}
            </button>
          </div>
        </div>

        {/* Form Tambah Soal Baru */}
        {showAddForm && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-indigo-500/40 p-6 shadow-lg space-y-5">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Input Butir Soal Baru
            </h3>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Tipe Soal
                  </label>
                  <select
                    value={qType}
                    onChange={(e: any) => setQType(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="MULTIPLE_CHOICE">Pilihan Ganda Tunggal (1 Kunci Benar)</option>
                    <option value="MULTIPLE_RESPONSE">Pilihan Ganda Kompleks (Bisa &gt;1 Kunci)</option>
                    <option value="ESSAY">Esai / Uraian Bebas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                    Bobot Nilai Soal
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={qWeight}
                    onChange={(e) => setQWeight(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Teks Pertanyaan Soal */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Konten Pertanyaan Soal (Dapat memuat teks atau tag HTML)
                </label>
                <textarea
                  placeholder="Ketik pertanyaan soal di sini..."
                  value={qContent}
                  onChange={(e) => setQContent(e.target.value)}
                  rows={4}
                  className="w-full p-3.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white leading-relaxed"
                  required
                />
              </div>

              {/* Media URL (Opsional) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  URL Gambar Pendukung (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: https://domain.com/gambar-soal.png atau /files/soal1.jpg"
                  value={qMediaUrl}
                  onChange={(e) => setQMediaUrl(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              {/* Dynamic Options Section (Only for Multiple Choice / Response) */}
              {qType !== "ESSAY" && (
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Pilihan Jawaban &amp; Kunci ({options.length} Opsi)
                    </label>
                    <button
                      type="button"
                      onClick={addOption}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" /> Tambah Opsi Pilihan ({String.fromCharCode(65 + options.length)})
                    </button>
                  </div>

                  <div className="space-y-3">
                    {options.map((opt, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-2xl border flex items-center gap-3 transition-colors ${
                          opt.isCorrect
                            ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500"
                            : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {/* Radio / Checkbox for correct answer */}
                        <button
                          type="button"
                          onClick={() => handleOptionCorrectToggle(idx)}
                          className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 transition-colors ${
                            opt.isCorrect
                              ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                          }`}
                          title={opt.isCorrect ? "Kunci Jawaban Benar" : "Klik untuk jadikan kunci jawaban"}
                        >
                          {opt.label}
                        </button>

                        {/* Input content */}
                        <input
                          type="text"
                          placeholder={`Teks pilihan ${opt.label}...`}
                          value={opt.content}
                          onChange={(e) => handleOptionContentChange(idx, e.target.value)}
                          className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                          required
                        />

                        {opt.isCorrect && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                            (Kunci Benar)
                          </span>
                        )}

                        {/* Remove Option */}
                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Hapus opsi ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingQuestion}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-md shadow-indigo-600/20"
                >
                  {savingQuestion ? "Menyimpan Soal..." : "Simpan Butir Soal"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Existing Questions List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Daftar Soal Terdaftar ({questions.length} Butir)
            </h3>
          </div>

          {questions.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
              Belum ada soal pada bank ini. Klik "Tambah Butir Soal Baru" di atas untuk menambahkan.
            </div>
          ) : (
            questions.map((q: any, idx: number) => (
              <div
                key={q.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm"
              >
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900">
                      {q.type === "MULTIPLE_CHOICE"
                        ? "Pilihan Ganda"
                        : q.type === "MULTIPLE_RESPONSE"
                        ? "Pilihan Ganda Kompleks"
                        : "Esai"}
                    </span>
                    <span className="text-[10px] text-slate-400">Bobot: {q.weight}</span>
                  </div>

                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                    title="Hapus Butir Soal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div
                  className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 mb-4 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: q.content }}
                />

                {/* Options List */}
                {q.type !== "ESSAY" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    {q.options?.map((opt: any) => (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                          opt.isCorrect
                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 font-medium"
                            : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center shrink-0 ${
                            opt.isCorrect ? "bg-emerald-600 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600"
                          }`}
                        >
                          {opt.label}
                        </span>
                        <div className="flex-1 truncate" dangerouslySetInnerHTML={{ __html: opt.content }} />
                        {opt.isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>

      {/* Modal Import Butir Soal */}
      <QuestionImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        bankId={bankId}
        bankTitle={bank?.title || ""}
        onSuccess={() => {
          loadBankData();
        }}
      />
    </div>
  );
}
