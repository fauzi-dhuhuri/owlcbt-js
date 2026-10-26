import { cookies } from "next/headers";
import prisma from "@/lib/prisma";

/**
 * Data payload yang tersimpan dalam HTTP-only cookie 'auth_session'.
 */
export interface AuthSession {
  id: string;
  username: string;
  name: string;
  role: "ADMIN" | "TEACHER" | "PROCTOR" | "STUDENT";
}

/**
 * Mengambil data sesi pengguna yang saat ini sedang login
 * berdasarkan cookie HTTP-only 'auth_session'.
 *
 * @returns {Promise<AuthSession | null>} Objek AuthSession jika valid, atau null jika belum login
 */
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

/**
 * Route guard khusus untuk portal siswa.
 *
 * Mengambil data siswa lengkap beserta relasi kelasnya.
 * Memastikan bahwa pengguna yang login benar-benar berstatus sebagai siswa (role: STUDENT).
 * Jika login sebagai Guru, Proktor, atau Admin, fungsi ini mengembalikan null.
 *
 * @returns {Promise<User | null>} Data siswa lengkap atau null jika bukan siswa
 */
export async function getCurrentStudent() {
  const currentUser = await getCurrentUser();

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

/**
 * Route guard khusus untuk staf sekolah (Guru, Proktor, Administrator).
 *
 * Menolak akses jika pengguna belum login atau login sebagai Siswa (role: STUDENT).
 *
 * @returns {Promise<User | null>} Data pengguna staf atau null jika siswa/belum login
 */
export async function getCurrentStaff() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role === "STUDENT") {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
  });
  return user;
}

/**
 * Route guard berkeamanan tinggi khusus Administrator utama.
 *
 * Hanya mengizinkan pengguna dengan role ADMIN.
 * Digunakan untuk melindungi Master Data Siswa, Guru, Pengaturan Sekolah, dan Impor File.
 *
 * @returns {Promise<User | null>} Data admin atau null jika bukan role ADMIN
 */
export async function getCurrentAdmin() {
  const currentUser = await getCurrentUser();

  if (!currentUser || currentUser.role !== "ADMIN") {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
  });
  return user;
}
