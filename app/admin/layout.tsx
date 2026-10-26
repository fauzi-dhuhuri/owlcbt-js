import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import DashboardLayout from "@/components/DashboardLayout";
import {
  ShieldAlert,
  ArrowLeft,
  GraduationCap,
  Monitor,
  BookOpen,
  Lock,
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  const setting = await prisma.systemSetting.findFirst();

  // 1. Jika belum login sama sekali, arahkan ke login
  if (!user) {
    redirect("/login?redirect=/admin/students");
  }

  // 2. Jika login BUKAN sebagai ADMIN (misal: GURU, PROKTOR, SISWA), blokir akses Master Data!
  if (user.role !== "ADMIN") {
    const roleLabels: Record<string, string> = {
      TEACHER: "Guru / Tenaga Pendidik",
      PROCTOR: "Proktor / Pengawas Ujian",
      STUDENT: "Siswa Peserta Ujian",
    };

    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-950/90 border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          {/* Title & Warning */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              Akses Master Data Terbatas
            </div>
            <h1 className="text-xl font-black text-white">
              Akses Ditolak (403 Forbidden)
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Menu <strong>Master Data</strong> (Data Siswa, Data Guru &amp; Staf, serta Cetak Administrasi) hanya dapat diakses oleh <strong>Administrator Sistem CBT</strong> untuk menjaga integritas dan privasi data sekolah.
            </p>
          </div>

          {/* User Info Card */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-left text-xs space-y-1">
            <div className="text-[11px] text-slate-500">Akun Anda saat ini:</div>
            <div className="font-bold text-white flex items-center justify-between">
              <span>{user.name}</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 font-semibold text-[10px] border border-amber-500/20">
                {roleLabels[user.role] || user.role}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">Username: {user.username}</div>
          </div>

          {/* Action Navigation Buttons */}
          <div className="space-y-2 pt-2">
            {user.role === "TEACHER" && (
              <Link
                href="/teacher"
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
              >
                <BookOpen className="w-4 h-4" />
                <span>Buka Portal Jadwal &amp; Bank Soal Guru</span>
              </Link>
            )}

            {user.role === "PROCTOR" && (
              <Link
                href="/proctor"
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-violet-600/30 transition-all"
              >
                <Monitor className="w-4 h-4" />
                <span>Buka Konsol Pengawasan Proktor</span>
              </Link>
            )}

            {user.role === "STUDENT" && (
              <Link
                href="/"
                className="w-full py-3 px-4 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Kembali ke Halaman Ujian Siswa</span>
              </Link>
            )}

            <Link
              href="/login"
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800 flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ganti Akun / Login Administrator</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. User adalah ADMIN: izinkan masuk dengan Sidebar Layout
  return (
    <DashboardLayout user={user} schoolName={setting?.schoolName}>
      {children}
    </DashboardLayout>
  );
}
