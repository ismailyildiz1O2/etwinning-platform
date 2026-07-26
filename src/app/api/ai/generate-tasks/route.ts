import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { TemplateTask } from "@/lib/etwinning-template";

interface GenerateTasksRequest {
  topic: string;
  ageGroup: string;
  productType: string;
  digitalTools: string;
  durationMonths: number;
}

// Smart fallback task generation when no AI API key is available
function generateFallbackTasks(info: GenerateTasksRequest): {
  phase2Tasks: TemplateTask[];
  phase3Tasks: TemplateTask[];
} {
  const product = info.productType || "joint product";
  const tools = info.digitalTools || "digital tools";
  const topic = info.topic || "project topic";

  const phase2Tasks: TemplateTask[] = [
    { title: `Determine research subtopics for each school regarding "${topic}"`, priority: "high", order: 1 },
    { title: `Collect local data and materials related to ${topic}`, priority: "high", order: 2 },
    { title: `Document collected information with photos, videos, or text`, priority: "high", order: 3 },
    { title: `Digitize research findings using ${tools}`, priority: "medium", order: 4 },
    { title: `Prepare quizzes or questions about partner schools' work`, priority: "medium", order: 5 },
    { title: `Organize an international knowledge sharing event`, priority: "medium", order: 6 },
    { title: `Upload Phase 2 materials and research to TwinSpace`, priority: "low", order: 7 },
  ];

  const phase3Tasks: TemplateTask[] = [
    { title: `Form mixed international student teams from different partner countries`, priority: "high", order: 1 },
    { title: `Define responsibilities for each team within the scope of ${topic}`, priority: "high", order: 2 },
    { title: `Start collaborative content creation for the joint ${product}`, priority: "high", order: 3 },
    { title: `Work collaboratively on the joint ${product} using ${tools}`, priority: "medium", order: 4 },
    { title: `Conduct AI-assisted text editing and translation processes`, priority: "medium", order: 5 },
    { title: `Finalize the joint ${product} and upload to TwinSpace`, priority: "high", order: 6 },
    { title: `Host an inter-team peer feedback session`, priority: "medium", order: 7 },
  ];

  return { phase2Tasks, phase3Tasks };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: GenerateTasksRequest = await request.json();

    if (!body.topic) {
      return NextResponse.json(
        { error: "Project topic is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Fallback if no Gemini key
    if (!apiKey) {
      return NextResponse.json(generateFallbackTasks(body));
    }

    try {
      const prompt = `You are an expert eTwinning project mentor. Generate actionable, high-quality project tasks in ENGLISH.
Topic: ${body.topic}
Target Age Group: ${body.ageGroup}
Joint Product: ${body.productType}
Digital Tools: ${body.digitalTools}
Duration: ${body.durationMonths} months

Generate:
- Phase 2 (Research & Content Creation): 5 to 7 specific tasks in English.
- Phase 3 (International Collaborative Production): 5 to 7 specific tasks in English focusing on mixed international teams.

Respond ONLY with valid JSON in this exact structure:
{
  "phase2Tasks": [
    { "title": "Task title in English", "priority": "high"|"medium"|"low", "order": 1 }
  ],
  "phase3Tasks": [
    { "title": "Task title in English", "priority": "high"|"medium"|"low", "order": 1 }
  ]
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" },
          }),
        }
      );

      if (!response.ok) {
        return NextResponse.json(generateFallbackTasks(body));
      }

      const resData = await response.json();
      const text = resData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        return NextResponse.json(generateFallbackTasks(body));
      }

      const parsed = JSON.parse(text);
      return NextResponse.json({
        phase2Tasks: parsed.phase2Tasks || [],
        phase3Tasks: parsed.phase3Tasks || [],
      });
    } catch {
      return NextResponse.json(generateFallbackTasks(body));
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate tasks" },
      { status: 500 }
    );
  }
}
