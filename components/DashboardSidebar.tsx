"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  Users,
  UserCheck,
  Printer,
  Calendar,
  BookOpen,
  FileCheck,
  Award,
  Monitor,
  ExternalLink,
  LogOut,
  Menu,
  X,
  Shield,
  Layers,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export interface UserSessionInfo {
  id: string;
  username: string;
  name: string;
  role: "ADMIN" | "TEACHER" | "PROCTOR" | "STUDENT";
  className?: string | null;
}

interface DashboardSidebarProps {
  user: UserSessionInfo | null;
  schoolName?: string;
}

export default function DashboardSidebar({ user, schoolName = "SMA Owl Nusantara" }: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const role = user?.role || "ADMIN";
  const isAdmin = role === "ADMIN";
  const isTeacher = role === "TEACHER" || role === "ADMIN";
  const isProctor = role === "PROCTOR" || role === "ADMIN";

  const handleLogout = async () => {
    if (!confirm("Apakah Anda yakin ingin keluar dari sistem?")) return;
    try {
      setLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch {
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  };

  const roleBadges = {
    ADMIN: { label: "Administrator", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
    TEACHER: { label: "Guru Pengajar", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    PROCTOR: { label: "Proktor Ujian", color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
    STUDENT: { label: "Siswa Peserta", color: "bg-sky-500/10 text-sky-400 border-sky-500/20" },
  };

  const navContent = (
    <div className="flex flex-col h-full bg-slate-950 text-slate-200 border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <Link href={isAdmin ? "/admin/students" : isTeacher ? "/teacher" : "/proctor"} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                OwlCBT
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[150px] leading-tight mt-0.5">
              {schoolName}
            </p>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Profile Info Card */}
      <div className="p-4 mx-3 my-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 text-white flex items-center justify-center font-bold text-sm shadow-md">
            {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white truncate leading-tight">
              {user?.name || "Administrator"}
            </h4>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span
                className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${
                  roleBadges[role]?.color || "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {roleBadges[role]?.label || role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6 text-xs custom-scrollbar">
        {/* GROUP 1: MASTER DATA (STRICTLY FOR ADMIN ONLY) */}
        {isAdmin && (
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400/90 flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-rose-500" />
                Master Data (Admin)
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">
                Terkunci
              </span>
            </div>
            <nav className="space-y-1">
              <Link
                href="/admin/students"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all ${
                  pathname.startsWith("/admin/students")
                    ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Data Siswa &amp; Kelas</span>
                </div>
                {pathname.startsWith("/admin/students") && (
                  <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                )}
              </Link>

              <Link
                href="/admin/teachers"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all ${
                  pathname.startsWith("/admin/teachers")
                    ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  <span>Data Guru &amp; Staf</span>
                </div>
                {pathname.startsWith("/admin/teachers") && (
                  <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                )}
              </Link>

              <Link
                href="/admin/print/cards"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all ${
                  pathname.startsWith("/admin/print")
                    ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Printer className="w-4 h-4 text-indigo-400" />
                  <span>Cetak Administrasi</span>
                </div>
                {pathname.startsWith("/admin/print") && (
                  <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                )}
              </Link>
            </nav>
          </div>
        )}

        {/* GROUP 2: MANAJEMEN UJIAN (ADMIN & GURU) */}
        {isTeacher && (
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-400/90 flex items-center gap-1.5">
                <Layers className="w-3 h-3 text-indigo-400" />
                Manajemen Ujian
              </span>
            </div>
            <nav className="space-y-1">
              <Link
                href="/teacher"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all ${
                  pathname === "/teacher" || pathname.startsWith("/teacher/bank")
                    ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>Jadwal &amp; Bank Soal</span>
                </div>
                {(pathname === "/teacher" || pathname.startsWith("/teacher/bank")) && (
                  <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                )}
              </Link>
            </nav>
          </div>
        )}

        {/* GROUP 3: PENGAWASAN UJIAN (ADMIN & PROKTOR) */}
        {isProctor && (
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-400/90 flex items-center gap-1.5">
                <Monitor className="w-3 h-3 text-violet-400" />
                Pengawasan Ujian
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <nav className="space-y-1">
              <Link
                href="/proctor"
                onClick={() => setMobileOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all ${
                  pathname.startsWith("/proctor")
                    ? "bg-violet-600 text-white font-bold shadow-md shadow-violet-600/30"
                    : "text-slate-300 hover:text-white hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Monitor className="w-4 h-4 text-violet-400" />
                  <span>Monitoring Peserta Live</span>
                </div>
                {pathname.startsWith("/proctor") && (
                  <ChevronRight className="w-3.5 h-3.5 text-white/80" />
                )}
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-600/20 border border-rose-500/20 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>{loggingOut ? "Mengeluarkan..." : "Keluar dari Sistem"}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Navbar with Hamburger */}
      <div className="lg:hidden sticky top-0 z-40 bg-slate-950 border-b border-slate-800 text-white px-4 h-14 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-xl bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
            aria-label="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-tight text-white">OwlCBT</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              v2.0
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400 truncate max-w-[120px]">
            {user?.name || "User"}
          </span>
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
            {user?.name?.charAt(0) || "U"}
          </div>
        </div>
      </div>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex print:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30 print:hidden shadow-xl">
        {navContent}
      </aside>
    </>
  );
}
