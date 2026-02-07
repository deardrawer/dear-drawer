import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  STORY_SYSTEM_PROMPT,
  buildStoryPrompt,
} from "@/lib/openrouter";
import { verifyToken, getAuthCookieName } from "@/lib/auth";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface GenerateRequest {
  type: "couple_intro" | "our_story" | "interview";
  answers: Record<string, string>;
  groomName: string;
  brideName: string;
}

export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const cookieName = getAuthCookieName();
    const token = request.cookies.get(cookieName)?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const authPayload = await verifyToken(token);
    if (!authPayload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body: GenerateRequest = await request.json();
    const { type, answers, groomName, brideName } = body;

    if (!type || !answers || !groomName || !brideName) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }

    const userPrompt = buildStoryPrompt(type, answers, groomName, brideName);

    const message = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 2000,
      system: STORY_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const textContent = message.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("AI 응답에서 텍스트를 찾을 수 없습니다.");
    }

    return NextResponse.json({ content: textContent.text });
  } catch (error) {
    console.error("Story generation error:", error);

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: 'AI 서비스 오류가 발생했습니다.' },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: '스토리 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
