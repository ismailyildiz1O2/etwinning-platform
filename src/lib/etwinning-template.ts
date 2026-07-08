/**
 * eTwinning Project Template — Dynamic Template System
 * 
 * Phase 1 & 4: Fixed tasks (same for all projects)
 * Phase 2 & 3: Dynamic tasks (AI-generated based on project topic & product type)
 */

export interface TemplateTask {
  title: string;
  priority: "high" | "medium" | "low";
  order: number;
}

export interface TemplatePhase {
  title: string;
  description: string;
  order: number;
  color: string;
  isDynamic: boolean;
  tasks: TemplateTask[];
}

export interface ProjectSetupInfo {
  topic: string;           // Project topic/theme
  ageGroup: string;        // Target age group (e.g., "10-14", "14-18")
  productType: string;     // Joint product type (e-book, video, exhibition, map, game, etc.)
  digitalTools: string;    // Main digital tools to use
  durationMonths: number;  // Project duration in months
}

// Product type options for the setup wizard
export const PRODUCT_TYPE_OPTIONS = [
  { value: "ebook", label: "E-Kitap", icon: "📚" },
  { value: "video", label: "Video / Kısa Film", icon: "🎬" },
  { value: "exhibition", label: "Sanal / Fiziksel Sergi", icon: "🎨" },
  { value: "map", label: "Dijital Harita", icon: "🗺️" },
  { value: "game", label: "Dijital Oyun / Quiz", icon: "🎮" },
  { value: "website", label: "Web Sitesi / Blog", icon: "🌐" },
  { value: "magazine", label: "Dijital Dergi", icon: "📰" },
  { value: "podcast", label: "Podcast", icon: "🎙️" },
  { value: "presentation", label: "Sunum / İnfografik", icon: "📊" },
  { value: "other", label: "Diğer", icon: "✨" },
];

// Age group options
export const AGE_GROUP_OPTIONS = [
  { value: "6-10", label: "6-10 yaş (İlkokul)" },
  { value: "10-14", label: "10-14 yaş (Ortaokul)" },
  { value: "14-18", label: "14-18 yaş (Lise)" },
  { value: "mixed", label: "Karma yaş grubu" },
];

// ── FIXED Phase 1: Preparation & Introduction ──
export const PHASE_1_FIXED: TemplatePhase = {
  title: "Hazırlık, Tanışma ve E-Güvenlik",
  description: "Projenin temellerini atan aşama: öğretmen koordinasyonu, öğrenci kayıtları, e-güvenlik eğitimleri ve proje kimliğinin oluşturulması.",
  order: 1,
  color: "#3B82F6",
  isDynamic: false,
  tasks: [
    { title: "Kurucu ve üye öğretmenlerle çevrimiçi toplantı yapılması", priority: "high", order: 1 },
    { title: "Görev dağılımının belirlenmesi ve yazılı hale getirilmesi", priority: "high", order: 2 },
    { title: "Öğrencilerin TwinSpace'e eklenmesi", priority: "high", order: 3 },
    { title: "Veli izin belgelerinin tamamlanması", priority: "high", order: 4 },
    { title: "E-güvenlik ve dijital ayak izi eğitiminin verilmesi", priority: "high", order: 5 },
    { title: "Telif hakkı farkındalık eğitiminin verilmesi", priority: "medium", order: 6 },
    { title: "Öğrencilere logo ve afiş tasarım görevi verilmesi", priority: "medium", order: 7 },
    { title: "Anket ile proje logosunun demokratik oylamayla seçilmesi", priority: "medium", order: 8 },
    { title: "Öğrencilerin tanışma panosu oluşturması (Padlet, Voki vb.)", priority: "medium", order: 9 },
  ],
};

// ── DYNAMIC Phase 2 structure (tasks filled by AI) ──
export const PHASE_2_STRUCTURE: Omit<TemplatePhase, "tasks"> = {
  title: "Araştırma ve İçerik Üretimi",
  description: "Her okulun proje konusunu araştırdığı, veri topladığı ve içerik ürettiği aşama.",
  order: 2,
  color: "#22C55E",
  isDynamic: true,
};

// ── DYNAMIC Phase 3 structure (tasks filled by AI) ──
export const PHASE_3_STRUCTURE: Omit<TemplatePhase, "tasks"> = {
  title: "Uluslararası İşbirlikli Üretim",
  description: "Farklı ülkelerden öğrencilerin karma takımlar halinde ortak ürün geliştirdiği işbirlikçi çalışma aşaması.",
  order: 3,
  color: "#F97316",
  isDynamic: true,
};

// ── FIXED Phase 4: Evaluation & Dissemination ──
export const PHASE_4_FIXED: TemplatePhase = {
  title: "Değerlendirme, Yayma ve Kapanış",
  description: "Proje çıktılarının sergilenmesi, değerlendirme verilerinin toplanması ve kalite etiketi başvurusunun hazırlanması.",
  order: 4,
  color: "#A855F7",
  isDynamic: false,
  tasks: [
    { title: "Ortak dijital ürünün sergilenmesi ve sunulması", priority: "high", order: 1 },
    { title: "Proje başı ve sonu öğrenci anketlerinin karşılaştırılması", priority: "medium", order: 2 },
    { title: "Odak grup görüşmelerinin yapılması (10–15 öğrenci)", priority: "medium", order: 3 },
    { title: "Proje sonuçlarının okul web sitesinde yayınlanması", priority: "high", order: 4 },
    { title: "Proje sonuçlarının okul panolarında duyurulması", priority: "medium", order: 5 },
    { title: "Yerel eTwinning bültenine haber gönderilmesi", priority: "low", order: 6 },
    { title: "Öğretmenler arası nihai değerlendirme toplantısının yapılması", priority: "high", order: 7 },
    { title: "Kalite Etiketi başvuru metninin taslağının hazırlanması", priority: "high", order: 8 },
    { title: "Ulusal Kalite Etiketi (UKE) başvurusunun yapılması", priority: "high", order: 9 },
  ],
};

/**
 * Get the full template with fixed phases and empty dynamic phases.
 * Dynamic phases need to be filled via AI generation.
 */
export function getBaseTemplate(): TemplatePhase[] {
  return [
    PHASE_1_FIXED,
    { ...PHASE_2_STRUCTURE, tasks: [] },
    { ...PHASE_3_STRUCTURE, tasks: [] },
    PHASE_4_FIXED,
  ];
}

/**
 * Build a complete template by combining fixed phases with AI-generated tasks.
 */
export function buildFullTemplate(
  phase2Tasks: TemplateTask[],
  phase3Tasks: TemplateTask[]
): TemplatePhase[] {
  return [
    PHASE_1_FIXED,
    { ...PHASE_2_STRUCTURE, tasks: phase2Tasks },
    { ...PHASE_3_STRUCTURE, tasks: phase3Tasks },
    PHASE_4_FIXED,
  ];
}

// Legacy export name for backward compatibility with existing API routes
export const ETWINNING_PROJECT_TEMPLATE = [PHASE_1_FIXED, PHASE_4_FIXED];

export const TOTAL_FIXED_TASKS = PHASE_1_FIXED.tasks.length + PHASE_4_FIXED.tasks.length;

export function getPhaseByOrder(order: number): TemplatePhase | undefined {
  return getBaseTemplate().find((p) => p.order === order);
}

export function getAllTemplateTasks(): Array<
  TemplateTask & { phaseTitle: string; phaseOrder: number; phaseColor: string }
> {
  return getBaseTemplate().flatMap((phase) =>
    phase.tasks.map((task) => ({
      ...task,
      phaseTitle: phase.title,
      phaseOrder: phase.order,
      phaseColor: phase.color,
    }))
  );
}
