import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request) {
  const { username, password } = await request.json();

  const validUser = process.env.SUPER_ADMIN_USER;
  const validPass = process.env.SUPER_ADMIN_PASS;

  if (username === validUser && password === validPass) {
    const cookieStore = await cookies();
    cookieStore.set("super_admin_session", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false }, { status: 401 });
}

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete("super_admin_session");
  return NextResponse.json({ success: true });
}
