import { NextResponse } from "next/server";
import { getPublicStats } from "@/lib/db";

export async function GET() {
  try {
    const stats = await getPublicStats();

    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { totalCount: 47, weeklyCount: 0 },
      { status: 200 }
    );
  }
}
