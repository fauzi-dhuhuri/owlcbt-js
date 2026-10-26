"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  X,
  FileCheck,
  Check,
} from "lucide-react";

interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  templateUrl: string;
  uploadUrl: string;
  templateFilename: string;
  onSuccess: () => void;
}

export default function DataImportModal({
  isOpen,
  onClose,
  title,
  description,
  templateUrl,
  uploadUrl,
  templateFilename,
  onSuccess,
}: DataImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [previewColumns, setPreviewColumns] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    total: number;
    created: number;
    updated: number;
    failed: number;
    errors: { row: number; username: string; error: string }[];
  } | null>(null);

  if (!isOpen) return null;

  // Handle File Change & Live Preview
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setResult(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (json.length > 0) {
        setPreviewRows(json.slice(0, 5)); // Ambil 5 baris pertama untuk preview
        setPreviewColumns(Object.keys(json[0]));
      } else {
        setPreviewRows([]);
        setPreviewColumns([]);
      }
    } catch (err) {
      console.error("Gagal membaca preview Excel/CSV:", err);
    }
  };

  // Submit Upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal mengimpor data");

      setResult(json);
      onSuccess();
    } catch (err: any) {
      alert(err.message || "Gagal memproses import data");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewRows([]);
    setPreviewColumns([]);
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="text-xs text-slate-500">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Download Template */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <div className="font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
              <span>Langkah 1: Gunakan Template Resmi</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              Unduh format template standar Excel agar susunan kolom sesuai dengan sistem.
            </p>
          </div>
          <a
            href={templateUrl}
            download={templateFilename}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl font-bold bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-xs transition-all shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download Format (.xlsx)</span>
          </a>
        </div>

        {/* Step 2: Upload Zone */}
        <div className="space-y-2 text-xs">
          <label className="font-bold text-slate-700 dark:text-slate-300">
            Langkah 2: Pilih File Spreadsheet (.xlsx, .xls, atau .csv)
          </label>
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors bg-slate-50/50 dark:bg-slate-800/30">
            <input
              type="file"
              id="file-upload-input"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="file-upload-input"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center text-slate-600 dark:text-slate-300">
                <Upload className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedFile ? selectedFile.name : "Klik untuk memilih file Excel / CSV"}
                </p>
                <p className="text-[11px] text-slate-400">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB — Siap diproses`
                    : "Mendukung format Microsoft Excel Workbook (.xlsx, .xls) atau Comma Separated (.csv)"}
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Preview Table */}
        {previewRows.length > 0 && !result && (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="font-bold text-slate-700 dark:text-slate-200">
                Pratinjau Data (5 Baris Pertama):
              </span>
              <button
                type="button"
                onClick={handleReset}
                className="text-rose-600 hover:underline"
              >
                Ganti File
              </button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 max-h-48">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  <tr>
                    {previewColumns.map((col, idx) => (
                      <th key={idx} className="p-2 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {previewRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      {previewColumns.map((col, cIdx) => (
                        <td key={cIdx} className="p-2 whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {String(row[col] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Result Report */}
        {result && (
          <div className="space-y-3 text-xs">
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                result.success
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                  : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200"
              }`}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-sm">{result.message}</div>
                <div className="flex flex-wrap gap-3 text-xs pt-1">
                  <span>
                    Total: <strong>{result.total}</strong>
                  </span>
                  <span>
                    Baru: <strong className="text-emerald-600">{result.created}</strong>
                  </span>
                  <span>
                    Diperbarui: <strong className="text-blue-600">{result.updated}</strong>
                  </span>
                  {result.failed > 0 && (
                    <span>
                      Gagal: <strong className="text-rose-600">{result.failed}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Error Rows if any */}
            {result.errors?.length > 0 && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-xl space-y-1.5 max-h-36 overflow-y-auto">
                <div className="font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Daftar Baris yang Gagal Diproses:</span>
                </div>
                <ul className="list-disc list-inside text-[11px] text-rose-600 dark:text-rose-400 space-y-1">
                  {result.errors.map((err, i) => (
                    <li key={i}>
                      Baris {err.row} (ID: {err.username}): {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Data...</span>
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Mulai Import Data</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
