export interface Web2Tool {
  id: string;
  name: string;
  url: string;
  description: string;
  descriptionEn: string;
  category: string;
  categoryEn: string;
  categoryKey: string;
  color: string;
}

export const web2Categories = [
  { key: "all", tr: "Tümü", en: "All" },
  { key: "graphic", tr: "Görsel Tasarım & Poster", en: "Visual Design & Poster" },
  { key: "collaborative", tr: "İşbirlikçi Panolar", en: "Collaborative Boards" },
  { key: "presentation", tr: "Sunum & Belge", en: "Presentation & Document" },
  { key: "survey", tr: "Anket & Oyunlaştırma", en: "Survey & Gamification" },
  { key: "story", tr: "Dijital Hikaye", en: "Digital Storytelling" },
  { key: "video", tr: "Video & Multimedya", en: "Video & Multimedia" },
  { key: "mindmap", tr: "Zihin Haritası", en: "Mind Mapping" },
  { key: "avatar", tr: "Avatar & Karakter", en: "Avatar & Character" },
  { key: "meeting", tr: "Sanal Toplantı", en: "Virtual Meeting" },
  { key: "interactive", tr: "İnteraktif Araçlar", en: "Interactive Tools" },
  { key: "custom", tr: "Özel Uygulamalar", en: "Special Apps" },
];

export const web2Tools: Web2Tool[] = [
  // 1. Visual Design & Poster
  {
    id: "canva",
    name: "Canva",
    url: "https://www.canva.com/",
    description: "Projeye özel logo, poster, afiş, infografik, sunum ve kısa video hazırlamak için kullanılır.",
    descriptionEn: "Used to create custom project logos, posters, infographics, presentations, and short videos.",
    category: "Görsel Tasarım & Poster",
    categoryEn: "Visual Design & Poster",
    categoryKey: "graphic",
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "postermywall",
    name: "PosterMyWall",
    url: "https://www.postermywall.com/",
    description: "Özellikle poster ve broşür tasarlamak için tercih edilir.",
    descriptionEn: "Preferred for designing posters and brochures with rich template libraries.",
    category: "Görsel Tasarım & Poster",
    categoryEn: "Visual Design & Poster",
    categoryKey: "graphic",
    color: "from-indigo-500 to-purple-500",
  },

  // 2. Collaborative Boards
  {
    id: "padlet",
    name: "Padlet",
    url: "https://padlet.com/",
    description: "Öğrencilerin fikirlerini, fotoğraflarını ve videolarını tek bir dijital panoda paylaşması için kullanılır.",
    descriptionEn: "Used for students to share ideas, photos, and videos on a single collaborative digital board.",
    category: "İşbirlikçi Panolar",
    categoryEn: "Collaborative Boards",
    categoryKey: "collaborative",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "wakelet",
    name: "Wakelet",
    url: "https://wakelet.com/",
    description: "Farklı kaynaklardan toplanan içerikleri düzenli bir şekilde bir araya getirmek için kullanılır.",
    descriptionEn: "Used to curate and organize content collected from various sources (videos, articles, links).",
    category: "İşbirlikçi Panolar",
    categoryEn: "Collaborative Boards",
    categoryKey: "collaborative",
    color: "from-blue-500 to-cyan-500",
  },

  // 3. Presentation & Document
  {
    id: "google-slides",
    name: "Google Slides",
    url: "https://slides.google.com/",
    description: "Farklı ülkelerden öğrenciler aynı anda ortak sunum hazırlayabilir.",
    descriptionEn: "Allows students from different partner countries to collaborate on joint presentations simultaneously.",
    category: "Sunum & Belge",
    categoryEn: "Presentation & Document",
    categoryKey: "presentation",
    color: "from-yellow-500 to-orange-500",
  },
  {
    id: "google-docs",
    name: "Google Docs",
    url: "https://docs.google.com/",
    description: "Ortak metin yazma, proje planı oluşturma ve hikaye yazma için kullanılır.",
    descriptionEn: "Used for joint text writing, project planning, storytelling, and collaborative document editing.",
    category: "Sunum & Belge",
    categoryEn: "Presentation & Document",
    categoryKey: "presentation",
    color: "from-blue-500 to-indigo-500",
  },
  {
    id: "genially",
    name: "Genially",
    url: "https://genially.com/",
    description: "İnteraktif sunumlar, posterler ve gamification içerikleri oluşturmak için kullanılır.",
    descriptionEn: "Used to create interactive presentations, posters, escape rooms, and gamified learning content.",
    category: "Sunum & Belge",
    categoryEn: "Presentation & Document",
    categoryKey: "presentation",
    color: "from-blue-600 to-violet-600",
  },

  // 4. Assessment & Gamification
  {
    id: "kahoot",
    name: "Kahoot!",
    url: "https://kahoot.com/",
    description: "Konuyla ilgili bilgi ölçmek, motivasyonu artırmak ve eğlenceli yarışmalar düzenlemek için kullanılır.",
    descriptionEn: "Used to assess student knowledge, boost motivation, and host interactive learning quizzes.",
    category: "Anket & Oyunlaştırma",
    categoryEn: "Survey & Gamification",
    categoryKey: "survey",
    color: "from-purple-500 to-indigo-600",
  },
  {
    id: "mentimeter",
    name: "Mentimeter",
    url: "https://www.mentimeter.com/",
    description: "Canlı anketler, kelime bulutları ve soru-cevap oturumları düzenlemek için kullanılır.",
    descriptionEn: "Used to create live polls, word clouds, quizzes, and Q&A sessions during virtual meetings.",
    category: "Anket & Oyunlaştırma",
    categoryEn: "Survey & Gamification",
    categoryKey: "survey",
    color: "from-blue-500 to-indigo-500",
  },

  // 5. Digital Storytelling
  {
    id: "book-creator",
    name: "Book Creator",
    url: "https://bookcreator.com/",
    description: "Ortak dijital kitap, e-dergi veya hikaye kitabı oluşturmak için idealdir.",
    descriptionEn: "Ideal for creating collaborative digital ebooks, magazines, or interactive storybooks.",
    category: "Dijital Hikaye",
    categoryEn: "Digital Storytelling",
    categoryKey: "story",
    color: "from-blue-500 to-cyan-500",
  },

  // 6. Video & Multimedia
  {
    id: "capcut",
    name: "CapCut",
    url: "https://www.capcut.com/",
    description: "Proje videoları kurgulamak, altyazı eklemek ve kısa filmler hazırlamak için kullanılır.",
    descriptionEn: "Used to edit project videos, add automated subtitles, and produce short films.",
    category: "Video & Multimedya",
    categoryEn: "Video & Multimedia",
    categoryKey: "video",
    color: "from-gray-700 to-black",
  },

  // 7. Mind Mapping
  {
    id: "coggle",
    name: "Coggle",
    url: "https://coggle.it/",
    description: "Ortak zihin haritaları ve kavram haritaları oluşturmak için kullanılır.",
    descriptionEn: "Used to generate collaborative mind maps and visual concept trees.",
    category: "Zihin Haritası",
    categoryEn: "Mind Mapping",
    categoryKey: "mindmap",
    color: "from-green-500 to-emerald-600",
  },

  // 8. Virtual Meeting
  {
    id: "zoom",
    name: "Zoom",
    url: "https://zoom.us/",
    description: "Uluslararası ortak öğretmen toplantıları ve canlı öğrenci buluşmaları için kullanılır.",
    descriptionEn: "Used for international partner teacher meetings and live online student workshops.",
    category: "Sanal Toplantı",
    categoryEn: "Virtual Meeting",
    categoryKey: "meeting",
    color: "from-blue-500 to-sky-600",
  },
];
