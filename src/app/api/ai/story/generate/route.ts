import { NextRequest, NextResponse } from "next/server";
import {
  callOpenRouter,
  STORY_SYSTEM_PROMPT,
  buildStoryPrompt,
} from "@/lib/openrouter";

export const runtime = "edge";

interface GenerateRequest {
  type: "couple_intro" | "our_story" | "interview";
  answers: Record<string, string>;
  groomName: string;
  brideName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { type, answers, groomName, brideName } = body;

    if (!type || !answers || !groomName || !brideName) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    const userPrompt = buildStoryPrompt(type, answers, groomName, brideName);

    const content = await callOpenRouter([
      { role: "system", content: STORY_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ]);

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Story generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `스토리 생성 중 오류가 발생했습니다: ${errorMessage}` },
      { status: 500 }
    );
  }
}
