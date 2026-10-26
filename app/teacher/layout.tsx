import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import DashboardLayout from "@/components/DashboardLayout";

export default async function TeacherLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  const setting = await prisma.systemSetting.findFirst();

  if (!user) {
    redirect("/login?redirect=/teacher");
  }

  // Siswa dilarang masuk ke panel guru
  if (user.role === "STUDENT") {
    redirect("/");
  }

  // Proktor diarahkan ke konsol proktor
  if (user.role === "PROCTOR") {
    redirect("/proctor");
  }

  return (
    <DashboardLayout user={user} schoolName={setting?.schoolName}>
      {children}
    </DashboardLayout>
  );
}
