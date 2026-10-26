import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-helper";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({
    authenticated: !!user,
    user,
  });
}
