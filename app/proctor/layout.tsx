import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helper";
import prisma from "@/lib/prisma";
import DashboardLayout from "@/components/DashboardLayout";

export default async function ProctorLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  const setting = await prisma.systemSetting.findFirst();

  if (!user) {
    redirect("/login?redirect=/proctor");
  }

  // Siswa dilarang masuk ke konsol proktor
  if (user.role === "STUDENT") {
    redirect("/");
  }

  return (
    <DashboardLayout user={user} schoolName={setting?.schoolName}>
      {children}
    </DashboardLayout>
  );
}
