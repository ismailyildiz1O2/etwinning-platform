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
  { value: "ebook", label: "E-Book", icon: "📚" },
  { value: "video", label: "Video / Short Film", icon: "🎬" },
  { value: "exhibition", label: "Virtual / Physical Exhibition", icon: "🎨" },
  { value: "map", label: "Digital Map", icon: "🗺️" },
  { value: "game", label: "Digital Game / Quiz", icon: "🎮" },
  { value: "website", label: "Website / Blog", icon: "🌐" },
  { value: "magazine", label: "Digital Magazine", icon: "📰" },
  { value: "podcast", label: "Podcast", icon: "🎙️" },
  { value: "presentation", label: "Presentation / Infographic", icon: "📊" },
  { value: "other", label: "Other Joint Product", icon: "✨" },
];

// Age group options
export const AGE_GROUP_OPTIONS = [
  { value: "6-10", label: "Ages 6-10 (Primary School)" },
  { value: "10-14", label: "Ages 10-14 (Middle School)" },
  { value: "14-18", label: "Ages 14-18 (High School)" },
  { value: "mixed", label: "Mixed Age Group" },
];

// ── FIXED Phase 1: Preparation & Introduction ──
export const PHASE_1_FIXED: TemplatePhase = {
  title: "Preparation, Introduction & E-Safety",
  description: "The phase laying project foundations: teacher coordination, student registrations, e-safety trainings, and project identity creation.",
  order: 1,
  color: "#3B82F6",
  isDynamic: false,
  tasks: [
    { title: "Online meeting with founder and member teachers", priority: "high", order: 1 },
    { title: "Determination and documentation of task distribution", priority: "high", order: 2 },
    { title: "Adding students to TwinSpace", priority: "high", order: 3 },
    { title: "Completion of parental consent forms", priority: "high", order: 4 },
    { title: "E-safety and digital footprint training for students", priority: "high", order: 5 },
    { title: "Copyright awareness training", priority: "medium", order: 6 },
    { title: "Logo and poster design assignment for students", priority: "medium", order: 7 },
    { title: "Democratic voting for project logo selection", priority: "medium", order: 8 },
    { title: "Student introduction board creation (Padlet, Voki, etc.)", priority: "medium", order: 9 },
  ],
};

// ── DYNAMIC Phase 2 structure (tasks filled by AI) ──
export const PHASE_2_STRUCTURE: Omit<TemplatePhase, "tasks"> = {
  title: "Research & Content Creation",
  description: "Phase where each school researches the project topic, collects data, and creates content.",
  order: 2,
  color: "#22C55E",
  isDynamic: true,
};

// ── DYNAMIC Phase 3 structure (tasks filled by AI) ──
export const PHASE_3_STRUCTURE: Omit<TemplatePhase, "tasks"> = {
  title: "International Collaborative Production",
  description: "Collaborative work phase where students from different countries develop joint products in mixed teams.",
  order: 3,
  color: "#F97316",
  isDynamic: true,
};

// ── FIXED Phase 4: Evaluation & Dissemination ──
export const PHASE_4_FIXED: TemplatePhase = {
  title: "Evaluation, Dissemination & Closure",
  description: "Exhibition of project outputs, collection of evaluation data, and preparation of Quality Label application.",
  order: 4,
  color: "#A855F7",
  isDynamic: false,
  tasks: [
    { title: "Exhibition and presentation of joint digital products", priority: "high", order: 1 },
    { title: "Comparison of pre-project and post-project student surveys", priority: "medium", order: 2 },
    { title: "Preparation and submission of Quality Label application", priority: "high", order: 3 },
    { title: "Dissemination activities on school website and social media", priority: "medium", order: 4 },
    { title: "Distribution of participation certificates to students", priority: "low", order: 5 },
  ],
};
