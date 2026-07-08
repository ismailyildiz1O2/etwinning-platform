# eTwin Asistan — Yayın Öncesi Düzeltme Promptu

> 8 Temmuz 2026 tarihli inceleme sonucu tespit edilen 6 sorunu düzelttirmek için hazırlanmıştır.

---

Sen deneyimli bir full-stack geliştiricisin. `etwinning-platform` (eTwin Asistan) projesinde, yapılan son incelemede tespit edilen 6 sorunu düzelteceksin. Proje yayına (Vercel) hazırlanıyor; şu an `npm run build` başarısız oluyor ve bir güvenlik açığı var.

### Zorunlu Hazırlık

1. `AGENTS.md` uyarısını dikkate al: Bu projedeki Next.js 16.x, eğitim verindekinden farklı olabilir. Kod yazmadan önce `node_modules/next/dist/docs/` altındaki ilgili rehberleri oku (özellikle `01-app/02-guides/upgrading/version-16.md` ve `01-app/03-api-reference/03-file-conventions/src-folder.md`).
2. Prisma 7 kullanılıyor; istemci seçeneklerini `node_modules/.prisma/client/index.d.ts` içindeki `PrismaClientOptions` tipinden doğrula — eğitim verindeki Prisma API'sine güvenme.
3. Mevcut kod kalıplarına uy: soft delete, her API rotasında `ProjectMember` üyelik kontrolü, ActivityLog kaydı, Türkçe arayüz metinleri.

### Düzeltilecek Sorunlar (öncelik sırasıyla)

**1. Build hatası — Prisma 7 istemci yapılandırması (KRİTİK)**
`src/lib/prisma.ts` içinde `new PrismaClient({ datasourceUrl: ... })` kullanılıyor; Prisma 7'de `datasourceUrl` seçeneği yok ve TypeScript derlemesi bu yüzden başarısız oluyor. Prisma 7'de bağlantı `adapter` seçeneğiyle verilir (eski kod `@prisma/adapter-better-sqlite3` ile aynı kalıbı kullanıyordu). PostgreSQL/Neon için `@prisma/adapter-neon` (serverless ortama uygun, tercih edilen) veya `@prisma/adapter-pg` paketini kur ve adapter'ı `DATABASE_URL` ile yapılandırıp `PrismaClient`'a ver. Düzeltme sonrası `npm run build` hatasız tamamlanmalı ve `npm run dev` ile bir sayfa açıp gerçek bir veritabanı sorgusunun çalıştığını doğrula.

**2. Middleware çalışmıyor — yanlış konum ve deprecated API (KRİTİK)**
`middleware.ts` proje kökünde duruyor; ancak bu proje `src/` klasörü kullandığı için Next.js bu dosyayı görmüyor — oturumsuz kullanıcılar login'e yönlendirilmiyor. Ayrıca Next.js 16'da `middleware` dosya adı deprecated edildi; yeni ad `proxy` (dosya: `src/proxy.ts`, fonksiyon adı: `proxy`, runtime: nodejs — edge desteklenmiyor). Yerel Next dokümanındaki upgrade rehberine göre dosyayı `src/proxy.ts` olarak taşı ve API'yi güncelle. Dikkat: mevcut kod `next-auth/middleware`'den `withAuth` kullanıyor — bunun proxy konvansiyonu ve nodejs runtime altında çalıştığını test et; çalışmıyorsa NextAuth JWT token kontrolünü (`getToken` ile) elle yapan bir proxy fonksiyonu yaz. Matcher mevcut mantığı korumalı: `api/auth`, `auth`, `_next/static`, `_next/image`, `favicon.ico` hariç her şey korumalı. Doğrulama: dev sunucuda oturumsuz olarak `/dashboard`'a istek at, `/auth/login`'e yönlendirildiğini gör.

**3. Kalite Etiketi AI rotasında yetki açığı (GÜVENLİK)**
`src/app/api/ai/quality-label/route.ts` yalnızca oturum kontrolü yapıyor, proje üyeliği kontrolü yapmıyor — giriş yapmış herhangi bir kullanıcı, üyesi olmadığı projelerin tüm görev/not verisini çekebiliyor. Projenin diğer rotalarındaki kalıpla aynı şekilde `ProjectMember` kontrolü ekle; üye değilse 403 dön. Ayrıca `GEMINI_API_KEY` boşken rota 500 dönüyor: diğer AI rotalarındaki (`generate-tasks`, `task-suggestions`) fallback kalıbına uygun olarak, anahtar yoksa proje verisinden şablon tabanlı bir başvuru taslağı üreten akıllı fallback ekle — kullanıcı hata değil, kullanılabilir bir taslak görmeli.

**4. Eksik ortam değişkenleri — özellikler sessizce ölü (YÜKSEK)**
`.env` dosyasında yalnızca `DATABASE_URL`, `DIRECT_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` var. Oysa:
- Dosya yükleme artık tamamen Cloudinary'ye bağlı (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) — anahtarlar olmadan yükleme bozuk.
- Davet e-postaları `RESEND_API_KEY` istiyor.
- AI özellikleri `ANTHROPIC_API_KEY` ve `GEMINI_API_KEY` istiyor.
Yapılacaklar: (a) `.env`'e bu anahtarları boş placeholder olarak ekle ve her birinin ne işe yaradığını yorum satırıyla açıkla; (b) kök dizine örnek bir `.env.example` dosyası oluştur; (c) Cloudinary yapılandırılmamışken dosya yükleme denemesi kullanıcıya anlaşılır bir Türkçe hata mesajı döndürsün (500 yerine "Dosya yükleme henüz yapılandırılmadı" gibi); (d) `eTwin_Asistan_Son_Durum.md` içindeki Vercel Environment Variables listesine bu anahtarları da ekle.

**5. AI sağlayıcı birliği (ORTA)**
Görev üretimi ve önerileri Anthropic Claude API'sini, Kalite Etiketi taslağı ise Google Gemini'yi kullanıyor — iki ayrı anahtar ve iki ayrı entegrasyon sürdürülemez. Tüm AI rotalarını tek sağlayıcıda birleştir. Karar: Gemini'de birleştir (`@google/generative-ai` zaten kurulu, `gemini-2.5-flash` modeli kullanılıyor); `generate-tasks` ve `task-suggestions` rotalarını Gemini'ye taşı, mevcut şablon fallback'lerini aynen koru, `ANTHROPIC_API_KEY` referanslarını temizle. Ortak bir yardımcı (`src/lib/ai.ts`) oluşturup üç rotanın da bunu kullanmasını sağla.

**6. Temizlik ve doküman düzeltmeleri (DÜŞÜK)**
- `package.json`'dan artık kullanılmayan `@types/better-sqlite3` paketini kaldır.
- `eTwin_Asistan_Son_Durum.md` düzeltmeleri: Kalite Etiketi kriterleri proje ayarlarında değil, görev/dosya etiketleri (`tags`) düzeyinde tutuluyor — ilgili cümleyi gerçeğe uygun yaz. Araç sayısını 20 değil 26 olarak güncelle. Yapılan tüm bu düzeltmeleri dokümana "Yayın Öncesi Düzeltmeler" başlığıyla ekle.

### Kabul Kriterleri

- `npm run build` hatasız tamamlanıyor (bunu en son tekrar çalıştırıp kanıtla).
- Oturumsuz kullanıcı `/dashboard`'a girince `/auth/login`'e yönlendiriliyor (proxy aktif).
- Üye olmayan bir kullanıcı `/api/ai/quality-label`'a başka bir projenin ID'siyle istek atınca 403 alıyor.
- `GEMINI_API_KEY` boşken üç AI rotası da 500 değil, şablon fallback sonucu dönüyor.
- `.env.example` mevcut ve tüm değişkenleri açıklamalı içeriyor.
- Dark/light tema ve mobil görünüm bozulmadı; arayüz metinleri Türkçe.

### Çalışma Şekli

Sorunları verilen sırayla düzelt; her düzeltmeden sonra ilgili doğrulamayı yap, hepsini bitirmeden build'i "geçti" sayma. Bittiğinde hangi dosyaların değiştiğini ve her kabul kriterinin nasıl doğrulandığını özetle. Bir konuda belirsizlik varsa (ör. withAuth'un proxy altında çalışmaması) en makul çözümü uygula ve kararını raporunda gerekçesiyle belirt.
