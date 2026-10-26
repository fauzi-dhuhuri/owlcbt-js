"use client";

import { useEffect, useState, useRef, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  LayoutGrid,
  Type,
  Maximize2,
  ShieldAlert,
  Loader2,
  Check,
  HelpCircle,
  X,
} from "lucide-react";

interface Option {
  id: string;
  label: string;
  content: string;
  mediaUrl?: string | null;
}

interface Question {
  id: string;
  number: number;
  type: "MULTIPLE_CHOICE" | "MULTIPLE_RESPONSE" | "TRUE_FALSE" | "ESSAY";
  content: string;
  mediaUrl?: string | null;
  weight: number;
  options: Option[];
}

export default function ExamRoomPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const router = useRouter();
  const { examId } = use(params);

  // Data states
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Student Answers state: { [questionId]: { selectedOptionIds: string[], essayAnswer: string, isDoubtful: boolean } }
  const [answers, setAnswers] = useState<
    Record<string, { selectedOptionIds: string[]; essayAnswer: string; isDoubtful: boolean }>
  >({});

  // Timer states
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  // UI state
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("normal");
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [violationAlert, setViolationAlert] = useState<string | null>(null);

  // Debounce timer ref for autosave
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Load: Fetch Session & Questions
  useEffect(() => {
    async function initRoom() {
      try {
        const res = await fetch(`/api/exam/${examId}/session`);
        if (!res.ok) throw new Error("Gagal memuat sesi ujian");
        const data = await res.json();

        if (!data.session || data.session.status === "NOT_STARTED") {
          router.replace(`/exam/${examId}/confirm`);
          return;
        }

        if (data.session.status === "SUBMITTED") {
          router.replace(`/exam/${examId}/result`);
          return;
        }

        setExam(data.exam);
        setStudent(data.student);
        setQuestions(data.questions);
        setRemainingSeconds(data.remainingSeconds);

        // Populate saved answers
        if (data.savedAnswers) {
          setAnswers(data.savedAnswers);
        }
      } catch (err) {
        console.error("Error loading exam room:", err);
      } finally {
        setLoading(false);
      }
    }

    initRoom();
  }, [examId, router]);

  // 2. High-precision Timer Countdown
  useEffect(() => {
    if (loading || remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, remainingSeconds]);

  // 3. Anti-Cheat: Tab Switch & Window Blur Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation("TAB_SWITCH", "Siswa beralih tab atau meminimalkan browser");
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [examId]);

  const logViolation = async (action: string, message: string) => {
    setViolationAlert("Peringatan: Aktivitas berpindah layar tercatat di sistem pengawas!");
    try {
      await fetch(`/api/exam/${examId}/violation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, message }),
      });
    } catch (e) {
      console.error("Failed to log violation", e);
    }
  };

  // 4. Autosave to Server (Debounced)
  const saveAnswerToServer = useCallback(
    async (
      questionId: string,
      answerData: { selectedOptionIds: string[]; essayAnswer: string; isDoubtful: boolean }
    ) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/exam/${examId}/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questionId,
            selectedOptionIds: answerData.selectedOptionIds,
            essayAnswer: answerData.essayAnswer,
            isDoubtful: answerData.isDoubtful,
          }),
        });

        if (res.ok) {
          setSaveStatus("saved");
        } else {
          setSaveStatus("error");
        }
      } catch (e) {
        setSaveStatus("error");
      }
    },
    [examId]
  );

  // 5. User Interaction Handlers
  const handleOptionSelect = (optionId: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const currentAnswer = answers[currentQ.id] || {
      selectedOptionIds: [],
      essayAnswer: "",
      isDoubtful: false,
    };

    let newSelected: string[];

    if (currentQ.type === "MULTIPLE_RESPONSE") {
      // Multiple response (Checkbox logic)
      if (currentAnswer.selectedOptionIds.includes(optionId)) {
        newSelected = currentAnswer.selectedOptionIds.filter((id) => id !== optionId);
      } else {
        newSelected = [...currentAnswer.selectedOptionIds, optionId];
      }
    } else {
      // Single choice
      newSelected = [optionId];
    }

    const updated = {
      ...currentAnswer,
      selectedOptionIds: newSelected,
    };

    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: updated,
    }));

    // Save to LocalStorage immediately
    localStorage.setItem(`owlcbt_${examId}_${currentQ.id}`, JSON.stringify(updated));

    // Debounced autosave to server
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      saveAnswerToServer(currentQ.id, updated);
    }, 400);
  };

  const handleEssayChange = (text: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const currentAnswer = answers[currentQ.id] || {
      selectedOptionIds: [],
      essayAnswer: "",
      isDoubtful: false,
    };

    const updated = {
      ...currentAnswer,
      essayAnswer: text,
    };

    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: updated,
    }));

    // Debounced autosave
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      saveAnswerToServer(currentQ.id, updated);
    }, 800);
  };

  const toggleDoubtful = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    const currentAnswer = answers[currentQ.id] || {
      selectedOptionIds: [],
      essayAnswer: "",
      isDoubtful: false,
    };

    const updated = {
      ...currentAnswer,
      isDoubtful: !currentAnswer.isDoubtful,
    };

    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: updated,
    }));

    saveAnswerToServer(currentQ.id, updated);
  };

  // 6. Submit Exam
  const handleAutoSubmit = () => {
    submitExam();
  };

  const submitExam = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/exam/${examId}/finish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Gagal menyerahkan ujian.");
      router.push(`/exam/${examId}/result`);
    } catch (err: any) {
      alert(err.message || "Gagal menyelesaikan ujian. Periksa koneksi Anda.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <p className="text-sm font-medium text-slate-300">Menyiapkan lembar ujian...</p>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const currentAns = currentQ ? answers[currentQ.id] : null;

  // Formatting Timer
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // Font size classes
  const fontClass =
    fontSize === "xlarge"
      ? "text-xl sm:text-2xl leading-relaxed"
      : fontSize === "large"
      ? "text-lg sm:text-xl leading-relaxed"
      : "text-base sm:text-lg leading-normal";

  // Palette counts
  let answeredCount = 0;
  let doubtfulCount = 0;
  questions.forEach((q) => {
    const a = answers[q.id];
    if (a?.isDoubtful) {
      doubtfulCount++;
    } else if (
      (a?.selectedOptionIds && a.selectedOptionIds.length > 0) ||
      (a?.essayAnswer && a.essayAnswer.trim() !== "")
    ) {
      answeredCount++;
    }
  });
  const unansweredCount = questions.length - answeredCount - doubtfulCount;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col select-none">
      {/* 1. TOP STICKY APP BAR */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-sm px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: Exam Info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
            OWL
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {exam?.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {student?.name} • {student?.class}
            </p>
          </div>
        </div>

        {/* Center: Live Timer Badge */}
        <div className="flex items-center">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full font-mono text-sm sm:text-base font-bold shadow-inner ${
              remainingSeconds < 180
                ? "bg-rose-500 text-white animate-pulse"
                : remainingSeconds < 600
                ? "bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700"
                : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700"
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>{timeFormatted}</span>
          </div>
        </div>

        {/* Right: Autosave Status, Font Size & Palette Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Autosave Status Pill */}
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            {saveStatus === "saving" ? (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
              </span>
            ) : saveStatus === "saved" ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <Check className="w-3.5 h-3.5" /> Tersimpan
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-600 font-medium">
                Koneksi Terganggu
              </span>
            )}
          </div>

          {/* Font Size Adjuster */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700 text-xs">
            <button
              onClick={() => setFontSize("normal")}
              className={`px-2 py-1 rounded-md font-bold ${
                fontSize === "normal"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Ukuran Font Normal"
            >
              A
            </button>
            <button
              onClick={() => setFontSize("large")}
              className={`px-2 py-1 rounded-md font-bold text-sm ${
                fontSize === "large"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Ukuran Font Besar"
            >
              A+
            </button>
            <button
              onClick={() => setFontSize("xlarge")}
              className={`px-2 py-1 rounded-md font-bold text-base ${
                fontSize === "xlarge"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Ukuran Font Ekstra Besar"
            >
              A++
            </button>
          </div>

          {/* Question Palette Toggle Button */}
          <button
            onClick={() => setIsPaletteOpen(!isPaletteOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/80 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Daftar Soal</span>
          </button>
        </div>
      </header>

      {/* Violation Alert Banner */}
      {violationAlert && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2 mx-auto">
            <ShieldAlert className="w-4 h-4" />
            <span>{violationAlert}</span>
          </div>
          <button onClick={() => setViolationAlert(null)} className="p-1 hover:bg-rose-700 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. MAIN EXAM WORKSPACE */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* LEFT / CENTER: QUESTION SHEET (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col gap-5">
          {/* Question Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8">
            {/* Question Top Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  Soal No. {currentIndex + 1} dari {questions.length}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {currentQ?.type === "MULTIPLE_CHOICE"
                    ? "Pilihan Ganda"
                    : currentQ?.type === "MULTIPLE_RESPONSE"
                    ? "Pilihan Ganda Kompleks"
                    : "Esai / Uraian"}
                </span>
              </div>

              {currentAns?.isDoubtful && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5" /> Ragu-Ragu
                </span>
              )}
            </div>

            {/* Question Content */}
            <div
              className={`text-slate-900 dark:text-slate-100 mb-8 font-normal ${fontClass}`}
              dangerouslySetInnerHTML={{ __html: currentQ?.content || "" }}
            />

            {/* Question Media (if any) */}
            {currentQ?.mediaUrl && (
              <div className="mb-6 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-w-lg">
                <img
                  src={currentQ.mediaUrl}
                  alt="Media Soal"
                  className="w-full object-contain max-h-72 bg-slate-50 dark:bg-slate-800"
                />
              </div>
            )}

            {/* Options or Essay Area */}
            {currentQ?.type === "ESSAY" ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Tuliskan Jawaban Anda:
                </label>
                <textarea
                  value={currentAns?.essayAnswer || ""}
                  onChange={(e) => handleEssayChange(e.target.value)}
                  placeholder="Ketik jawaban esai Anda secara lengkap di sini..."
                  rows={8}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base leading-relaxed"
                />
                <p className="text-[11px] text-slate-400 text-right mt-1.5">
                  {(currentAns?.essayAnswer || "").length} Karakter
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentQ?.options.map((opt) => {
                  const isSelected =
                    currentAns?.selectedOptionIds?.includes(opt.id) || false;

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleOptionSelect(opt.id)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-600 dark:border-indigo-500 shadow-sm ring-1 ring-indigo-500"
                          : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/80 dark:hover:bg-slate-800"
                      }`}
                    >
                      {/* Option Label Badge (A, B, C...) */}
                      <span
                        className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-bold text-sm transition-colors ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {opt.label}
                      </span>

                      {/* Option Text Content */}
                      <div className="flex-1 pt-1">
                        <div
                          className={`text-slate-800 dark:text-slate-200 ${
                            fontSize === "xlarge"
                              ? "text-lg"
                              : fontSize === "large"
                              ? "text-base"
                              : "text-sm sm:text-base"
                          }`}
                          dangerouslySetInnerHTML={{ __html: opt.content }}
                        />
                      </div>

                      {/* Selection Check Indicator */}
                      <div className="pt-1.5">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-600 text-white"
                              : "border-slate-300 dark:border-slate-600"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Toolbar Below Question */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm flex items-center justify-between gap-3">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Soal Sebelumnya</span>
            </button>

            {/* Doubtful Toggle */}
            <button
              onClick={toggleDoubtful}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                currentAns?.isDoubtful
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                  : "bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Ragu-Ragu</span>
            </button>

            {/* Next or Finish Button */}
            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() =>
                  setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))
                }
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01]"
              >
                <span className="hidden sm:inline">Soal Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.01]"
              >
                <span>Selesaikan Ujian</span>
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* RIGHT: QUESTION PALETTE SIDEBAR (1 Col Desktop / Off-canvas Mobile) */}
        <div
          className={`lg:block ${
            isPaletteOpen ? "fixed inset-0 z-50 p-4 bg-black/50 backdrop-blur-sm flex items-center justify-center" : "hidden"
          }`}
        >
          <div className="w-full max-w-sm lg:max-w-none bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl lg:shadow-sm p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-indigo-600" />
                Navigasi Nomor Soal
              </h3>
              {isPaletteOpen && (
                <button
                  onClick={() => setIsPaletteOpen(false)}
                  className="lg:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Status Legend */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-[10px] text-center font-medium">
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                <span className="font-bold text-xs block">{answeredCount}</span>
                Dijawab
              </div>
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50">
                <span className="font-bold text-xs block">{doubtfulCount}</span>
                Ragu-Ragu
              </div>
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-xs block">{unansweredCount}</span>
                Belum
              </div>
            </div>

            {/* Question Numbers Grid */}
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-5 gap-2.5 py-1">
                {questions.map((q, idx) => {
                  const a = answers[q.id];
                  const isCurrent = idx === currentIndex;
                  const isDoubtful = a?.isDoubtful;
                  const isAnswered =
                    (a?.selectedOptionIds && a.selectedOptionIds.length > 0) ||
                    (a?.essayAnswer && a.essayAnswer.trim() !== "");

                  let btnStyle =
                    "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";

                  if (isDoubtful) {
                    btnStyle =
                      "bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-500/30";
                  } else if (isAnswered) {
                    btnStyle =
                      "bg-emerald-600 text-white border-emerald-700 shadow-sm shadow-emerald-600/30";
                  }

                  if (isCurrent) {
                    btnStyle += " ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900";
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setIsPaletteOpen(false);
                      }}
                      className={`h-10 rounded-xl font-bold text-xs border transition-all flex items-center justify-center hover:scale-105 ${btnStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Exam Button inside Palette */}
            <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => {
                  setIsPaletteOpen(false);
                  setShowSubmitModal(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                Selesaikan Ujian
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SUBMISSION CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Konfirmasi Selesai Ujian
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 leading-relaxed">
              Pastikan Anda telah memeriksa seluruh jawaban sebelum mengakhiri ujian. Setelah diserahkan, Anda tidak dapat mengubah jawaban kembali.
            </p>

            {/* Status Summary */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-700/60 mb-5 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Soal Terjawab:</span>
                <strong className="text-emerald-600 font-bold">{answeredCount} Soal</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Soal Ragu-ragu:</span>
                <strong className="text-amber-600 font-bold">{doubtfulCount} Soal</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Soal Belum Dijawab:</span>
                <strong className="text-slate-700 dark:text-slate-300 font-bold">
                  {unansweredCount} Soal
                </strong>
              </div>
            </div>

            {/* Checkbox agreement */}
            <label className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer mb-6 select-none">
              <input
                type="checkbox"
                checked={confirmCheckbox}
                onChange={(e) => setConfirmCheckbox(e.target.checked)}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Saya menyatakan telah selesai mengerjakan dan yakin untuk mengumpulkan ujian ini.</span>
            </label>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowSubmitModal(false);
                  setConfirmCheckbox(false);
                }}
                disabled={isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Periksa Kembali
              </button>
              <button
                type="button"
                onClick={submitExam}
                disabled={!confirmCheckbox || isSubmitting}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Menyerahkan...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Kirim Jawaban
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
