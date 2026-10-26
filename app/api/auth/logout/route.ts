import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_session");
  cookieStore.delete("student_username");

  return NextResponse.json({
    success: true,
    message: "Logout berhasil",
  });
}
