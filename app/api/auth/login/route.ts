import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username/NISN dan password wajib diisi." },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim();

    // Cari user di database
    const user = await prisma.user.findUnique({
      where: { username: cleanUsername },
      include: { class: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan atau akun sedang dinonaktifkan." },
        { status: 401 }
      );
    }

    // Verifikasi password dengan bcrypt
    const isValidPassword = await bcrypt.compare(String(password), user.passwordHash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: "Password yang Anda masukkan salah." },
        { status: 401 }
      );
    }

    // Buat session payload
    const sessionData = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      className: user.class?.name || null,
    };

    const cookieStore = await cookies();

    // Simpan auth_session cookie
    cookieStore.set("auth_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: "/",
    });

    // Jika siswa, set juga student_username untuk backwards compatibility
    if (user.role === "STUDENT") {
      cookieStore.set("student_username", user.username, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });
    }

    // Tentukan URL tujuan berdasarkan role
    let redirectTo = "/";
    if (user.role === "ADMIN") {
      redirectTo = "/admin/students";
    } else if (user.role === "TEACHER") {
      redirectTo = "/teacher";
    } else if (user.role === "PROCTOR") {
      redirectTo = "/proctor";
    }

    return NextResponse.json({
      success: true,
      message: "Login berhasil",
      user: sessionData,
      redirectTo,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan pada sistem autentikasi." }, { status: 500 });
  }
}
