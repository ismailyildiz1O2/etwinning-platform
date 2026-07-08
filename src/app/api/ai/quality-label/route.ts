import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { QUALITY_LABEL_CRITERIA } from "@/lib/constants";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Verify project membership
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: session.user.id,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden: You are not a member of this project" }, { status: 403 });
    }

    // Fetch project with all related data
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        phases: {
          include: {
            tasks: {
              include: {
                notes: true,
                files: true,
              }
            }
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Extract relevant data for the prompt
    let projectContext = `Proje Adı: ${project.name}\nProje Açıklaması: ${project.description || "Belirtilmemiş"}\n\n`;
    projectContext += "Aşamalar ve Görevler:\n";

    const criteriaTags: Record<string, any[]> = {};
    QUALITY_LABEL_CRITERIA.forEach(c => criteriaTags[c.id] = []);

    project.phases.forEach((phase: any) => {
      projectContext += `- ${phase.title}\n`;
      phase.tasks.forEach((task: any) => {
        projectContext += `  * Görev: ${task.title} (Durum: ${task.isCompleted ? 'Tamamlandı' : 'Devam Ediyor'})\n`;
        if (task.description) {
          projectContext += `    Açıklama: ${task.description}\n`;
        }
        
        let tags: string[] = [];
        try { tags = JSON.parse(task.tags || "[]"); } catch {}
        
        tags.forEach(t => {
          if (criteriaTags[t]) {
            criteriaTags[t].push({
              taskTitle: task.title,
              filesCount: task.files.length,
              notesCount: task.notes.length
            });
          }
        });
      });
    });

    projectContext += "\nKalite Etiketi Kriterlerine Göre Analiz:\n";
    QUALITY_LABEL_CRITERIA.forEach(c => {
      projectContext += `${c.label}: ${criteriaTags[c.id].length} görev bu kriterle etiketlenmiş.\n`;
      criteriaTags[c.id].forEach(item => {
        projectContext += `  - Görev: ${item.taskTitle} (${item.filesCount} kanıt dosyası, ${item.notesCount} not)\n`;
      });
    });

    // Generate AI draft
    const { generateContentWithGemini } = await import("@/lib/ai");
    
    const prompt = `
Aşağıda bir eTwinning projesinin detayları, aşamaları, görevleri ve eTwinning Kalite Etiketi kriterlerine göre sınıflandırılmış kanıt bilgileri yer almaktadır.

${projectContext}

Bu bilgileri kullanarak resmi bir eTwinning Kalite Etiketi başvuru metni taslağı oluştur.
Metin profesyonel, net ve ikna edici olmalı.
Aşağıdaki ana başlıkları içermelidir:
1. Projenin Kısa Özeti
2. İşbirliği ve Ortak Okullar Arası İletişim
3. Pedagojik Yenilikçilik ve Yaratıcılık
4. Müfredatla Entegrasyon
5. Teknoloji Kullanımı (Web 2.0 vb.)
6. Sonuçlar, Etki ve Değerlendirme

Her başlık altında, projede gerçekleştirilen somut etkinlikleri (görevleri) örnek olarak göster.
Sadece taslağı ver, ekstra markdown (\`\`\` vb.) veya açıklama kullanma, dümdüz metin olsun.
`;

    let draft = await generateContentWithGemini(prompt);

    if (!draft) {
      // Fallback: Generate a structured template from project context
      draft = `KALİTE ETİKETİ BAŞVURU TASLAĞI (Otomatik Şablon)

1. Projenin Kısa Özeti
${project.name} projesi başarıyla yürütülmüştür. ${project.description || "Proje hedeflerine ulaşılmıştır."}

2. İşbirliği ve Ortak Okullar Arası İletişim
Projemiz boyunca okullar arası yoğun işbirliği yapılmıştır. ${criteriaTags['collaboration']?.length || 0} adet işbirlikçi görev tamamlanmıştır.

3. Pedagojik Yenilikçilik ve Yaratıcılık
Projede yenilikçi öğretim yöntemleri kullanılmıştır. ${criteriaTags['innovation']?.length || 0} adet görev pedagojik yenilikçilik içermektedir.

4. Müfredatla Entegrasyon
Proje etkinlikleri okul müfredatıyla başarılı bir şekilde entegre edilmiştir. ${criteriaTags['curriculum']?.length || 0} adet görev doğrudan müfredatla ilişkilendirilmiştir.

5. Teknoloji Kullanımı (Web 2.0 vb.)
Öğrencilerimiz çeşitli Web 2.0 araçlarını güvenli ve etkili bir şekilde kullanmıştır. ${criteriaTags['technology']?.length || 0} adet teknoloji odaklı görev tamamlanmıştır.

6. Sonuçlar, Etki ve Değerlendirme
Projemiz öğrenci ve öğretmenler üzerinde kalıcı bir olumlu etki bırakmıştır. ${criteriaTags['results']?.length || 0} adet sonuç odaklı etkinlik yapılmıştır.

Lütfen bu taslağı kendi proje detaylarınız ve kanıt linkleriniz ile genişletiniz.`;
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error("AI draft generation error:", error);
    return NextResponse.json({ error: "Failed to generate draft" }, { status: 500 });
  }
}
