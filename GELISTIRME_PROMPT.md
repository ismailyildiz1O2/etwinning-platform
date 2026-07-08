# eTwin Asistan — Geliştirme Promptu (V2 Yol Haritası)

> Bu prompt, uygulamayı geliştirecek yapay zekâ ajanına veya geliştiriciye verilmek üzere hazırlanmıştır.
> Tarih: 7 Temmuz 2026

---

## PROMPT BAŞLANGICI

Sen deneyimli bir full-stack geliştiricisin. `etwinning-platform` adlı mevcut bir Next.js projesini geliştireceksin. Bu uygulama, öğretmenlerin eTwinning projelerini planlamasına ve yönetmesine yardımcı olan "eTwin Asistan" adlı bir web uygulamasıdır.

### Önce Bunları Yap (Zorunlu Hazırlık)

1. Proje kökündeki `ETWIN_ASISTAN_DOKUMANTASYON.md` dosyasını baştan sona oku — uygulamanın mevcut mimarisi, veritabanı şeması, API rotaları ve bileşenleri orada belgelidir.
2. `AGENTS.md` uyarısını dikkate al: Bu projedeki Next.js sürümü (16.x) eğitim verindekinden farklı olabilir. Kod yazmadan önce `node_modules/next/dist/docs/` altındaki ilgili rehberleri oku.
3. Mevcut kod kalıplarına uy: soft delete (`deletedAt`), üyelik bazlı yetkilendirme (her API route'unda `ProjectMember` kontrolü), `getServerSession` ile oturum doğrulama, ActivityLog kaydı, Sonner toast bildirimleri, mevcut Tailwind 4 + glassmorphism tasarım dili.
4. Arayüz dili Türkçe'dir; tüm yeni etiket ve mesajlar Türkçe olacak (Aşama 1'deki i18n altyapısı kurulana kadar).

### Genel Kurallar

- Her aşamanın sonunda uygulama çalışır durumda olmalı (`npm run dev` hatasız açılmalı).
- Her yeni API route'unda oturum + proje üyeliği kontrolü yapılacak; yazma işlemleri ActivityLog'a kaydedilecek.
- Şema değişikliklerinde `npx prisma db push` kullanılacak (migration klasörü kullanılmıyor).
- Yeni bileşenler mevcut bileşen üslubuna (dosya adlandırma, `cn()` kullanımı, dark/light tema desteği) uyacak.
- Her aşama bittiğinde `ETWIN_ASISTAN_DOKUMANTASYON.md` güncellenecek.
- Aşamaları sırayla uygula; bir aşamayı bitirip test etmeden diğerine geçme.

---

### AŞAMA 1 — Üretime Hazırlık ve Çok Dillilik (Kilit Açıcı)

eTwinning projelerinin üyeleri farklı ülkelerdeki partner öğretmenlerdir. Üye davet sistemi ancak uygulama internette yayında olursa anlam kazanır.

1. **PostgreSQL geçişi:** Prisma datasource'u PostgreSQL'e taşınabilir hale getir (ör. Neon/Vercel Postgres). SQLite lokal geliştirmede kalabilir; `DATABASE_URL` ile ortama göre seçilsin. `better-sqlite3` adapter'ının yerine ortama uygun adapter kullan.
2. **Deploy hazırlığı:** Vercel'e deploy edilebilir hale getir. Dosya yüklemeyi `public/uploads`'tan Cloudinary'ye taşı (`.env`'de anahtar alanları hazır). `NEXTAUTH_SECRET` üretim için güvenli değere geçir.
3. **Çok dillilik (i18n):** Arayüzü Türkçe + İngilizce destekleyecek şekilde yapılandır (next-intl veya Next.js 16'nın önerdiği yöntem — dokümandan kontrol et). Tüm sabit metinleri çeviri dosyalarına çıkar. Kullanıcı dil tercihi profile kaydedilsin. Partner öğretmenler için varsayılan İngilizce olsun.
4. **E-posta bildirimleri:** Resend entegrasyonu ile üye davet e-postası gönder (davet edilen kullanıcı kayıtlı değilse kayıt linki içersin).

### AŞAMA 2 — Kalite Etiketi Asistanı (En Yüksek Değer)

Öğretmenin proje boyunca asıl derdi Kalite Etiketi (Quality Label) başvurusudur. Uygulama zaten her şeyi kaydediyor; bu veriyi değerlendirmeye dönüştür.

1. **Kriter etiketleme:** Task ve File modellerine Kalite Etiketi kriterleriyle eşleşen etiketleme ekle. Kriterler: `isbirligi` (işbirliği), `teknoloji` (teknoloji kullanımı), `mufredat` (müfredat entegrasyonu), `sonuc` (sonuçlar/etki/yaygınlaştırma), `yenilikcilik` (pedagojik yenilikçilik). Mevcut `tags` JSON alanı kullanılabilir veya ayrı alan eklenebilir — şemaya en az müdahaleyle karar ver.
2. **Öz değerlendirme paneli:** Proje detay sayfasına "Kalite Etiketi" sekmesi ekle. Her kriter için projedeki etiketli görev/kanıt sayısına dayalı bir doluluk göstergesi ve boşluk analizi göster ("İşbirliği kanıtın az — Faz 3'e ortak ürün etkinliği eklemeyi düşün" gibi Türkçe öneriler).
3. **AI başvuru taslağı:** Mevcut Claude entegrasyonunu kullanarak (`/api/ai/` altına yeni route) proje verisinden (tamamlanan görevler, notlar, kanıtlar) Kalite Etiketi başvuru metni taslağı üret. API anahtarı yoksa mevcut kalıba uygun akıllı şablon fallback'i olsun. Üretilen taslak düzenlenebilir ve kopyalanabilir olmalı.
4. **Kanıt Portfolyosu:** Proje seviyesinde "Kanıt Havuzu" sayfası — tüm görevlerdeki dosyaları tek galeride topla; kriter ve faz filtresi, resim önizleme, dış bağlantı ekleme (URL ile kanıt — ör. Padlet/Canva ürün linki) desteği ekle. Bunun için dosyadan bağımsız bir `Evidence` veya genişletilmiş File modeli gerekebilir.

### AŞAMA 3 — Takvim ve Hatırlatmalar

1. **Takvim görünümü:** Dashboard'a ve proje detayına aylık takvim görünümü ekle (görevler `dueDate`'e göre yerleşsin, faz renkleriyle). "Bu hafta" özet şeridi ekle.
2. **Alarm sistemini hayata geçir:** Şemada duran `alarmDate`/`alarmSent` alanlarını kullan — Resend ile görev hatırlatma e-postası gönderen bir mekanizma kur (Vercel Cron veya benzeri zamanlanmış görev; Next.js 16 dokümanından uygun yöntemi seç).
3. **iCal dışa aktarma:** Proje görevlerini `.ics` olarak indirme endpoint'i ekle (öğretmen kendi telefon takvimine ekleyebilsin).

### AŞAMA 4 — Öğrenci Boyutu

1. **Öğrenci listesi:** Yeni `Student` modeli (ad, okul/partner okul, sınıf, veli izni durumu). Proje ayarlarına "Öğrenciler" sekmesi; ekleme/düzenleme/CSV içe aktarma.
2. **Veli izin takibi:** Her öğrenci için izin formu durumu (alındı/bekliyor) ve tarih. Faz 1'deki sabit e-güvenlik göreviyle görsel bağlantı kur (izinler tamamlanınca görev tamamlanmaya hazır göstergesi).
3. **Karışık takım oluşturucu:** Faz 3 için sihirbaz: partner okulların öğrencilerini dengeli şekilde uluslararası karışık takımlara dağıtan, takım adı/rengi verilebilen, sonucu kaydedip görevlere atanabilen bir araç. Rastgele dağıtımda her takımda birden fazla okuldan öğrenci olmasını garanti et.

### AŞAMA 5 — Araçlar, Yaygınlaştırma ve Cila

1. **ARAÇLAR bölümünü doldur:** Proje detayındaki boş ARAÇLAR alanına etkinlik türüne göre kategorilenmiş Web2 araç rehberi ekle (tanışma → Padlet/Voki; anket → Forms/Mentimeter; e-kitap → StoryJumper; pano → Canva vb.). Her araç kartında kısa açıklama, e-güvenlik/KVKK notu ve dış bağlantı olsun. Veriyi statik bir TS dosyasında tut (`src/lib/web2-tools.ts`), AI görev önerileriyle ilişkilendir.
2. **Yaygınlaştırma günlüğü:** "Nerede paylaştım?" kaydı — kanal (okul sitesi, yerel basın, sosyal medya, sunum), tarih, bağlantı, görsel. Kalite Etiketi panelinin `sonuc` kriterini beslesin.
3. **Aktivite akışı:** ActivityLog verisini proje detayında "Son Hareketler" akışı olarak göster (kim, ne zaman, ne yaptı — Türkçe cümleler halinde).
4. **Şablon çeşitliliği:** `etwinning-template.ts`'i tema bağımsız hale getir; Faz 2-3 başlıklarındaki "Kültürel Miras" bağımlılığını kaldır. Proje sihirbazına hazır şablon seçimi ekle: Genel, Kültürel Miras, Dil Projesi, STEM, e-Güvenlik.
5. **PDF proje raporu:** Tek sayfalık özet raporu (proje bilgileri, ilerleme yüzdesi, faz durumları, kanıt görselleri, partner listesi) PDF olarak dışa aktar. Okul idaresine sunulacak resmi görünümde, Türkçe.

---

### Kabul Kriterleri (Her Aşama İçin)

- `npm run build` hatasız tamamlanıyor.
- Yeni API route'ları yetkisiz erişimde 401/403 dönüyor; üye olmayan kullanıcı başka projenin verisine erişemiyor.
- Dark/light temada tüm yeni ekranlar düzgün görünüyor.
- Mobil görünümde (375px) yeni ekranlar kullanılabilir.
- `ETWIN_ASISTAN_DOKUMANTASYON.md` yeni özellikleri içerecek şekilde güncellendi.

### Çalışma Şekli

Her aşamaya başlamadan önce kısa bir uygulama planı sun, onay bekleme — planı yaz ve uygulamaya geç. Aşama bitince ne yaptığını, hangi dosyaların değiştiğini ve nasıl test edileceğini özetle. Bir aşamada belirsizlik varsa (ör. şema tasarım kararı), en makul seçeneği seç, kararını ve gerekçesini raporunda belirt.

## PROMPT SONU
