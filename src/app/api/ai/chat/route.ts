import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, messages } = await request.json();

    if (!projectId || !messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Geçersiz istek. projectId ve messages gerekli." },
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
        { error: "Bu projeye erişim yetkiniz yok." },
        { status: 403 }
      );
    }

    const project = membership.project;
    const userRole = membership.role;
    const userName = session.user.name;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "" || apiKey === "AIzaSy...") {
      return NextResponse.json({
        reply: "Merhaba! Benim tam kapasiteyle (gerçek yapay zeka ile) çalışabilmem için proje ayarlarından geçerli bir Google Gemini API Anahtarı eklenmesi gerekiyor. Şu anda sadece bu otomatik mesajı verebiliyorum.",
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

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction,
    });

    // Format messages for Gemini Chat (excluding system messages)
    const formattedHistory = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1].content;

    const chat = model.startChat({
      history: formattedHistory,
    });

    const result = await chat.sendMessage(lastMessage);
    const responseText = result.response.text();

    return NextResponse.json({ reply: responseText });
  } catch (error) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Yapay zeka ile iletişim kurulurken bir hata oluştu." },
      { status: 500 }
    );
  }
}
