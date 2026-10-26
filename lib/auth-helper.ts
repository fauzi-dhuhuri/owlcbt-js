import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

export interface AuthSession {
  id: string;
  username: string;
  name: string;
  role: "ADMIN" | "TEACHER" | "PROCTOR" | "STUDENT";
}

export async function getCurrentUser(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("auth_session")?.value;
    if (!sessionCookie) return null;

    return JSON.parse(sessionCookie) as AuthSession;
  } catch {
    return null;
  }
}

export async function getCurrentStudent() {
  const currentUser = await getCurrentUser();

  // Hanya izinkan jika user yang login saat ini memiliki role STUDENT
  if (currentUser) {
    if (currentUser.role !== "STUDENT") {
      return null;
    }

    const student = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { class: true },
    });
    return student;
  }

  // Fallback cadangan khusus cookie student_username jika belum ada session auth_session
  try {
    const cookieStore = await cookies();
    const usernameCookie = cookieStore.get("student_username")?.value;
    if (usernameCookie) {
      const student = await prisma.user.findFirst({
        where: {
          username: usernameCookie,
          role: "STUDENT",
        },
        include: {
          class: true,
        },
      });
      return student;
    }
  } catch {}

  return null;
}

export async function getCurrentStaff() {
  const currentUser = await getCurrentUser();

  // Ditolak jika belum login atau login sebagai SISWA
  if (!currentUser || currentUser.role === "STUDENT") {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
  });
  return user;
}

export async function getCurrentAdmin() {
  const currentUser = await getCurrentUser();

  // Ditolak jika belum login atau role bukan ADMIN
  if (!currentUser || currentUser.role !== "ADMIN") {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
  });
  return user;
}


