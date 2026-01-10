import { NextRequest, NextResponse } from "next/server";
import { getAuthCookieName } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const cookieName = getAuthCookieName();

    const response = NextResponse.json({ success: true });

    // Clear the auth cookie
    response.cookies.set(cookieName, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Expire immediately
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
