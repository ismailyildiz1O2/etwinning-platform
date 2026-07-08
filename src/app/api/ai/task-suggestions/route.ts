import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface TaskSuggestionRequest {
  taskTitle: string;
  taskDescription?: string;
  phaseTitle?: string;
  projectName?: string;
}

interface Suggestion {
  id: string;
  text: string;
  type: "tip" | "resource" | "activity" | "tool";
  icon: string;
}

function generateId(): string {
  return `sug_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function generateFallbackSuggestions(input: TaskSuggestionRequest): Suggestion[] {
  const title = (input.taskTitle || "").toLowerCase();
  const description = (input.taskDescription || "").toLowerCase();
  const combined = `${title} ${description}`;

  // --- araştırma (research) ---
  if (combined.includes("araştırma") || combined.includes("arastirma")) {
    return [
      { id: generateId(), text: "Öğrencilere güvenilir kaynak kullanımı konusunda mini bir eğitim verin. Wikipedia yerine akademik kaynaklar ve resmi kurumların web sitelerini tercih etmelerini sağlayın.", type: "tip", icon: "🔍" },
      { id: generateId(), text: "Araştırma bulgularını paylaşmak için ortak bir Padlet veya Google Jamboard panosu oluşturun. Her okul kendi bölümünü doldursun.", type: "tool", icon: "📌" },
      { id: generateId(), text: "Öğrencilerin araştırma sürecini belgelemesi için bir 'Araştırma Günlüğü' şablonu hazırlayın: kaynak, tarih, öğrenilen bilgi.", type: "resource", icon: "📓" },
      { id: generateId(), text: "Her okulun araştırma sonuçlarını 3 dakikalık kısa video sunumlarla paylaşacağı bir 'Mini Konferans' etkinliği planlayın.", type: "activity", icon: "🎤" },
      { id: generateId(), text: "Araştırma konularını alt başlıklara bölerek her partner okula farklı bir alt başlık atayın. Böylece tekrardan kaçınıp derinlemesine içerik üretilir.", type: "tip", icon: "💡" },
    ];
  }

  // --- tanışma (icebreaker) ---
  if (combined.includes("tanışma") || combined.includes("tanisma") || combined.includes("icebreaker") || combined.includes("kendini tanıt")) {
    return [
      { id: generateId(), text: "Her öğrencinin kendini tanıtan 60 saniyelik bir video çekmesini sağlayın. Videoları Flipgrid veya TwinSpace'te paylaşın.", type: "activity", icon: "🎬" },
      { id: generateId(), text: "Ortak bir 'Tahmin Et Kim?' oyunu düzenleyin: her öğrenci 3 ilginç bilgi paylaşsın, diğerleri kime ait olduğunu tahmin etsin.", type: "activity", icon: "🎲" },
      { id: generateId(), text: "Canva veya Book Creator ile 'Hakkımda' dijital kartları oluşturun. İsim, hobiler, favori yemek, hayalindeki meslek gibi bilgiler ekleyin.", type: "tool", icon: "🎨" },
      { id: generateId(), text: "İlk tanışma toplantısı için Zoom/Teams'te küçük gruplar (breakout rooms) oluşturun. 4-5 kişilik gruplar daha rahat iletişim sağlar.", type: "tip", icon: "💬" },
      { id: generateId(), text: "Ortak bir sınıf haritası oluşturun: Google My Maps üzerinde her okulun konumunu işaretleyin ve kısa tanıtım notları ekleyin.", type: "resource", icon: "🗺️" },
    ];
  }

  // --- toplantı (meeting) ---
  if (combined.includes("toplantı") || combined.includes("toplanti") || combined.includes("meeting") || combined.includes("görüşme")) {
    return [
      { id: generateId(), text: "Toplantı öncesinde ortak bir gündem belgesi paylaşın. Her partner okulun gündem maddeleri eklemesini sağlayın.", type: "tip", icon: "📋" },
      { id: generateId(), text: "Saat farkı olan ortaklarla çalışıyorsanız World Time Buddy aracını kullanarak herkes için uygun ortak zaman dilimi belirleyin.", type: "tool", icon: "🕐" },
      { id: generateId(), text: "Toplantı notlarını otomatik olarak almak için Otter.ai veya Microsoft Teams'in transkript özelliğini kullanın.", type: "tool", icon: "📝" },
      { id: generateId(), text: "Her toplantının sonunda bir sonraki adımları ve sorumlulukları netleştiren bir 'Eylem Planı' oluşturun.", type: "tip", icon: "✅" },
      { id: generateId(), text: "Öğrencilerin toplantıda aktif katılımını sağlamak için Mentimeter veya Slido ile interaktif anketler ve soru-cevap oturumları ekleyin.", type: "activity", icon: "📊" },
    ];
  }

  // --- anket / değerlendirme (survey / evaluation) ---
  if (combined.includes("anket") || combined.includes("değerlendirme") || combined.includes("degerlendirme") || combined.includes("survey") || combined.includes("form")) {
    return [
      { id: generateId(), text: "Google Forms veya Microsoft Forms ile çok dilli anketler oluşturun. Her soruyu birden fazla dilde yazarak tüm ortakların anlamasını sağlayın.", type: "tool", icon: "📊" },
      { id: generateId(), text: "Anket sonuçlarını görselleştirmek için Canva Infographic veya Google Data Studio kullanın. Veriler böylece daha anlaşılır olur.", type: "tool", icon: "📈" },
      { id: generateId(), text: "Proje sürecini değerlendirmek için öğrencilere 'KWL Tablosu' (Biliyorum-Merak Ediyorum-Öğrendim) kullandırın.", type: "resource", icon: "📋" },
      { id: generateId(), text: "Ara değerlendirme anketi ekleyin: 'Bu aşamada en çok ne öğrendin?', 'Hangi zorlukları yaşadın?', 'Önerin nedir?' gibi açık uçlu sorular sorun.", type: "tip", icon: "💡" },
      { id: generateId(), text: "Akran değerlendirmesi için rubrik oluşturun. Öğrencilerin birbirlerinin çalışmalarını yapıcı geri bildirimle değerlendirmesini sağlayın.", type: "activity", icon: "🤝" },
    ];
  }

  // --- fotoğraf / video (media) ---
  if (combined.includes("fotoğraf") || combined.includes("fotograf") || combined.includes("video") || combined.includes("film") || combined.includes("medya")) {
    return [
      { id: generateId(), text: "Öğrencilere fotoğraf çekerken 'üçte bir kuralı' ve iyi aydınlatma gibi temel kompozisyon ipuçlarını öğretin.", type: "tip", icon: "📷" },
      { id: generateId(), text: "Video düzenleme için CapCut, iMovie veya Clipchamp gibi ücretsiz ve öğrenci dostu araçlar kullanın.", type: "tool", icon: "🎬" },
      { id: generateId(), text: "KVKK ve GDPR uyumluluğu için fotoğraf/video izin formlarını önceden hazırlayıp velilerden onay alın.", type: "tip", icon: "🔒" },
      { id: generateId(), text: "Ortak bir fotoğraf yarışması düzenleyin: her okul proje temasına uygun en iyi 5 fotoğrafını seçip oylama yapın.", type: "activity", icon: "🏆" },
      { id: generateId(), text: "Fotoğraf ve videoları düzenli saklamak için Google Drive veya OneDrive'da paylaşımlı bir klasör yapısı oluşturun (ülke/tarih/etkinlik).", type: "resource", icon: "📁" },
    ];
  }

  // --- e-kitap (ebook) ---
  if (combined.includes("e-kitap") || combined.includes("kitap") || combined.includes("ebook") || combined.includes("book creator")) {
    return [
      { id: generateId(), text: "Book Creator, StoryJumper veya Ourboox kullanarak interaktif e-kitaplar oluşturun. Ses, video ve animasyon eklenebilir.", type: "tool", icon: "📚" },
      { id: generateId(), text: "Her partner okula e-kitabın bir bölümünü atayın. Sonunda tüm bölümleri birleştirerek uluslararası ortak bir eser ortaya çıkarın.", type: "tip", icon: "✍️" },
      { id: generateId(), text: "E-kitaba QR kodlar ekleyin: her sayfadaki QR kod ek videolara, ses kayıtlarına veya interaktif içeriğe yönlendirsin.", type: "resource", icon: "📱" },
      { id: generateId(), text: "E-kitabın kapak tasarımı için bir tasarım yarışması düzenleyin. Tüm ortaklar oy kullansın.", type: "activity", icon: "🎨" },
      { id: generateId(), text: "Tamamlanan e-kitabı Issuu veya Calaméo'da yayınlayarak geniş bir kitleyle paylaşın ve proje görünürlüğünü artırın.", type: "tip", icon: "🌐" },
    ];
  }

  // --- sergi / sunum (exhibition / presentation) ---
  if (combined.includes("sergi") || combined.includes("sunum") || combined.includes("presentation") || combined.includes("infografik")) {
    return [
      { id: generateId(), text: "Sanal sergi için Artsteps veya Kunstmatrix platformlarını kullanarak 3D sanal galeri oluşturun.", type: "tool", icon: "🏛️" },
      { id: generateId(), text: "Canva, Genially veya Prezi ile interaktif sunumlar hazırlayın. Statik slaytlar yerine tıklanabilir ve animasyonlu içerikler tercih edin.", type: "tool", icon: "🖥️" },
      { id: generateId(), text: "Sergi/sunum günü için velileri ve okul yönetimini davet eden dijital davetiyeler hazırlayın. Bu, projenin görünürlüğünü artırır.", type: "tip", icon: "✉️" },
      { id: generateId(), text: "Her okulun sergi köşesini temsil eden kısa tanıtım videoları çekin ve sunum öncesinde sosyal medyada paylaşın.", type: "activity", icon: "📢" },
      { id: generateId(), text: "Infografik oluşturmak için Piktochart veya Venngage kullanın. Proje verilerini ve öğrenme çıktılarını görsel olarak özetleyin.", type: "resource", icon: "📊" },
    ];
  }

  // --- logo / afiş / tasarım (design) ---
  if (combined.includes("logo") || combined.includes("afiş") || combined.includes("afis") || combined.includes("tasarım") || combined.includes("tasarim") || combined.includes("design")) {
    return [
      { id: generateId(), text: "Logo tasarımı için Canva, Adobe Express veya LogoMakr gibi ücretsiz araçlar kullanın. Öğrencilere temel tasarım ilkelerini (renk uyumu, sadelik) anlatın.", type: "tool", icon: "🎨" },
      { id: generateId(), text: "Her okuldan logo/afiş önerileri toplayın ve tüm ortakların katıldığı demokratik bir oylama yapın.", type: "activity", icon: "🗳️" },
      { id: generateId(), text: "Tasarımlarda proje temasını, ortaklık ruhunu ve kültürel çeşitliliği yansıtan semboller kullanmaya özen gösterin.", type: "tip", icon: "💡" },
      { id: generateId(), text: "Tasarım sürecini belgelemek için 'Tasarım Günlüğü' tutun: ilk eskizler, geri bildirimler, revizyonlar ve final versiyonu.", type: "resource", icon: "📓" },
      { id: generateId(), text: "Tüm tasarımlarda tutarlı bir renk paleti ve yazı tipi kullanın. Brand kit oluşturmak projeye profesyonel bir görünüm kazandırır.", type: "tip", icon: "🖌️" },
    ];
  }

  // --- güvenlik / e-güvenlik (digital safety) ---
  if (combined.includes("güvenlik") || combined.includes("guvenlik") || combined.includes("e-güvenlik") || combined.includes("safety") || combined.includes("gizlilik")) {
    return [
      { id: generateId(), text: "Öğrencilere çevrimiçi güvenlik kurallarını öğretmek için Common Sense Education'ın dijital vatandaşlık müfredatını kullanın.", type: "resource", icon: "🛡️" },
      { id: generateId(), text: "Kişisel bilgi paylaşımı konusunda net kurallar belirleyin: gerçek adres, telefon numarası gibi bilgiler kesinlikle paylaşılmamalı.", type: "tip", icon: "🔒" },
      { id: generateId(), text: "Siber zorbalık farkındalık posteri oluşturma etkinliği düzenleyin. Her okul kendi dilinde posterler hazırlayıp paylaşsın.", type: "activity", icon: "🚫" },
      { id: generateId(), text: "Güçlü şifre oluşturma, iki faktörlü kimlik doğrulama ve güvenli internet kullanımı konusunda interaktif bir quiz hazırlayın.", type: "activity", icon: "🔐" },
      { id: generateId(), text: "Telif hakkı ve Creative Commons lisansları hakkında öğrencileri bilgilendirin. Projede kullanılan tüm görsellerin lisans durumunu kontrol ettirin.", type: "tip", icon: "©️" },
    ];
  }

  // --- kalite etiketi (quality label) ---
  if (combined.includes("kalite etiketi") || combined.includes("quality label") || combined.includes("kalite")) {
    return [
      { id: generateId(), text: "Kalite etiketi başvurusunda proje sürecini kronolojik olarak belgeleyin: planlama, uygulama, değerlendirme ve yaygınlaştırma aşamalarını net gösterin.", type: "tip", icon: "🏅" },
      { id: generateId(), text: "TwinSpace'i düzenli tutun: sayfaları aşamalara göre organize edin, öğrenci çalışmalarını ve işbirliği kanıtlarını sistematik olarak yükleyin.", type: "tip", icon: "📂" },
      { id: generateId(), text: "Öğrenci ve öğretmen değerlendirme anketlerini muhakkak ekleyin. Proje öncesi-sonrası karşılaştırma yapabilen ölçme araçları güçlü kanıt sağlar.", type: "resource", icon: "📊" },
      { id: generateId(), text: "Proje çıktılarını yerel ve ulusal medyada, okul web sitesinde ve sosyal medyada paylaşarak yaygınlaştırma kanıtları oluşturun.", type: "activity", icon: "📰" },
      { id: generateId(), text: "Müfredat entegrasyonunu belgeleyin: hangi derslerde, hangi kazanımlarla ilişkilendirildiğini gösteren bir tablo hazırlayın.", type: "resource", icon: "📚" },
    ];
  }

  // --- twinspace ---
  if (combined.includes("twinspace") || combined.includes("twin space")) {
    return [
      { id: generateId(), text: "TwinSpace'te her proje aşaması için ayrı sayfalar oluşturun. Net bir navigasyon yapısı hem öğrenciler hem değerlendiriciler için kolaylık sağlar.", type: "tip", icon: "📑" },
      { id: generateId(), text: "TwinSpace forumlarını aktif kullanın: her hafta bir tartışma konusu belirleyerek öğrenciler arası etkileşimi artırın.", type: "activity", icon: "💬" },
      { id: generateId(), text: "Öğrencileri TwinSpace'e yönetici olarak ekleyin, böylece kendi içeriklerini yükleyebilir ve sayfalarda düzenleme yapabilirler.", type: "tip", icon: "👥" },
      { id: generateId(), text: "TwinSpace'in 'Materyal' bölümüne ortak çalışma şablonları, rubrikler ve planlama dokümanları yükleyin.", type: "resource", icon: "📎" },
      { id: generateId(), text: "TwinSpace günlük/blog özelliğini kullanarak proje sürecini düzenli olarak kayıt altına alın.", type: "resource", icon: "📝" },
    ];
  }

  // --- harita (map) ---
  if (combined.includes("harita") || combined.includes("map") || combined.includes("coğrafya") || combined.includes("cografya")) {
    return [
      { id: generateId(), text: "Google My Maps ile interaktif bir proje haritası oluşturun. Her partner okulun konumuna tıklandığında okul tanıtımı ve öğrenci çalışmaları görünsün.", type: "tool", icon: "🗺️" },
      { id: generateId(), text: "StoryMapJS kullanarak proje hikayenizi harita üzerinden anlatın. Her konum bir proje aşamasını veya etkinliği temsil edebilir.", type: "tool", icon: "📍" },
      { id: generateId(), text: "Öğrencilerin kendi bölgelerindeki önemli noktaları fotoğraflayıp haritaya eklemelerini sağlayın. Kültürel miras, doğal güzellikler vb.", type: "activity", icon: "📸" },
      { id: generateId(), text: "Harita üzerinde karşılaştırmalı veri gösterimi yapın: iklim, nüfus, gelenek gibi verileri görselleştirerek kültürler arası farkındalık oluşturun.", type: "resource", icon: "📊" },
      { id: generateId(), text: "Tamamlanan dijital haritayı proje web sitesine veya TwinSpace'e embed ederek interaktif bir şekilde paylaşın.", type: "tip", icon: "🌐" },
    ];
  }

  // --- Default: general project management tips ---
  return [
    { id: generateId(), text: "Bu görev için net bir zaman çizelgesi ve kilometre taşları belirleyin. Küçük, ölçülebilir hedefler motivasyonu artırır.", type: "tip", icon: "📅" },
    { id: generateId(), text: "Görevle ilgili ilerlemeyi takip etmek için TwinSpace'te bir kontrol listesi (checklist) oluşturun.", type: "resource", icon: "✅" },
    { id: generateId(), text: "Bu görev için tüm ortaklardan en az bir öğrencinin aktif katılımını sağlayın. Sorumluluk paylaşımı işbirliğini güçlendirir.", type: "tip", icon: "🤝" },
    { id: generateId(), text: "Görev tamamlandığında kısa bir yansıtma (reflection) etkinliği yapın: 'Ne iyi gitti? Ne geliştirebiliriz?' sorularını tartışın.", type: "activity", icon: "🪞" },
    { id: generateId(), text: "Görevi belgelemek için ekran görüntüleri, fotoğraflar ve kısa notlar alın. Bu materyaller kalite etiketi başvurusunda çok değerli olacaktır.", type: "tip", icon: "📸" },
  ];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: TaskSuggestionRequest = await request.json();

    if (!body.taskTitle) {
      return NextResponse.json(
        { error: "taskTitle is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // If we have an API key, use Gemini for AI suggestions
    if (apiKey) {
      try {
        const systemPrompt = `Sen bir eTwinning proje asistanısın. Öğretmenlere görev bazında pratik, uygulanabilir öneriler sunuyorsun.
Yanıtlarını YALNIZCA geçerli JSON formatında döndürürsün, başka hiçbir şey yazmazsın.
Her öneri Türkçe olmalıdır.`;

        const userPrompt = `Aşağıdaki eTwinning proje görevi için en fazla 5 öneri üret.

Görev: ${body.taskTitle}
${body.taskDescription ? `Açıklama: ${body.taskDescription}` : ""}
${body.phaseTitle ? `Aşama: ${body.phaseTitle}` : ""}
${body.projectName ? `Proje: ${body.projectName}` : ""}

Her öneri şu formatta olmalı:
- text: Detaylı, uygulanabilir öneri metni (Türkçe)
- type: "tip" | "resource" | "activity" | "tool" (önerinin türü)
- icon: Uygun bir emoji

Kurallar:
1. En fazla 5 öneri üret
2. Öneriler somut ve uygulanabilir olsun
3. eTwinning projeleri bağlamında anlamlı olsun
4. Farklı türlerde öneriler ver (sadece tip değil, tool, activity, resource da olsun)

JSON formatı:
{
  "suggestions": [
    { "text": "Öneri metni", "type": "tip", "icon": "💡" }
  ]
}`;

        const { generateContentWithGemini } = await import("@/lib/ai");
        const content = await generateContentWithGemini(userPrompt, systemPrompt);

        if (content) {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            const suggestions: Suggestion[] = (parsed.suggestions || [])
              .slice(0, 5)
              .map((s: { text: string; type: string; icon: string }) => ({
                id: generateId(),
                text: s.text,
                type: s.type as Suggestion["type"],
                icon: s.icon || "💡",
              }));

            return NextResponse.json({
              suggestions,
              source: "ai",
            });
          }
        }
        // If AI fails or returns invalid JSON, fall through to fallback
      } catch (aiError) {
        console.error("AI suggestion generation failed, using fallback:", aiError);
      }
    }

    // Fallback: generate suggestions using keyword matching
    const suggestions = generateFallbackSuggestions(body);
    return NextResponse.json({
      suggestions,
      source: "fallback",
    });
  } catch (error) {
    console.error("Error generating task suggestions:", error);
    return NextResponse.json(
      { error: "Öneri oluşturma sırasında bir hata oluştu" },
      { status: 500 }
    );
  }
}
