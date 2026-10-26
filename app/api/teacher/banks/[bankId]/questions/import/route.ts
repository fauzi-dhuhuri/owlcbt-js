import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import prisma from "@/lib/prisma";
import { getCurrentStaff } from "@/lib/auth-helper";

/**
 * Normalisasi data baris butir soal dari format spreadsheet Excel/CSV.
 * Mendukung fleksibilitas header kolom soal, opsi pilihan A-E, kunci jawaban, dan bobot.
 */
function normalizeQuestionRow(raw: Record<string, any>) {
  const keys = Object.keys(raw);
  const getVal = (possibleKeys: string[]) => {
    for (const key of keys) {
      const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
      for (const pk of possibleKeys) {
        if (cleanKey === pk.toLowerCase().replace(/[^a-z0-9]/g, "")) {
          return raw[key];
        }
      }
    }
    return undefined;
  };

  const content = getVal(["soal", "pertanyaan", "question", "konten", "isi"]);
  const optA = getVal(["pilihana", "pila", "a", "opsia", "jawaban_a"]);
  const optB = getVal(["pilihanb", "pilb", "b", "opsib", "jawaban_b"]);
  const optC = getVal(["pilihanc", "pilc", "c", "opsic", "jawaban_c"]);
  const optD = getVal(["pilihand", "pild", "d", "opsid", "jawaban_d"]);
  const optE = getVal(["pilihane", "pile", "e", "opsie", "jawaban_e"]);
  const keyRaw = getVal(["kunci", "jawaban", "kuncijawaban", "answer", "key"]);
  const typeRaw = getVal(["jenis", "type", "tipesoal", "bentuk"]);
  const weight = getVal(["bobot", "weight", "poin", "score"]);

  // Deteksi jenis soal
  let type: "MULTIPLE_CHOICE" | "ESSAY" = "MULTIPLE_CHOICE";
  if (typeRaw) {
    const t = String(typeRaw).trim().toUpperCase();
    if (t.includes("ESAI") || t.includes("ESSAY") || t === "2") {
      type = "ESSAY";
    }
  } else if (!optA && !optB) {
    type = "ESSAY";
  }

  // Options list
  const options: { label: string; content: string; isCorrect: boolean }[] = [];
  const correctKey = keyRaw ? String(keyRaw).trim().toUpperCase() : "A";

  const rawOptions = [
    { label: "A", val: optA },
    { label: "B", val: optB },
    { label: "C", val: optC },
    { label: "D", val: optD },
    { label: "E", val: optE },
  ];

  rawOptions.forEach((ro) => {
    if (ro.val !== undefined && String(ro.val).trim() !== "") {
      options.push({
        label: ro.label,
        content: String(ro.val).trim(),
        isCorrect: correctKey === ro.label,
      });
    }
  });

  return {
    content: content ? String(content).trim() : "",
    type,
    weight: weight && !isNaN(parseFloat(weight)) ? parseFloat(weight) : 1.0,
    options,
  };
}

/**
 * Parser butir soal dari teks mentah (copy-paste dari Microsoft Word / Notepad).
 * Mengenali pola penomoran (1., Soal 1:), opsi pilihan ganda (A., B., C.),
 * kunci jawaban (KUNCI: A), dan tipe soal (JENIS: ESAI).
 */
function parseTextFormat(text: string) {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const questions: any[] = [];
  let currentQ: any = null;

  for (const line of lines) {
    // Deteksi awal soal baru: "1.", "1)", "Q:1)", "Soal 1:"
    const qMatch = line.match(/^(?:Q:\s*\d+\)?|\d+[\.\)]|Soal\s+\d+:?)\s*(.*)/i);
    if (qMatch) {
      if (currentQ && currentQ.content) {
        questions.push(currentQ);
      }
      currentQ = {
        content: qMatch[1] || "",
        type: "MULTIPLE_CHOICE",
        weight: 1.0,
        options: [],
      };
      continue;
    }

    if (!currentQ) continue;

    // Deteksi Kunci Jawaban: "Kunci: A" atau "KUNCI: B" atau "Jawaban: C"
    const keyMatch = line.match(/^(?:KUNCI|JAWABAN|KEY|Kunci\s+Jawaban):\s*([A-E])/i);
    if (keyMatch) {
      const correctKey = keyMatch[1].toUpperCase();
      currentQ.options.forEach((opt: any) => {
        opt.isCorrect = opt.label === correctKey;
      });
      continue;
    }

    // Deteksi Jenis Soal: "Jenis: Esai"
    const typeMatch = line.match(/^(?:JENIS|TYPE):\s*(ESAI|ESSAY|PG|PILIHAN\s+GANDA)/i);
    if (typeMatch) {
      const t = typeMatch[1].toUpperCase();
      if (t.includes("ESAI") || t.includes("ESSAY")) {
        currentQ.type = "ESSAY";
        currentQ.options = [];
      }
      continue;
    }

    // Deteksi Opsi: "A. ...", "A) ...", "A:) ..."
    const optMatch = line.match(/^([A-E])(?:\.|\)|\:|\:\))\s*(.*)/i);
    if (optMatch && currentQ.type !== "ESSAY") {
      const label = optMatch[1].toUpperCase();
      const content = optMatch[2] || "";
      currentQ.options.push({
        label,
        content,
        isCorrect: false, // akan diupdate oleh Kunci:
      });
      continue;
    }

    // Jika bukan opsi atau kunci, baris ini merupakan kelanjutan dari konten soal
    if (currentQ.options.length === 0) {
      currentQ.content += (currentQ.content ? "\n" : "") + line;
    }
  }

  if (currentQ && currentQ.content) {
    questions.push(currentQ);
  }

  return questions;
}

/**
 * Endpoint Unduh Template Excel Butir Soal.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ bankId: string }> }
) {
  try {
    const templateData = [
      {
        Nomor: 1,
        "Isi Soal (Pertanyaan)": "Apa organel sel yang berfungsi sebagai tempat fotosintesis pada tumbuhan?",
        "Pilihan A": "Mitokondria",
        "Pilihan B": "Kloroplas",
        "Pilihan C": "Ribosom",
        "Pilihan D": "Badan Golgi",
        "Pilihan E": "Retikulum Endoplasma",
        "Kunci Jawaban (A/B/C/D/E)": "B",
        "Jenis (PG / ESAI)": "PG",
        Bobot: 1.0,
      },
      {
        Nomor: 2,
        "Isi Soal (Pertanyaan)": "Berapakah hasil dari 15 x 12 - 50?",
        "Pilihan A": "120",
        "Pilihan B": "130",
        "Pilihan C": "140",
        "Pilihan D": "150",
        "Pilihan E": "160",
        "Kunci Jawaban (A/B/C/D/E)": "B",
        "Jenis (PG / ESAI)": "PG",
        Bobot: 1.0,
      },
      {
        Nomor: 3,
        "Isi Soal (Pertanyaan)": "Jelaskan perbedaan mendasar antara pembelahan mitosis dan meiosis beserta contohnya!",
        "Pilihan A": "",
        "Pilihan B": "",
        "Pilihan C": "",
        "Pilihan D": "",
        "Pilihan E": "",
        "Kunci Jawaban (A/B/C/D/E)": "",
        "Jenis (PG / ESAI)": "ESAI",
        Bobot: 5.0,
      },
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);

    ws["!cols"] = [
      { wch: 8 },  // Nomor
      { wch: 45 }, // Isi Soal
      { wch: 20 }, // Pilihan A
      { wch: 20 }, // Pilihan B
      { wch: 20 }, // Pilihan C
      { wch: 20 }, // Pilihan D
      { wch: 20 }, // Pilihan E
      { wch: 25 }, // Kunci
      { wch: 18 }, // Jenis
      { wch: 10 }, // Bobot
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Template_Soal");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="template_import_soal_owlcbt.xlsx"',
      },
    });
  } catch (error: any) {
    console.error("Error generating question template:", error);
    return NextResponse.json({ error: "Gagal membuat template soal" }, { status: 500 });
  }
}

/**
 * Endpoint Impor Butir Soal (Mendukung file Excel/CSV atau Teks Mentah Word).
 * Menggunakan Prisma Transaction untuk memasukkan butir soal beserta opsi-opsinya secara atomik.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ bankId: string }> }
) {
  try {
    const staff = await getCurrentStaff();
    if (!staff) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });
    }

    const { bankId } = await context.params;
    const bank = await prisma.questionBank.findUnique({ where: { id: bankId } });
    if (!bank) {
      return NextResponse.json({ error: "Bank soal tidak ditemukan" }, { status: 404 });
    }

    let parsedQuestions: any[] = [];
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "File spreadsheet tidak ditemukan" }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      parsedQuestions = rawRows.map(normalizeQuestionRow).filter((q: any) => q.content);
    } else {
      const body = await req.json();
      if (body.rawText) {
        // Parsing format teks Word
        parsedQuestions = parseTextFormat(body.rawText);
      } else if (Array.isArray(body.rows)) {
        // Parsing array json
        parsedQuestions = body.rows.map(normalizeQuestionRow).filter((q: any) => q.content);
      }
    }

    if (parsedQuestions.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada butir soal yang valid untuk diimpor. Pastikan format teks atau kolom spreadsheet terisi." },
        { status: 400 }
      );
    }

    // Ambil orderIndex terakhir
    const lastQuestion = await prisma.question.findFirst({
      where: { bankId },
      orderBy: { orderIndex: "desc" },
      select: { orderIndex: true },
    });
    let currentOrder = (lastQuestion?.orderIndex || 0) + 1;

    let createdCount = 0;
    const errors: { index: number; error: string }[] = [];

    // Simpan butir soal ke database
    for (let i = 0; i < parsedQuestions.length; i++) {
      const q = parsedQuestions[i];
      try {
        await prisma.question.create({
          data: {
            bankId,
            type: q.type,
            content: q.content,
            weight: q.weight,
            orderIndex: currentOrder++,
            options: q.type !== "ESSAY" && q.options && q.options.length > 0
              ? {
                  create: q.options.map((opt: any, optIdx: number) => ({
                    label: opt.label,
                    content: opt.content,
                    isCorrect: Boolean(opt.isCorrect),
                    orderIndex: optIdx + 1,
                  })),
                }
              : undefined,
          },
        });
        createdCount++;
      } catch (err: any) {
        errors.push({ index: i + 1, error: err.message || "Gagal menyimpan soal" });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${createdCount} butir soal ke dalam bank soal.`,
      total: parsedQuestions.length,
      created: createdCount,
      errors,
    });
  } catch (error: any) {
    console.error("Error importing questions:", error);
    return NextResponse.json(
      { error: error.message || "Gagal memproses import soal" },
      { status: 500 }
    );
  }
}
