import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateJsonWithGemini, isGeminiConfigured } from "@/lib/ai";

export interface PhaseTaskSuggestion {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

interface PhaseSuggestionsRequest {
  phaseId: string;
  locale?: "en" | "tr";
}

// Template fallback used when Gemini is not configured or fails
function generateFallbackSuggestions(
  phaseTitle: string,
  projectName: string,
  locale: "en" | "tr"
): PhaseTaskSuggestion[] {
  if (locale === "tr") {
    return [
      {
        title: `${phaseTitle} için ortak okullarla çevrim içi tanışma toplantısı düzenle`,
        description: `${projectName} projesinin bu aşamasında ortak okullarla bir video görüşme planlayın ve beklentileri netleştirin.`,
        priority: "high",
      },
      {
        title: "Öğrencilerle karma ülke takımları oluştur",
        description: "Her takımda farklı ülkelerden öğrenciler olacak şekilde gruplar kurun ve görev paylaşımı yapın.",
        priority: "high",
      },
      {
        title: "Ortak bir dijital pano (Padlet) aç ve öğrenci çalışmalarını topla",
        description: "Bu aşamadaki tüm ürünlerin tek bir yerde toplanması için ortak bir pano oluşturun.",
        priority: "medium",
      },
      {
        title: "Aşama sonunda öğrencilerle kısa bir değerlendirme anketi yap",
        description: "Mentimeter veya Google Forms ile öğrencilerin geri bildirimlerini alın ve sonuçları TwinSpace'e ekleyin.",
        priority: "medium",
      },
      {
        title: "Aşama kanıtlarını (fotoğraf, video, ürün) TwinSpace'e yükle",
        description: "Kalite Etiketi başvurusu için bu aşamada üretilen tüm kanıtları belgeleyin.",
        priority: "low",
      },
    ];
  }

  return [
    {
      title: `Hold an online kick-off meeting with partner schools for ${phaseTitle}`,
      description: `Plan a video call with partner schools for this phase of ${projectName} and agree on expectations.`,
      priority: "high",
    },
    {
      title: "Form mixed-country student teams",
      description: "Create groups with students from different countries in each team and share responsibilities.",
      priority: "high",
    },
    {
      title: "Open a shared digital board (Padlet) to collect student work",
      description: "Set up a common board so that every product of this phase is gathered in one place.",
      priority: "medium",
    },
    {
      title: "Run a short evaluation survey with students at the end of the phase",
      description: "Collect student feedback with Mentimeter or Google Forms and add the results to TwinSpace.",
      priority: "medium",
    },
    {
      title: "Upload phase evidence (photos, videos, products) to TwinSpace",
      description: "Document every piece of evidence produced in this phase for the Quality Label application.",
      priority: "low",
    },
  ];
}

// POST /api/ai/phase-suggestions - Suggest new tasks for a phase using Gemini
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: PhaseSuggestionsRequest = await request.json();
    if (!body.phaseId) {
      return NextResponse.json({ error: "phaseId is required" }, { status: 400 });
    }
    const locale: "en" | "tr" = body.locale === "tr" ? "tr" : "en";

    const phase = await prisma.phase.findUnique({
      where: { id: body.phaseId },
      include: {
        project: { select: { id: true, name: true, description: true } },
        tasks: {
          where: { deletedAt: null, parentId: null },
          select: { title: true, isCompleted: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!phase) {
      return NextResponse.json({ error: "Phase not found" }, { status: 404 });
    }

    // Verify project membership (students may not generate tasks)
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: phase.project.id, userId: session.user.id },
      },
    });
    if (!membership) {
      return NextResponse.json({ error: "Forbidden: You are not a member of this project" }, { status: 403 });
    }
    if (membership.role === "student") {
      return NextResponse.json({ error: "Students cannot generate task suggestions" }, { status: 403 });
    }

    const fallback = () =>
      NextResponse.json({
        suggestions: generateFallbackSuggestions(phase.title, phase.project.name, locale),
        source: "fallback",
      });

    if (!isGeminiConfigured()) {
      return fallback();
    }

    const { web2Tools } = await import("@/lib/web2-tools");
    const toolNames = web2Tools.map((t) => t.name).join(", ");
    const existingTasks = phase.tasks.length
      ? phase.tasks.map((t) => `- ${t.title}${t.isCompleted ? " (done)" : ""}`).join("\n")
      : "- (none yet)";

    const language = locale === "tr" ? "Turkish" : "English";

    const systemPrompt = `You are an experienced eTwinning project mentor helping teachers plan collaborative international school projects.
You suggest concrete, actionable tasks that fit the given project phase.
Prefer the Web 2.0 tools available on this platform when a tool is relevant: ${toolNames}.
Always answer ONLY with valid JSON. Every text field must be written in ${language}.`;

    const userPrompt = `Project: ${phase.project.name}
Project description: ${phase.project.description || "(not provided)"}
Phase: ${phase.title}${phase.description ? `\nPhase description: ${phase.description}` : ""}

Existing tasks in this phase (do NOT repeat these):
${existingTasks}

Suggest exactly 5 NEW tasks for this phase. Requirements:
- Each task must be specific, realistic for teachers and students, and meaningful in an eTwinning context.
- Cover different aspects: collaboration between partner schools, student activities, digital tools, evaluation/evidence.
- Do not duplicate or paraphrase the existing tasks.

Return JSON in this exact structure:
{
  "suggestions": [
    { "title": "Short task title", "description": "1-2 sentences explaining how to do it", "priority": "high" | "medium" | "low" }
  ]
}`;

    const parsed = await generateJsonWithGemini<{ suggestions?: Partial<PhaseTaskSuggestion>[] }>(
      userPrompt,
      systemPrompt
    );

    const suggestions: PhaseTaskSuggestion[] = (parsed?.suggestions || [])
      .filter((s) => s && typeof s.title === "string" && s.title.trim())
      .slice(0, 5)
      .map((s) => ({
        title: s.title!.trim(),
        description: typeof s.description === "string" ? s.description.trim() : "",
        priority: s.priority === "high" || s.priority === "low" ? s.priority : "medium",
      }));

    if (suggestions.length === 0) {
      return fallback();
    }

    return NextResponse.json({ suggestions, source: "ai" });
  } catch (error) {
    console.error("Phase suggestion error:", error);
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 });
  }
}
