"use client";

import { ReactNode } from "react";
import DashboardSidebar, { UserSessionInfo } from "./DashboardSidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  user: UserSessionInfo | null;
  schoolName?: string;
}

export default function DashboardLayout({
  children,
  user,
  schoolName,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col">
      <DashboardSidebar user={user} schoolName={schoolName} />
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 print:pl-0">
        {children}
      </div>
    </div>
  );
}
