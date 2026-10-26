"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

export default function StudentLogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (confirm("Apakah Anda yakin ingin keluar dari Portal Siswa?")) {
      setLoading(true);
      try {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      } catch (err) {
        console.error("Logout failed:", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="ml-1 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline transition-colors disabled:opacity-50"
      title="Keluar dari sesi ujian"
    >
      {loading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <LogOut className="w-3 h-3" />
      )}
      <span>Keluar</span>
    </button>
  );
}
