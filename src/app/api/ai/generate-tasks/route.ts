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
  const productLabels: Record<string, string> = {
    ebook: "e-kitap",
    video: "video/kısa film",
    exhibition: "sergi",
    map: "dijital harita",
    game: "dijital oyun/quiz",
    website: "web sitesi/blog",
    magazine: "dijital dergi",
    podcast: "podcast",
    presentation: "sunum/infografik",
    other: "ortak ürün",
  };
  
  const product = productLabels[info.productType] || info.productType;
  const tools = info.digitalTools || "dijital araçlar";
  const topic = info.topic || "proje konusu";

  const phase2Tasks: TemplateTask[] = [
    { title: `Her okulun "${topic}" konusunda araştırma alt başlığını belirlemesi`, priority: "high", order: 1 },
    { title: `Öğrencilerin ${topic} ile ilgili yerel veri ve materyal toplaması`, priority: "high", order: 2 },
    { title: `Toplanan bilgilerin fotoğraf, video veya metin olarak belgelenmesi`, priority: "high", order: 3 },
    { title: `${tools} kullanarak araştırma sonuçlarının dijital ortama aktarılması`, priority: "medium", order: 4 },
    { title: `Öğrencilerin diğer ülkelerin çalışmaları hakkında quiz/soru hazırlaması`, priority: "medium", order: 5 },
    { title: `Uluslararası bilgi paylaşım etkinliğinin düzenlenmesi`, priority: "medium", order: 6 },
    { title: `Bu aşamanın çalışmalarının TwinSpace'e yüklenmesi`, priority: "low", order: 7 },
  ];

  const phase3Tasks: TemplateTask[] = [
    { title: `Farklı ülkelerden öğrencilerin karma çalışma gruplarına ayrılması`, priority: "high", order: 1 },
    { title: `Her grubun ${topic} kapsamındaki sorumluluk alanının belirlenmesi`, priority: "high", order: 2 },
    { title: `Grupların ortak ${product} için içerik üretmeye başlaması`, priority: "high", order: 3 },
    { title: `${tools} kullanarak ortak ${product} üzerinde işbirlikli çalışma`, priority: "medium", order: 4 },
    { title: `Yapay zeka destekli metin düzenleme ve çeviri süreçlerinin yürütülmesi`, priority: "medium", order: 5 },
    { title: `Ortak ${product} çalışmasının tamamlanması ve TwinSpace'e yüklenmesi`, priority: "high", order: 6 },
    { title: `Gruplar arası geri bildirim oturumunun yapılması`, priority: "medium", order: 7 },
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
        { error: "Proje konusu/teması zorunludur" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    // If we have an Anthropic API key, use Claude for AI generation
    if (apiKey) {
      try {
        const productLabels: Record<string, string> = {
          ebook: "e-kitap", video: "video/kısa film", exhibition: "sergi",
          map: "dijital harita", game: "dijital oyun/quiz", website: "web sitesi/blog",
          magazine: "dijital dergi", podcast: "podcast", presentation: "sunum/infografik",
          other: "ortak ürün",
        };
        const product = productLabels[body.productType] || body.productType;
        
        const systemPrompt = `Sen bir eTwinning proje asistanısın. Görevin, öğretmenlere proje aşamalarında uygulanabilir, somut görev listeleri üretmek.
Yanıtlarını YALNIZCA geçerli JSON formatında döndürürsün, başka hiçbir şey yazmazsın.`;

        const userPrompt = `Bir eTwinning projesi için Aşama 2 (Araştırma ve İçerik Üretimi) ve Aşama 3 (Uluslararası İşbirlikli Üretim) görevlerini oluştur.

Proje Bilgileri:
- Konu/Tema: ${body.topic}
- Hedef Yaş Grubu: ${body.ageGroup}
- Ortak Ürün Türü: ${product}
- Kullanılacak Dijital Araçlar: ${body.digitalTools || "Belirtilmemiş"}
- Proje Süresi: ${body.durationMonths} ay

Kurallar:
1. Her aşama için tam olarak 7 görev üret
2. Her görev somut ve uygulanabilir olsun
3. Görevler yaş grubuna uygun olsun
4. Aşama 2 görevleri: konunun araştırılması, veri toplanması, içerik üretilmesi odaklı
5. Aşama 3 görevleri: uluslararası karma takımlarla ortak ${product} üretimi odaklı
6. Her görevin priority değeri "high", "medium" veya "low" olsun

JSON formatı:
{
  "phase2Tasks": [
    { "title": "Görev açıklaması", "priority": "high", "order": 1 }
  ],
  "phase3Tasks": [
    { "title": "Görev açıklaması", "priority": "high", "order": 1 }
  ]
}`;

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 2000,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.content?.[0]?.text;
          if (content) {
            // Try to parse the JSON from AI response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              return NextResponse.json({
                phase2Tasks: parsed.phase2Tasks || [],
                phase3Tasks: parsed.phase3Tasks || [],
                source: "ai",
              });
            }
          }
        }
        // If AI fails, fall through to fallback
      } catch (aiError) {
        console.error("AI generation failed, using fallback:", aiError);
      }
    }

    // Fallback: generate tasks using template logic
    const result = generateFallbackTasks(body);
    return NextResponse.json({
      ...result,
      source: "template",
    });
  } catch (error) {
    console.error("Error generating tasks:", error);
    return NextResponse.json(
      { error: "Görev oluşturma sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}
