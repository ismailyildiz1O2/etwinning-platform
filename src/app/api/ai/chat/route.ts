import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { chatWithGemini, isGeminiConfigured, type ChatTurn } from "@/lib/ai";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, messages } = await request.json();

    if (!projectId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request. projectId and messages are required." },
        { status: 400 }
      );
    }

    // Verify membership
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: session.user.id },
      },
      include: {
        project: {
          include: {
            phases: {
              include: {
                tasks: {
                  where: { deletedAt: null },
                  select: { title: true, isCompleted: true },
                },
              },
            },
          },
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "You do not have permission to access this project." },
        { status: 403 }
      );
    }

    const project = membership.project;
    const userRole = membership.role;
    const userName = session.user.name;

    if (!isGeminiConfigured()) {
      return NextResponse.json({
        reply: "Hello! For me to work at full capacity (with real AI), a valid Google Gemini API Key needs to be added from the project settings. Currently I can only give this automated message.",
      });
    }

    // Prepare project context
    const completedTasks = project.phases.flatMap(p => p.tasks).filter(t => t.isCompleted).length;
    const totalTasks = project.phases.flatMap(p => p.tasks).length;

    const systemInstruction = `Sen eTwinning projesi "${project.name}" için özel bir asistan ve tercümansın.
Kullanıcı Adı: ${userName}
Kullanıcı Rolü: ${userRole === "student" ? "Öğrenci" : "Öğretmen"}
Proje Konusu/Açıklaması: ${project.description || "Belirtilmemiş"}
Proje Durumu: ${totalTasks} görevin ${completedTasks}'i tamamlanmış.

Görevlerin:
1. Öğrencilere veya öğretmenlere proje ile ilgili sorularında kibar, cesaretlendirici ve eğitici cevaplar vermek.
2. Eğer kullanıcı bir cümleyi çevirmeni isterse (örn: "bunu ingilizceye çevir"), yabancı ortaklarla iletişim kurabilmeleri için en doğal ve doğru çeviriyi sunmak.
3. Proje görevleri hakkında bilgi istenirse, mevcut durumu göz önüne alarak yönlendirme yapmak.
4. Yanıtlarını kısa, samimi ve anlaşılır tutmak.
`;

    // Format previous turns for Gemini chat (the last message is sent separately)
    const history: ChatTurn[] = messages.slice(0, -1).map((msg: { role: string; content: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      text: msg.content,
    }));

    const lastMessage = messages[messages.length - 1].content;

    const responseText = await chatWithGemini(history, lastMessage, systemInstruction);

    if (!responseText) {
      return NextResponse.json(
        { error: "The AI assistant is temporarily unavailable. Please try again." },
        { status: 503 }
      );
    }

    return NextResponse.json({ reply: responseText });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "An error occurred while communicating with the AI." },
      { status: 500 }
    );
  }
}
