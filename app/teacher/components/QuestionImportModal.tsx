"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import {
  FileSpreadsheet,
  FileText,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  FileCheck,
  Sparkles,
  HelpCircle,
} from "lucide-react";

interface QuestionImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankId: string;
  bankTitle: string;
  onSuccess: () => void;
}

export default function QuestionImportModal({
  isOpen,
  onClose,
  bankId,
  bankTitle,
  onSuccess,
}: QuestionImportModalProps) {
  const [tab, setTab] = useState<"EXCEL" | "WORD">("EXCEL");

  // Excel state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewItems, setPreviewItems] = useState<any[]>([]);

  // Word / Text state
  const [rawText, setRawText] = useState("");

  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    total: number;
    created: number;
    errors?: any[];
  } | null>(null);

  if (!isOpen) return null;

  // Handle Excel File upload & preview
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      setPreviewItems(json.slice(0, 5));
    } catch (err) {
      console.error("Gagal membaca preview soal:", err);
    }
  };

  // Submit Import (Excel or Text)
  const handleImport = async () => {
    setUploading(true);
    setResult(null);

    try {
      let res: Response;

      if (tab === "EXCEL") {
        if (!selectedFile) return;
        const formData = new FormData();
        formData.append("file", selectedFile);

        res = await fetch(`/api/teacher/banks/${bankId}/questions/import`, {
          method: "POST",
          body: formData,
        });
      } else {
        if (!rawText.trim()) return;
        res = await fetch(`/api/teacher/banks/${bankId}/questions/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawText }),
        });
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengimpor butir soal");

      setResult(json);
      onSuccess();
    } catch (err: any) {
      alert(err.message || "Gagal memproses import soal");
    } finally {
      setUploading(false);
    }
  };

  const handleFillSampleText = () => {
    const sample = `1. Organel sel apa yang berfungsi menghasilkan energi (ATP) pada sel eukariotik?
A. Badan Golgi
B. Mitokondria
C. Ribosom
D. Lisosom
E. Kloroplas
Kunci: B

2. Apa nama zat hijau daun yang berperan dalam proses fotosintesis?
A. Karotenoid
B. Antosianin
C. Klorofil
D. Xantofil
Kunci: C

3. Jelaskan hukum Archimedes dan sebutkan 2 contoh penerapannya dalam kehidupan sehari-hari!
Jenis: Esai
Bobot: 5`;

    setRawText(sample);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Import Butir Soal Massal
              </h3>
              <p className="text-xs text-slate-500">
                Bank: <strong className="text-slate-700 dark:text-slate-300">{bankTitle}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection: Excel vs Word/Text */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setTab("EXCEL");
              setResult(null);
            }}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              tab === "EXCEL"
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Format Excel (.xlsx / .csv)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("WORD");
              setResult(null);
            }}
            className={`flex-1 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all ${
              tab === "WORD"
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Format Word / Teks Cepat</span>
          </button>
        </div>

        {/* TAB 1: EXCEL IMPORT */}
        {tab === "EXCEL" && (
          <div className="space-y-4 text-xs">
            {/* Step 1: Download Template */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-bold text-indigo-950 dark:text-indigo-200">
                  Langkah 1: Gunakan Template Resmi Excel
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Unduh format dengan kolom Soal, Pilihan A - E, Kunci, Jenis, dan Bobot.
                </p>
              </div>
              <a
                href={`/api/teacher/banks/${bankId}/questions/import`}
                download="template_import_soal_owlcbt.xlsx"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-xs shrink-0 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Template (.xlsx)</span>
              </a>
            </div>

            {/* Step 2: Upload Excel File */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Langkah 2: Pilih File Spreadsheet (.xlsx / .csv)
              </label>
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-emerald-500 transition-colors bg-slate-50/50 dark:bg-slate-800/30">
                <input
                  type="file"
                  id="excel-question-input"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="excel-question-input"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center">
                    <Upload className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedFile ? selectedFile.name : "Klik untuk memilih file soal"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {selectedFile
                        ? `${(selectedFile.size / 1024).toFixed(1)} KB — Siap diimpor`
                        : "Format file yang didukung: .xlsx, .xls, .csv"}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Preview items */}
            {previewItems.length > 0 && !result && (
              <div className="space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  Pratinjau {previewItems.length} Butir Soal Pertama:
                </span>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 max-h-40">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                      <tr>
                        <th className="p-2">No</th>
                        <th className="p-2">Isi Pertanyaan</th>
                        <th className="p-2">Kunci</th>
                        <th className="p-2">Jenis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {previewItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2 font-mono font-bold">{idx + 1}</td>
                          <td className="p-2 max-w-xs truncate text-slate-800 dark:text-slate-200">
                            {item["Isi Soal (Pertanyaan)"] || item["Soal"] || item["soal"]}
                          </td>
                          <td className="p-2 font-bold text-emerald-600">
                            {item["Kunci Jawaban (A/B/C/D/E)"] || item["Kunci"] || item["jawaban"]}
                          </td>
                          <td className="p-2 font-semibold text-slate-500">
                            {item["Jenis (PG / ESAI)"] || item["Jenis"] || "PG"}
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

        {/* TAB 2: WORD / TEXT FORMAT */}
        {tab === "WORD" && (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Salin &amp; Tempel (Copy-Paste) Soal dari Ms. Word:
                </span>
                <p className="text-[11px] text-slate-500">
                  Format otomatis mendeteksi nomor soal, pilihan A-E, dan baris Kunci.
                </p>
              </div>
              <button
                type="button"
                onClick={handleFillSampleText}
                className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[11px] font-bold hover:bg-blue-100"
              >
                Isi Contoh Format
              </button>
            </div>

            <textarea
              rows={8}
              placeholder={`Contoh format penulisan:
1. Apa ibu kota Indonesia?
A. Bandung
B. Jakarta
C. Surabaya
D. Medan
Kunci: B

2. Jelaskan fungsi klorofil pada tumbuhan!
Jenis: Esai
Bobot: 5`}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                setResult(null);
              }}
              className="w-full p-3 font-mono text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
          </div>
        )}

        {/* Success / Error Result Banner */}
        {result && (
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${
              result.success
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
            }`}
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-sm">{result.message}</div>
              <p className="text-slate-600 dark:text-slate-400">
                Total {result.created} butir soal telah berhasil disimpan ke bank soal.
              </p>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
          >
            {result ? "Tutup" : "Batal"}
          </button>
          {!result && (
            <button
              type="button"
              onClick={handleImport}
              disabled={uploading || (tab === "EXCEL" ? !selectedFile : !rawText.trim())}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/25 transition-all disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Soal...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Mulai Import Soal</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
