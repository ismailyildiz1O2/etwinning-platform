# eTwin Asistan — Uygulama Dokümantasyonu

> **Son Güncelleme:** 7 Temmuz 2026  
> **Durum:** Geliştirme aşamasında (lokal), henüz deploy edilmedi  
> **Amaç:** Bu doküman, uygulamanın mevcut durumunu başka bir yapay zekâya veya geliştiriciye aktarmak için hazırlanmıştır.

---

## 1. Genel Bakış

**eTwin Asistan**, öğretmenlerin eTwinning projelerini planlamasına, yönetmesine ve takip etmesine yardımcı olan tam kapsamlı (full-stack) bir web uygulamasıdır. Yapay zekâ destekli görev üretimi, dosya yönetimi, not tutma ve ekip yönetimi gibi özellikler içerir.

**Arayüz dili:** Türkçe (tüm etiketler, mesajlar ve bildirimler Türkçe'dir)

---

## 2. Teknoloji Yığını (Tech Stack)

| Kategori | Teknoloji | Versiyon |
|----------|-----------|----------|
| **Framework** | Next.js (App Router) | 16.2.7 |
| **Dil** | TypeScript | 5.x |
| **Veritabanı** | SQLite (better-sqlite3) | Yerel dosya (`dev.db`) |
| **ORM** | Prisma | 7.8.0 |
| **Kimlik Doğrulama** | NextAuth.js (Credentials + Google OAuth hazırlığı) | 4.24.14 |
| **Stil** | Tailwind CSS 4 + custom gradients/glassmorphism | 4.x |
| **İkonlar** | Lucide React | 1.17.0 |
| **Bildirimler (Toast)** | Sonner | 2.0.7 |
| **Tema** | next-themes (dark/light/system) | 0.4.6 |
| **Form Doğrulama** | Zod + react-hook-form | Zod 4.4.3 |
| **Tarih Formatlama** | date-fns | 4.1.0 |
| **Konfeti Efekti** | canvas-confetti | 1.9.4 |
| **Bulut Depolama** | Cloudinary | v2 |
| **E-posta Servisi** | Resend | 4.x |
| **Çok Dillilik (i18n)** | React Context Tabanlı Dictionary | - |
| **AI Entegrasyonu** | Anthropic Claude API (isteğe bağlı, akıllı fallback ile) | claude-sonnet-4-20250514 |
| **Şifre Hashleme** | bcryptjs | 3.0.3 |
| **React** | React | 19.2.4 |

---

## 3. Veritabanı Şeması (Prisma)

### 3.1 Modeller

#### User (Kullanıcı)
```prisma
model User {
  id        String          @id @default(cuid())
  name      String
  email     String          @unique
  password  String?
  image     String?
  role      String          @default("teacher")  // teacher | admin
  language  String          @default("en")       // Kullanıcı dil seçeneği (en/tr)
  projects  ProjectMember[]
  tasks     Task[]          @relation("AssignedTasks")
  notes     Note[]
  accounts  Account[]
  sessions  Session[]
  createdAt DateTime        @default(now())
  deletedAt DateTime?
}
```

#### Project (Proje)
```prisma
model Project {
  id             String          @id @default(cuid())
  name           String
  description    String?
  status         String          @default("active")  // active | completed | paused | archived
  language       String          @default("TR")
  startDate      DateTime
  endDate        DateTime
  country        String?
  partnerSchools String          @default("[]")  // JSON string
  twinspaceUrl   String?
  members        ProjectMember[]
  phases         Phase[]
  notes          Note[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  deletedAt      DateTime?       // soft delete
}
```

#### ProjectMember (Proje Üyesi)
```prisma
model ProjectMember {
  id        String    @id @default(cuid())
  project   Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  role      String    @default("member")  // owner | admin | member | viewer
  invitedAt DateTime  @default(now())
  joinedAt  DateTime?
  @@unique([projectId, userId])
}
```

#### Phase (Aşama)
```prisma
model Phase {
  id          String    @id @default(cuid())
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId   String
  title       String
  description String?
  order       Int       // 1-4 arası sıralama
  startDate   DateTime?
  endDate     DateTime?
  tasks       Task[]
  isCompleted Boolean   @default(false)
  color       String?
}
```

#### Task (Görev)
```prisma
model Task {
  id          String    @id @default(cuid())
  phase       Phase     @relation(fields: [phaseId], references: [id], onDelete: Cascade)
  phaseId     String
  title       String
  description String?
  isCompleted Boolean   @default(false)
  priority    String    @default("medium")  // low | medium | high
  tags        String    @default("[]")      // JSON string
  dueDate     DateTime?
  alarmDate   DateTime?
  alarmSent   Boolean   @default(false)
  assignee    User?     @relation("AssignedTasks", fields: [assigneeId], references: [id])
  assigneeId  String?
  parentId    String?
  parent      Task?     @relation("SubTasks", fields: [parentId], references: [id], onDelete: Cascade)
  subTasks    Task[]    @relation("SubTasks")  // self-relation (alt görevler)
  files       File[]
  notes       Note[]
  aiGenerated Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?  // soft delete
}
```

#### Note (Not) — Polimorfik
```prisma
model Note {
  id        String   @id @default(cuid())
  task      Task?    @relation(fields: [taskId], references: [id], onDelete: Cascade)
  taskId    String?       // nullable — görev notu ise dolu
  project   Project? @relation(fields: [projectId], references: [id], onDelete: Cascade)
  projectId String?       // nullable — proje notu ise dolu
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  content   String
  createdAt DateTime @default(now())
}
```

#### File (Dosya)
```prisma
model File {
  id         String   @id @default(cuid())
  task       Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  taskId     String
  name       String
  url        String
  publicId   String
  fileType   String
  uploadedAt DateTime @default(now())
}
```

#### ActivityLog (Aktivite Günlüğü)
```prisma
model ActivityLog {
  id         String   @id @default(cuid())
  projectId  String
  userId     String
  action     String
  entityType String   // project | task | phase | note | file | member
  entityId   String
  metadata   String?  // JSON
  createdAt  DateTime @default(now())
}
```

### 3.2 İlişki Diyagramı

```
User ─────┬──── ProjectMember ────── Project
           │                           │
           │                        Phase
           │                           │
           └────── Task (assignee) ────┘
                    │    │
                  File  Note ──── Project (polimorfik)
                    │
                  SubTask (self-relation)
```

---

## 4. Proje Dosya Yapısı

```
etwinning-platform/
├── prisma/
│   ├── schema.prisma          # Veri modeli tanımları
│   └── prisma.config.ts       # Prisma stüdyo yapılandırması
├── dev.db                     # SQLite veritabanı dosyası
│
├── src/
│   ├── app/
│   │   ├── page.tsx                           # Root → /dashboard'a yönlendirir
│   │   ├── layout.tsx                         # Root layout (Geist fontları, Providers)
│   │   ├── middleware.ts                      # Auth koruması (tüm route'lar)
│   │   │
│   │   ├── auth/
│   │   │   ├── layout.tsx                     # Animasyonlu auth arka planı (floating orbs)
│   │   │   ├── login/page.tsx                 # Giriş sayfası (Zod validasyonlu)
│   │   │   └── register/page.tsx              # Kayıt sayfası (otomatik giriş)
│   │   │
│   │   ├── dashboard/
│   │   │   ├── layout.tsx                     # Dashboard kabuğu (Sidebar + Header)
│   │   │   ├── page.tsx                       # Ana panel: istatistikler, proje ızgarası, bugünkü görevler
│   │   │   └── archive/page.tsx               # Arşivlenmiş projeler görünümü
│   │   │
│   │   ├── projects/
│   │   │   ├── new/page.tsx                   # 3 adımlı proje oluşturma sihirbazı
│   │   │   └── [id]/
│   │   │       ├── layout.tsx                 # Proje detay sarmalayıcısı
│   │   │       ├── page.tsx                   # Proje detay: aşamalar, görevler, notlar, araçlar
│   │   │       ├── settings/page.tsx          # Proje ayarları: üye yönetimi, tehlike bölgesi
│   │   │       └── tasks/page.tsx             # Projeye özel görevler sayfası
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── [...nextauth]/route.ts     # NextAuth handler
│   │       │   └── register/route.ts          # POST kullanıcı kaydı (bcrypt)
│   │       │
│   │       ├── projects/
│   │       │   ├── route.ts                   # GET listele, POST oluştur (template ile)
│   │       │   └── [id]/
│   │       │       ├── route.ts               # GET detay, PUT güncelle, DELETE soft-delete
│   │       │       ├── notes/
│   │       │       │   ├── route.ts            # GET/POST proje notları
│   │       │       │   └── [noteId]/route.ts   # DELETE not sil
│   │       │       └── members/
│   │       │           └── route.ts            # GET listele, POST davet et
│   │       │
│   │       ├── tasks/
│   │       │   ├── route.ts                   # GET filtreli liste, POST oluştur
│   │       │   ├── today/route.ts             # GET bugünkü görevler
│   │       │   └── [id]/
│   │       │       ├── route.ts               # GET detay, PUT/PATCH güncelle, DELETE soft-delete
│   │       │       ├── complete/route.ts      # PATCH tamamlanma durumunu değiştir
│   │       │       ├── notes/route.ts         # GET/POST görev notları
│   │       │       └── files/route.ts         # GET listele, POST yükle, DELETE sil
│   │       │
│   │       ├── phases/
│   │       │   ├── route.ts                   # POST oluştur
│   │       │   └── [id]/route.ts              # PUT güncelle, DELETE cascade sil
│   │       │
│   │       └── ai/
│   │           ├── generate-tasks/route.ts    # POST: Claude AI veya fallback template
│   │           └── task-suggestions/route.ts  # POST: görev bazlı AI önerileri
│   │
│   ├── components/
│   │   ├── providers.tsx              # SessionProvider + ThemeProvider + Toaster
│   │   ├── header.tsx                 # Sticky üst menü: tema değiştirici, kullanıcı dropdown
│   │   ├── app-sidebar.tsx            # Katlanabilir sol menü: navigasyon, proje linkleri, arşiv
│   │   ├── project-card.tsx           # Dashboard kartı: ilerleme çubuğu, aşama noktaları, dropdown menü
│   │   ├── phase-card.tsx             # Genişletilebilir aşama: görevler, "Görev Ekle", "AI Öner" butonları
│   │   ├── task-item.tsx              # Görev satırı: checkbox, öncelik rozeti, alt görev genişletme
│   │   ├── task-drawer.tsx            # (973 satır!) Tam görev editörü: alanlar, dosya yükleme, AI önerileri
│   │   ├── notes-drawer.tsx           # Proje notları: ekle/listele sekmeleri
│   │   ├── new-project-dialog.tsx     # Hızlı proje oluşturma diyaloğu
│   │   ├── stats-cards.tsx            # Dashboard istatistik kartları (animasyonlu sayılar)
│   │   ├── today-tasks.tsx            # Bugünkü görevler widget'ı (tamamlanınca konfeti)
│   │   ├── empty-state.tsx            # Yeniden kullanılabilir boş durum bileşeni
│   │   └── confetti-effect.tsx        # Konfeti tetikleme fonksiyonları
│   │
│   └── lib/
│       ├── auth.ts                    # NextAuth yapılandırması: CredentialsProvider, JWT callbacks
│       ├── prisma.ts                  # Singleton PrismaClient (dinamik DB path)
│       ├── utils.ts                   # cn(), getInitials(), renk/durum yardımcıları, formatDate
│       ├── etwinning-template.ts      # 4 aşamalı eTwinning şablonu (sabit + AI görevler)
│       └── activity-logger.ts         # ActivityLog kayıt yardımcısı
│   └── types/
│       └── next-auth.d.ts             # NextAuth tip tanımlamaları
│
├── public/
│   └── uploads/                       # Dosya yüklemeleri ({taskId}/ alt klasörlerinde)
│
├── package.json
├── tsconfig.json
├── next.config.ts
├── .env
└── middleware.ts
```

---

## 5. API Rotaları (Endpoints)

| Metod | Rota | Açıklama | Yetki |
|-------|------|----------|-------|
| `GET` | `/api/projects` | Kullanıcının projelerini listele | ✅ Üye |
| `POST` | `/api/projects` | Yeni proje oluştur (template ile) | ✅ |
| `GET` | `/api/projects/[id]` | Proje detayları (aşamalar, görevler dahil) | ✅ Üye |
| `PUT` | `/api/projects/[id]` | Proje güncelle | ✅ Üye |
| `DELETE` | `/api/projects/[id]` | Proje sil (soft delete, sadece sahip) | ✅ Sahip |
| `GET` | `/api/projects/[id]/notes` | Proje notlarını getir (kendi notları) | ✅ Üye |
| `POST` | `/api/projects/[id]/notes` | Proje notu ekle | ✅ Üye |
| `DELETE` | `/api/projects/[id]/notes/[noteId]` | Not sil (kendi notu) | ✅ Not sahibi |
| `GET` | `/api/projects/[id]/members` | Üyeleri listele | ✅ Üye |
| `POST` | `/api/projects/[id]/members` | E-posta ile üye davet et | ✅ Sahip |
| `GET` | `/api/tasks` | Görevleri listele (filtreli) | ✅ Üye |
| `POST` | `/api/tasks` | Yeni görev oluştur | ✅ Üye |
| `GET` | `/api/tasks/[id]` | Görev detayı | ✅ Üye |
| `PUT/PATCH` | `/api/tasks/[id]` | Görev güncelle | ✅ Üye |
| `DELETE` | `/api/tasks/[id]` | Görev sil (soft delete) | ✅ Üye |
| `PATCH` | `/api/tasks/[id]/complete` | Tamamlanma durumunu değiştir | ✅ Üye |
| `GET` | `/api/tasks/[id]/notes` | Görev notları | ✅ Üye |
| `POST` | `/api/tasks/[id]/notes` | Görev notu ekle | ✅ Üye |
| `GET` | `/api/tasks/[id]/files` | Görev dosyaları | ✅ Üye |
| `POST` | `/api/tasks/[id]/files` | Dosya yükle (FormData, max 10MB) | ✅ Üye |
| `DELETE` | `/api/tasks/[id]/files` | Dosya sil (fiziksel dosya dahil) | ✅ Üye |
| `GET` | `/api/tasks/today` | Bugünkü vadesi gelen/geçen görevler | ✅ |
| `POST` | `/api/phases` | Yeni aşama oluştur | ✅ Üye |
| `PUT` | `/api/phases/[id]` | Aşama güncelle | ✅ Üye |
| `DELETE` | `/api/phases/[id]` | Aşama sil (cascade — görevler de silinir) | ✅ Üye |
| `POST` | `/api/ai/generate-tasks` | AI görev üretimi (Claude veya template) | ✅ |
| `POST` | `/api/ai/task-suggestions` | Görev bazlı AI önerileri | ✅ |
| `POST` | `/api/auth/register` | Kullanıcı kaydı | ❌ Herkese açık |
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth handler | ❌ Herkese açık |

---

## 6. Temel Özellikler

### 6.1 Kimlik Doğrulama
- E-posta/şifre ile giriş (bcrypt ile 12 round hashleme)
- Kayıt sonrası otomatik giriş
- JWT tabanlı oturum yönetimi
- Middleware ile tüm route'lar korumalı (`/auth/*` hariç)
- Google OAuth hazırlığı mevcut ("Yakında" olarak işaretli)

### 6.2 Ana Panel (Dashboard)
- **İstatistik Kartları:** Toplam proje, toplam görev, tamamlanan görev, tamamlanma oranı (animasyonlu sayaçlar)
- **Proje Izgarası:** İlerleme çubuğu, aşama tamamlanma noktaları olan kartlar
- **Her proje kartının sağ üstünde 3 nokta menü:** Düzenle, Durdur/Başlat, Arşive Taşı, Sil
- **Bugünkü Görevler Widget'ı:** Vadesi gelen/geçen görevler, tamamlanınca konfeti efekti
- **Yeni Proje Butonu:** 3 adımlı sihirbaza veya hızlı diyaloğa yönlendirir

### 6.3 Proje Oluşturma (3 Adımlı Sihirbaz)
1. **Adım 1 — Proje Bilgileri:** Ad*, Açıklama, Başlangıç/Bitiş tarihi*, Ülke, Partner okullar, TwinSpace URL
2. **Adım 2 — Özelleştirme:** Konu/Tema*, Yaş grubu*, Ürün türü* (10 seçenek + ikon), Dijital araçlar, Süre (ay)
3. **Adım 3 — Görev İnceleme:** AI tarafından üretilen görevlerin incelenmesi (düzenlenebilir, silinebilir, eklenebilir). Faz 1 ve 4 için sabit görevler. "Yeniden Üret" butonu.

### 6.4 eTwinning 4 Aşama Şablonu

| Aşama | Adı | Görev Türü |
|-------|-----|------------|
| Faz 1 | Hazırlık, Tanışma ve Planlama | 8 sabit görev (e-güvenlik, takım oluşturma, buz kırıcılar, logolar, TwinSpace kurulumu) |
| Faz 2 | Kültürel Miras Araştırma | AI tarafından üretilen görevler (araştırma, veri toplama, dijital içerik) |
| Faz 3 | Uluslararası Karışık Takımlarla İşbirlikli Üretim | AI tarafından üretilen görevler (uluslararası takımlar, ortak ürünler) |
| Faz 4 | Değerlendirme, Yayma ve Sürdürülebilirlik | 8 sabit görev (anketler, yansıtma, kalite etiketi hazırlığı, yaygınlaştırma) |

### 6.5 AI Entegrasyonu
- **Görev Üretimi** (`/api/ai/generate-tasks`): Anthropic Claude API kullanır, API anahtarı yoksa akıllı şablon tabanlı üretim yapar
- **Görev Önerileri** (`/api/ai/task-suggestions`): Her görev için bağlamsal öneriler sunar, anahtar kelime tabanlı fallback ile 12+ kategori destekler (araştırma, buz kırıcılar, toplantılar, anketler, medya, e-kitaplar, sergiler, tasarım, güvenlik, kalite etiketleri, TwinSpace, haritalar)
- Öneriler alt görev olarak doğrudan eklenebilir

### 6.6 Proje Detay Sayfası
- Genişletilebilir aşama kartları (görevler, ilerleme çubukları, renk kodlu kenarlar)
- Görev öğeleri (checkbox, öncelik rozetleri, tarihler, atanan kişi avatarları, alt görev genişletme)
- Her aşamada "Görev Ekle" ve "AI Öner" butonları
- **Sol menüde 3 bölüm:**
  - **AŞAMALAR:** Proje aşamalarına hızlı navigasyon
  - **ARAÇLAR:** Şimdilik boş (web2 araçları için hazır alan)
  - **NOTLAR:** "Proje Notları" butonuna tıklayınca sağdan açılan çekmece
- **Görev Çekmecesi** (sağdan açılan, 973 satır): Tam görev düzenleme (başlık, açıklama, öncelik, tarih, atama, etiketler), sürükle-bırak dosya yükleme, AI öneri bölümü, not bölümü

### 6.7 Notlar Sistemi
- **Proje notları:** Basit metin bazlı, başlık/tarih/alarm yok, sadece kaydet ve sil
- **Görev notları:** Görev çekmecesi içinden erişilebilir
- Notlar polimorfik: hem projeye hem göreve ait olabilir

### 6.8 Dosya Yönetimi
- Sürükle-bırak veya dosya seçici ile yükleme
- Hızlı filtreler: fotoğraf, video, belge
- Maksimum 10MB dosya boyutu
- Dosyalar **Cloudinary Stream API** aracılığıyla bulutta (`etwin-asistan/{taskId}/` klasöründe) saklanır
- Dosya türü tespiti (resim, video, ses, PDF, belge, elektronik tablo, sunum, arşiv, metin)
- Resim önizleme ızgarası, indirme linkleri, fiziksel dosya temizliği ile silme

### 6.9 Proje Ayarları
- Proje meta verilerini düzenleme (ad, açıklama, tarihler, ülke, partner okullar, TwinSpace URL, dil)
- Üye yönetimi: üyeleri listeleme, e-posta ile davet (sadece sahip)
- Tehlike bölgesi: proje silme (sadece sahip, soft delete)

### 6.10 Arşiv
- Arşivlenmiş projeleri listeleme
- Arşivden çıkarma (tekrar aktif yapma)
- Sol menüde (sidebar) Arşiv sekmesi

### 6.11 Aktivite Günlüğü
- Tüm CRUD işlemleri `ActivityLog` tablosuna kaydedilir
- Takip edilen bilgiler: aksiyon, varlık türü, varlık ID, metadata, kullanıcı ID, proje ID

### 6.12 E-posta ve Çok Dillilik
- **Resend Entegrasyonu:** Davet edilen kullanıcılara profesyonel HTML formatında e-posta gider.
- **Kayıt Bağlantısı:** Davet edilen kişi kayıtlı değilse bile davet edilir ve kayıt bağlantısı yollanır.
- **Çok Dillilik (i18n):** `en` ve `tr` dilleri React Context üzerinden yönetilir ve kullanıcı tercihine göre saklanır.

---

## 7. Bileşenler (Components) Detayı

| Bileşen | Dosya | Satır (yaklaşık) | Açıklama |
|---------|-------|-------------------|----------|
| `Providers` | `providers.tsx` | ~30 | SessionProvider + ThemeProvider + Toaster sarmalayıcısı |
| `Header` | `header.tsx` | ~100 | Sticky üst menü: tema değiştirici, kullanıcı dropdown, sign out |
| `AppSidebar` | `app-sidebar.tsx` | ~180 | Katlanabilir sol menü: ana nav, proje linkleri (arşivlenenler filtrelenir), arşiv linki |
| `ProjectCard` | `project-card.tsx` | ~200 | Dashboard kartı: ilerleme, aşama noktaları, 3 nokta dropdown menü (düzenle/durdur/arşivle/sil) |
| `PhaseCard` | `phase-card.tsx` | ~150 | Genişletilebilir aşama kartı: görev listesi, "Görev Ekle", "AI Öner" butonları |
| `TaskItem` | `task-item.tsx` | ~150 | Görev satırı: checkbox, öncelik, alt görev genişletme, context menü |
| `TaskDrawer` | `task-drawer.tsx` | **973** | En büyük bileşen! Tam görev editörü: tüm alanlar, dosya yükleme (drag-drop), AI önerileri, notlar |
| `NotesDrawer` | `notes-drawer.tsx` | ~220 | Proje notları çekmecesi: "Not Ekle" ve "Notlarım" sekmeleri |
| `NewProjectDialog` | `new-project-dialog.tsx` | ~100 | Hızlı proje oluşturma modal diyaloğu |
| `StatsCards` | `stats-cards.tsx` | ~80 | Dashboard istatistik kartları (requestAnimationFrame animasyonlu sayaçlar) |
| `TodayTasks` | `today-tasks.tsx` | ~100 | Bugünkü görevler widget'ı (tamamlanınca canvas-confetti) |
| `EmptyState` | `empty-state.tsx` | ~30 | Yeniden kullanılabilir boş durum bileşeni (ikon + CTA butonu) |
| `ConfettiEffect` | `confetti-effect.tsx` | ~30 | `triggerConfetti()` ve `triggerCompletionConfetti()` fonksiyonları |

---

## 7.1. Sayfalar ve Şablonlar (Layout & Pages)
- **`src/app/dashboard/layout.tsx`**: Dashboard ve arşiv sayfaları için ortak kabuk sağlar (Sidebar + Header + Main içerik alanı).
- **`src/app/projects/[id]/layout.tsx`**: Proje detay rotaları için boş bir React Fragment sarmalayıcısıdır. İleride ortak yapılar eklemek için ayrılmıştır.
- **`src/app/projects/[id]/tasks/page.tsx`**: Belirli bir projeye ait tüm görevleri listeleyen, dokümante edilmiş ancak şu an Sidebar'da direkt linki olmayan sayfadır.
- **`src/types/next-auth.d.ts`**: NextAuth tip tanımlamalarıdır; TypeScript'te `session.user.id` gibi eklentilerin tip hatası vermesini engeller.

---

## 8. Yardımcı Fonksiyonlar (`src/lib/utils.ts`)

| Fonksiyon | Açıklama |
|-----------|----------|
| `cn()` | clsx + tailwind-merge (class birleştirme) |
| `getInitials(name)` | İsimden baş harfler (maks. 2) |
| `getStatusColor(status)` | Proje durumuna göre Tailwind renk sınıfları |
| `getStatusLabel(status)` | Proje durumuna göre Türkçe etiketler (Aktif, Tamamlandı, Duraklatıldı, Arşivlendi) |
| `getPriorityColor(priority)` | Görev önceliğine göre renk sınıfları |
| `getPriorityLabel(priority)` | Görev önceliğine göre Türkçe etiketler (Düşük, Orta, Yüksek) |
| `getDueDateColor(date)` | Tarih durumuna göre renk: kırmızı (gecikmiş), amber (bugün), yeşil (gelecek) |
| `formatDate(date)` | Türkçe yerelleştirilmiş tarih formatlama |
| `phaseColors` / `phaseDotColors` | 4 aşama için renk haritaları (mavi, yeşil, turuncu, mor) |

---

## 13. Kurulum ve Deployment Notları

- **Veritabanı Başlatma:** Uygulama Prisma ile yapılandırılmıştır ancak `prisma/migrations` klasörü **bulunmaz**. Bunun sebebi uygulamanın çevik geliştirme sürecinde `prisma db push` komutu ile yönetilmesidir.
- Şema her güncellendiğinde `npx prisma db push` komutu doğrudan proje kökündeki `dev.db` dosyasına şemayı eşitler. Yeni bir ortamda çalıştırılmadan önce `npx prisma db push` komutu ile SQLite veritabanı şeması oluşturulmalıdır.
- **Lokal Veritabanı:** SQLite veritabanı dosyasının (`dev.db`) yolu `.env` dosyasında `DATABASE_URL="file:./dev.db"` şeklinde (proje kök dizininde) ayarlanmıştır.

---

## 9. Yapılandırma Dosyaları

### .env
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="etwinning-platform-dev-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (opsiyonel)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Anthropic Claude API (V2 özelliği)
ANTHROPIC_API_KEY=""

# Cloudinary (V2 özelliği)
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# Resend Email (V2 özelliği)
RESEND_API_KEY=""
```

### package.json Scriptler
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint"
}
```

### Middleware
- `/auth/*`, `/api/auth/*`, `/_next/*`, `/favicon.ico` hariç tüm route'lar korumalı
- Oturumsuz kullanıcılar `/auth/login`'e yönlendirilir

---

## 10. Tasarım Kalıpları ve Mimari Kararlar

| Kalıp | Açıklama |
|-------|----------|
| **Soft Delete** | Projeler ve görevler `deletedAt` alanı ile silinir (geri alınabilir) |
| **Üyelik Bazlı Yetkilendirme** | Tüm API route'ları `ProjectMember` tablosunu kontrol eder |
| **Sahip-Only İşlemler** | Proje silme ve üye davet etme sadece sahibe açık |
| **Optimistic UI** | Görev tamamlama yerel olarak güncellenir, hata durumunda geri alınır |
| **Konfeti Kutlamaları** | Görev tamamlanınca canvas-confetti efekti |
| **Animasyonlu Sayaçlar** | Dashboard istatistik kartları requestAnimationFrame ile easing animasyonu |
| **Glassmorphism** | Proje oluşturma sihirbazında backdrop-blur kartları |
| **Responsive Tasarım** | Mobil hamburger menü, masaüstünde katlanabilir sidebar |
| **Polimorfik İlişki** | Note modeli hem Task'a hem Project'e ait olabilir |
| **Self-Relation** | Task modeli `parentId` ile alt görev (subtask) ilişkisi destekler |
| **AI Fallback** | API anahtarı yoksa akıllı şablon tabanlı görev üretimi |
| **Singleton Pattern** | PrismaClient tek instance olarak kullanılır (hot reload güvenli) |

---

## 11. Mevcut Durum ve Eksiklikler

### ✅ Tamamlanan Özellikler
- Kullanıcı kaydı ve girişi
- Proje oluşturma (3 adımlı sihirbaz + hızlı diyalog)
- 4 aşamalı eTwinning şablonu
- AI destekli görev üretimi ve önerileri
- Görev yönetimi (CRUD, alt görevler, öncelikler, tarihler)
- Dosya yükleme ve yönetimi
- Not tutma (proje ve görev bazlı)
- Proje kartlarında dropdown menü (düzenle, durdur, arşivle, sil)
- Arşiv bölümü
- Arşiv bölümü
- Üye davet sistemi (Resend ile e-posta bildirimi ve otomatik kayıt yönlendirmesi)
- Aktivite günlüğü
- Dark/light tema desteği
- Çok dillilik altyapısı (i18n)
- Dosya yüklemeleri Cloudinary'ye entegre edildi
- Responsive tasarım

### 🔲 Henüz Tamamlanmamış / Planlanan
- Google OAuth girişi ("Yakında" olarak işaretli)
- PDF dışa aktarma ("Yakında")
- Yazdırma özelliği ("Yakında")
- Paylaşma özelliği ("Yakında")
- ARAÇLAR bölümü (web2 araçları ve bağlantılar)
- Deploy (Vercel/Render/Neon — hiçbiri bağlı değil)
- Veritabanı PostgreSQL'e geçiş (schema SQLite kalsa da, kolayca PostgreSQL'e dönüştürülebilir)

### ⚠️ Bilinen Sınırlamalar
- Lokal geliştirme için SQLite kullanılıyor (deploy öncesi PostgreSQL provider olarak değiştirilmeli)
- `NEXTAUTH_SECRET` development key'i kullanıyor
- Git remote repo bağlı değil

---

## 12. Çalıştırma

```bash
# Bağımlılıkları yükle
npm install

# Veritabanını oluştur/güncelle
npx prisma db push

# Geliştirme sunucusunu başlat
npm run dev

# Tarayıcıda aç
# http://localhost:3000
```

---

> **Not:** Bu doküman, uygulamanın 7 Temmuz 2026 tarihindeki anlık durumunu yansıtmaktadır. Uygulama aktif geliştirme aşamasındadır ve yeni özellikler eklendikçe bu doküman güncelliğini yitirebilir.
