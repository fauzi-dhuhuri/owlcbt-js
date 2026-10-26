import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helper";

export default async function ExamLayout({
  children,
}: {
  children: ReactNode;
}) {
  const currentUser = await getCurrentUser();

  // 1. Belum login -> arahkan ke halaman login
  if (!currentUser) {
    redirect("/login");
  }

  // 2. Administrator, Guru, dan Proktor TIDAK BISA mengakses ruang ujian siswa
  if (currentUser.role === "ADMIN") {
    redirect("/admin/students");
  }
  if (currentUser.role === "TEACHER") {
    redirect("/teacher");
  }
  if (currentUser.role === "PROCTOR") {
    redirect("/proctor");
  }

  // 3. Hanya siswa yang diizinkan berada di ruang ujian
  return <>{children}</>;
}
