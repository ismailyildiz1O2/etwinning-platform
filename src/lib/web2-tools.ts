export interface Web2Tool {
  id: string;
  name: string;
  url: string;
  description: string;
  category: string;
  color: string;
}

export const web2Categories = [
  "Tümü",
  "Görsel Tasarım & Poster",
  "İşbirlikçi Panolar",
  "Sunum & Belge",
  "Anket & Oyunlaştırma",
  "Dijital Hikaye",
  "Video & Multimedya",
  "Zihin Haritası",
  "Avatar & Karakter",
  "Sanal Toplantı",
  "İnteraktif Araçlar",
  "Özel Uygulamalar",
];

export const web2Tools: Web2Tool[] = [
  // 1. Görsel Tasarım & Poster / Logo Oluşturma
  {
    id: "canva",
    name: "Canva",
    url: "https://www.canva.com/",
    description: "Projeye özel logo, poster, afiş, infografik, sunum ve kısa video hazırlamak için kullanılır. Öğrenciler görsel olarak çekici materyaller üretirken tasarım becerilerini geliştirir. En çok kullanılan araçtır.",
    category: "Görsel Tasarım & Poster",
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "postermywall",
    name: "PosterMyWall",
    url: "https://www.postermywall.com/",
    description: "Özellikle poster ve broşür tasarlamak için tercih edilir. Canva'ya alternatif olarak kullanılır ve şablonları oldukça zengindir.",
    category: "Görsel Tasarım & Poster",
    color: "from-indigo-500 to-purple-500",
  },

  // 2. İşbirlikçi Panolar & Paylaşım
  {
    id: "padlet",
    name: "Padlet",
    url: "https://padlet.com/",
    description: "Öğrencilerin fikirlerini, fotoğraflarını, videolarını ve linklerini tek bir dijital pano üzerinde paylaşması için kullanılır. Beyin fırtınası ve proje süreci takibi için idealdir.",
    category: "İşbirlikçi Panolar",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "wakelet",
    name: "Wakelet",
    url: "https://wakelet.com/",
    description: "Farklı kaynaklardan (video, makale, link, görsel) toplanan içerikleri düzenli bir şekilde bir araya getirmek için kullanılır. Proje sürecinde “kaynak havuzu” oluşturmak için çok işe yarar.",
    category: "İşbirlikçi Panolar",
    color: "from-blue-500 to-cyan-500",
  },

  // 3. Sunum & Belge Oluşturma (İşbirlikçi)
  {
    id: "google-slides",
    name: "Google Slides",
    url: "https://slides.google.com/",
    description: "Farklı ülkelerden öğrenciler aynı anda ortak sunum hazırlayabilir. Herkes kendi slaydını ekleyip düzenleyebilir.",
    category: "Sunum & Belge",
    color: "from-yellow-500 to-orange-500",
  },
  {
    id: "google-docs",
    name: "Google Docs",
    url: "https://docs.google.com/",
    description: "Ortak metin yazma, proje planı oluşturma, hikaye yazma ve rapor hazırlama için kullanılır. Gerçek zamanlı düzenleme özelliği sunar.",
    category: "Sunum & Belge",
    color: "from-blue-500 to-indigo-500",
  },
  {
    id: "genially",
    name: "Genially",
    url: "https://genially.com/",
    description: "İnteraktif sunumlar, posterler, escape room'lar ve gamification içerikleri oluşturmak için kullanılır.",
    category: "Sunum & Belge",
    color: "from-blue-600 to-violet-600",
  },
  {
    id: "prezi",
    name: "Prezi",
    url: "https://prezi.com/",
    description: "Dinamik ve akıcı sunumlar hazırlamak için tercih edilir. Doğrusal olmayan sunum yapısı sunar.",
    category: "Sunum & Belge",
    color: "from-sky-500 to-blue-600",
  },

  // 4. Değerlendirme, Anket & Oyunlaştırma
  {
    id: "kahoot",
    name: "Kahoot!",
    url: "https://kahoot.com/",
    description: "Konuyla ilgili bilgi ölçmek, motivasyonu artırmak ve eğlenceli bir şekilde değerlendirme yapmak için kullanılır.",
    category: "Anket & Oyunlaştırma",
    color: "from-purple-600 to-indigo-600",
  },
  {
    id: "google-forms",
    name: "Google Forms",
    url: "https://forms.google.com/",
    description: "Proje başlangıcında ihtiyaç analizi, süreç değerlendirmesi ve son değerlendirme anketleri oluşturmak için kullanılır.",
    category: "Anket & Oyunlaştırma",
    color: "from-purple-500 to-fuchsia-500",
  },
  {
    id: "mentimeter",
    name: "Mentimeter",
    url: "https://www.mentimeter.com/",
    description: "Canlı oylama, kelime bulutu ve beyin fırtınası yapmak için kullanılır. Çevrimiçi toplantılarda aktif katılımı sağlar.",
    category: "Anket & Oyunlaştırma",
    color: "from-teal-500 to-emerald-500",
  },
  {
    id: "wordwall",
    name: "Wordwall",
    url: "https://wordwall.net/",
    description: "Kelime etkinlikleri, eşleştirme oyunları, quiz ve sıralama etkinlikleri hazırlamak için kullanılır.",
    category: "Anket & Oyunlaştırma",
    color: "from-blue-500 to-sky-500",
  },
  {
    id: "quizizz",
    name: "Quizizz",
    url: "https://quizizz.com/",
    description: "Kahoot'a alternatif olarak kullanılan quiz platformudur. Öğrenciler kendi hızlarında çözebilir.",
    category: "Anket & Oyunlaştırma",
    color: "from-purple-500 to-pink-500",
  },

  // 5. Dijital Hikaye & E-Kitap Oluşturma
  {
    id: "storyjumper",
    name: "StoryJumper",
    url: "https://www.storyjumper.com/",
    description: "Öğrencilerin kendi yazdığı hikayeleri resimlerle birleştirip dijital kitap haline getirmesi için kullanılır.",
    category: "Dijital Hikaye",
    color: "from-orange-500 to-amber-500",
  },
  {
    id: "book-creator",
    name: "Book Creator",
    url: "https://bookcreator.com/",
    description: "İnteraktif e-kitaplar, dijital dergiler ve portfolyo oluşturmak için kullanılır. Ses kaydı ve video eklenebilir.",
    category: "Dijital Hikaye",
    color: "from-blue-400 to-blue-600",
  },

  // 6. Video & Multimedya Oluşturma
  {
    id: "renderforest",
    name: "Renderforest",
    url: "https://www.renderforest.com/",
    description: "Proje tanıtım videosu, animasyonlu logo ve kısa filmler hazırlamak için kullanılır.",
    category: "Video & Multimedya",
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "powtoon",
    name: "Powtoon",
    url: "https://www.powtoon.com/",
    description: "Animasyonlu sunum ve açıklayıcı videolar oluşturmak için tercih edilir.",
    category: "Video & Multimedya",
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "animoto",
    name: "Animoto",
    url: "https://animoto.com/",
    description: "Fotoğraf ve videolardan kısa tanıtım filmleri ve kolaj videolar hazırlamak için kullanılır.",
    category: "Video & Multimedya",
    color: "from-rose-500 to-pink-500",
  },

  // 7. Zihin / Kavram Haritası
  {
    id: "mindmeister",
    name: "MindMeister",
    url: "https://www.mindmeister.com/",
    description: "Proje planı oluşturma, kavramları organize etme ve ortak zihin haritası hazırlama için kullanılır.",
    category: "Zihin Haritası",
    color: "from-blue-500 to-indigo-500",
  },
  {
    id: "popplet",
    name: "Popplet",
    url: "https://popplet.com/",
    description: "Basit ve görsel kavram haritaları oluşturmak için tercih edilir. İlkokul seviyesinde sık kullanılır.",
    category: "Zihin Haritası",
    color: "from-pink-500 to-rose-500",
  },

  // 8. Avatar & Konuşan Karakter
  {
    id: "voki",
    name: "Voki",
    url: "https://www.voki.com/",
    description: "Öğrencilerin kendi avatarlarını oluşturup konuşmasını sağlamak için kullanılır. Rol yapma etkinliklerinde işe yarar.",
    category: "Avatar & Karakter",
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "chatterpix",
    name: "Chatterpix",
    url: "https://www.duckduckgo.com/?q=chatterpix", // Mobil uygulama olduğu için arama motoru linki verdik
    description: "Fotoğraflara ses ekleyerek 'konuşan resimler' oluşturmak için kullanılır. (Mobil Uygulama)",
    category: "Avatar & Karakter",
    color: "from-orange-500 to-red-500",
  },

  // 9. Sanal Toplantı & İletişim
  {
    id: "zoom",
    name: "Zoom",
    url: "https://zoom.us/",
    description: "Sanal toplantı, ortak sunum ve atölye çalışmaları için kullanılır. Breakout odaları sunar.",
    category: "Sanal Toplantı",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "google-meet",
    name: "Google Meet",
    url: "https://meet.google.com/",
    description: "Google araçlarıyla entegre çalıştığı için tercih edilir. Basit ve erişimi kolaydır.",
    category: "Sanal Toplantı",
    color: "from-teal-500 to-green-500",
  },

  // 10. Ekstra Etkileşimli Araçlar
  {
    id: "thinglink",
    name: "Thinglink",
    url: "https://www.thinglink.com/",
    description: "Fotoğraf veya videolara tıklanabilir noktalar ekleyerek interaktif materyal oluşturmak için kullanılır.",
    category: "İnteraktif Araçlar",
    color: "from-cyan-500 to-teal-500",
  },
  {
    id: "learningapps",
    name: "LearningApps",
    url: "https://learningapps.org/",
    description: "Hazır şablonlarla interaktif öğrenme aktiviteleri (eşleştirme, sıralama, quiz) oluşturmak için kullanılır.",
    category: "İnteraktif Araçlar",
    color: "from-yellow-500 to-orange-500",
  },

  // 11. Özel Uygulamalar (Self-Hosted)
  {
    id: "classquiz",
    name: "ClassQuiz",
    url: "https://quiz.etwinasistan.com",
    description: "Kahoot benzeri sınıf içi test ve interaktif quiz yarışmaları düzenlemek için tamamen bize ait güvenli platform.",
    category: "Özel Uygulamalar",
    color: "from-indigo-500 to-purple-600",
  },
  {
    id: "etherpad",
    name: "Etherpad",
    url: "https://ortak.etwinasistan.com",
    description: "Öğrencilerin aynı anda canlı olarak metin, hikaye ve rapor yazabileceği ortak çalışma alanımız.",
    category: "Özel Uygulamalar",
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "answer",
    name: "Answer",
    url: "https://soru.etwinasistan.com",
    description: "Öğretmenlerin ve öğrencilerin soru sorup cevaplayabileceği eTwinning proje soru-cevap platformumuz.",
    category: "Özel Uygulamalar",
    color: "from-orange-500 to-red-500",
  },
  {
    id: "stirling-pdf",
    name: "Stirling PDF",
    url: "https://pdf.etwinasistan.com",
    description: "PDF belgelerinizi birleştirin, bölün veya düzenleyin. %100 güvenli ve hiçbir sınır olmadan kendi sunucumuzda.",
    category: "Özel Uygulamalar",
    color: "from-rose-500 to-pink-600",
  },
  {
    id: "heyform",
    name: "HeyForm",
    url: "https://anket.etwinasistan.com",
    description: "Proje öncesi, süreci ve sonrası için detaylı anketler, formlar ve veri toplama araçları hazırlayın.",
    category: "Özel Uygulamalar",
    color: "from-blue-400 to-indigo-500",
  },
  {
    id: "bookstack",
    name: "BookStack",
    url: "https://kutuphane.etwinasistan.com",
    description: "Proje dökümantasyonu, e-kitaplar ve proje kurallarını tutabileceğiniz düzenli kütüphane sistemimiz.",
    category: "Özel Uygulamalar",
    color: "from-amber-500 to-orange-600",
  },
  {
    id: "trilium",
    name: "Trilium Notes",
    url: "https://not.etwinasistan.com",
    description: "Kişisel ve işbirlikçi notlar almak, proje günlükleri tutmak için hiyerarşik not alma uygulaması.",
    category: "Özel Uygulamalar",
    color: "from-teal-500 to-emerald-600",
  },
  {
    id: "wbo",
    name: "WBO (Beyaz Tahta)",
    url: "https://pano.etwinasistan.com",
    description: "Gerçek zamanlı ortak çalışma, çizim yapma ve fikir geliştirme için sınırsız beyaz tahta aracımız.",
    category: "Özel Uygulamalar",
    color: "from-fuchsia-500 to-purple-600",
  },
  {
    id: "penpot",
    name: "Penpot",
    url: "https://tasarim.etwinasistan.com",
    description: "Açık kaynaklı tasarım, grafik ve prototip oluşturma aracı. Figma benzeri arayüzüyle görsel materyal tasarlayın.",
    category: "Özel Uygulamalar",
    color: "from-cyan-500 to-blue-600",
  },
];
