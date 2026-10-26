import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helper";

/**
 * Endpoint Pemeriksaan Sesi Login Aktif Pengguna.
 *
 * Mengembalikan data identitas pengguna yang sedang terotentikasi.
 */
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({
    authenticated: !!user,
    user,
  });
}
