"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sparkles,
  Check,
  Pencil,
  Trash2,
  Plus,
  RefreshCw,
  ListTodo,
  BookOpen,
  Users,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import {
  PHASE_1_FIXED,
  PHASE_4_FIXED,
  PHASE_2_STRUCTURE,
  PHASE_3_STRUCTURE,
  PRODUCT_TYPE_OPTIONS,
  AGE_GROUP_OPTIONS,
  type TemplatePhase,
} from "@/lib/etwinning-template";

// ── Types ──────────────────────────────────────────────────────────────

interface EditableTask {
  id: string;
  title: string;
  isEditing: boolean;
}

// ── Step Indicator Component ───────────────────────────────────────────

function StepIndicator({ currentStep }: { currentStep: number }) {
  const { t } = useI18n();
  const STEPS = [
    { number: 1, label: t.newProjectDialog.title, icon: BookOpen },
    { number: 2, label: "Customize", icon: Sparkles },
    { number: 3, label: t.project.tasks, icon: ListTodo },
  ];

  return (
    <div className="flex items-center justify-center w-full mb-10">
      {STEPS.map((step, idx) => {
        const isCompleted = currentStep > step.number;
        const isActive = currentStep === step.number;
        const isFuture = currentStep < step.number;
        const Icon = step.icon;

        return (
          <div key={step.number} className="flex items-center">
            {/* Step circle + label */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 border-2",
                  isCompleted &&
                    "bg-gradient-to-br from-blue-500 to-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30",
                  isActive &&
                    "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 shadow-lg shadow-blue-500/20 scale-110",
                  isFuture &&
                    "border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800/50"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : isActive ? (
                  <Icon className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </div>
              <span
                className={cn(
                  "mt-2.5 text-xs font-medium transition-colors duration-300 whitespace-nowrap",
                  isCompleted && "text-blue-600 dark:text-blue-400",
                  isActive && "text-blue-600 dark:text-blue-400 font-semibold",
                  isFuture && "text-gray-400 dark:text-gray-500"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting line */}
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  "w-16 sm:w-24 lg:w-32 h-0.5 mx-3 mb-6 rounded-full transition-all duration-500",
                  currentStep > step.number + 1
                    ? "bg-blue-500"
                    : currentStep > step.number
                      ? "bg-gradient-to-r from-blue-500 to-gray-300 dark:to-gray-600"
                      : "bg-gray-300 dark:bg-gray-600"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Glassmorphism Card Wrapper ─────────────────────────────────────────

function GlassCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-white/20 dark:border-gray-700/50",
        "bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl",
        "shadow-xl shadow-black/5 dark:shadow-black/20",
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/50 via-transparent to-transparent dark:from-white/5 pointer-events-none" />
      <div className="relative">{children}</div>
    </div>
  );
}

// ── Input Field Component ──────────────────────────────────────────────

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClasses =
  "w-full px-4 py-3 bg-gray-50/80 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700/50 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all duration-200 backdrop-blur-sm";

// ── Utility ────────────────────────────────────────────────────────────

let idCounter = 0;
function uniqueId(): string {
  return `task_${Date.now()}_${++idCounter}`;
}

// ── Main Page Component ────────────────────────────────────────────────

export default function NewProjectPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(1);

  // ── Step 1: Project Info ──
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [country, setCountry] = useState("");
  const [partnerSchools, setPartnerSchools] = useState("");
  const [twinspaceUrl, setTwinspaceUrl] = useState("");

  // ── Step 2: Customization ──
  const [topic, setTopic] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [productType, setProductType] = useState("");
  const [digitalTools, setDigitalTools] = useState("");
  const [durationMonths, setDurationMonths] = useState(4);

  // ── Step 3: Task Review ──
  const [phase2Tasks, setPhase2Tasks] = useState<EditableTask[]>([]);
  const [phase3Tasks, setPhase3Tasks] = useState<EditableTask[]>([]);
  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [tasksGenerated, setTasksGenerated] = useState(false);

  // ── Submission ──
  const [submitting, setSubmitting] = useState(false);

  // ── Transition animation ──
  const [isTransitioning, setIsTransitioning] = useState(false);

  // ── Step Navigation ──────────────────────────────────────────────────

  const animateTransition = useCallback((callback: () => void) => {
    setIsTransitioning(true);
    setTimeout(() => {
      callback();
      setTimeout(() => setIsTransitioning(false), 50);
    }, 200);
  }, []);

  const goToStep = useCallback(
    (step: number) => {
      animateTransition(() => setCurrentStep(step));
    },
    [animateTransition]
  );

  const validateStep1 = (): boolean => {
    if (!name.trim()) {
      toast.error("Project name is required");
      return false;
    }
    if (!startDate) {
      toast.error("Start date is required");
      return false;
    }
    if (!endDate) {
      toast.error("End date is required");
      return false;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      toast.error("End date must be after start date");
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!topic.trim()) {
      toast.error("Project topic / theme is required");
      return false;
    }
    if (!ageGroup) {
      toast.error("Target age group must be selected");
      return false;
    }
    if (!productType) {
      toast.error("Common product type must be selected");
      return false;
    }
    if (durationMonths < 1 || durationMonths > 24) {
      toast.error("Project duration must be between 1 and 24 months");
      return false;
    }
    return true;
  };

  const handleNextStep1 = () => {
    if (validateStep1()) {
      goToStep(2);
    }
  };

  // ── AI Task Generation ───────────────────────────────────────────────

  const generateTasks = useCallback(async () => {
    if (!validateStep2()) return;

    setGeneratingTasks(true);
    try {
      const res = await fetch("/api/ai/generate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          ageGroup,
          productType,
          digitalTools,
          durationMonths,
          projectName: name,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to generate tasks");
      }

      const data = await res.json();

      // Convert API response to EditableTask format
      // API returns objects: { title, priority, order }
      const p2Tasks: EditableTask[] = (data.phase2Tasks || []).map(
        (t: { title: string; priority: string; order: number } | string) => ({
          id: uniqueId(),
          title: typeof t === "string" ? t : t.title,
          isEditing: false,
        })
      );
      const p3Tasks: EditableTask[] = (data.phase3Tasks || []).map(
        (t: { title: string; priority: string; order: number } | string) => ({
          id: uniqueId(),
          title: typeof t === "string" ? t : t.title,
          isEditing: false,
        })
      );

      setPhase2Tasks(p2Tasks);
      setPhase3Tasks(p3Tasks);
      setTasksGenerated(true);
      goToStep(3);
      toast.success("Tasks generated successfully! 🎉");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to generate tasks"
      );
    } finally {
      setGeneratingTasks(false);
    }
  }, [topic, ageGroup, productType, digitalTools, durationMonths, name, goToStep]);

  // ── Task Editing Functions ───────────────────────────────────────────

  const toggleEditTask = (
    phaseNum: 2 | 3,
    taskId: string
  ) => {
    const setter = phaseNum === 2 ? setPhase2Tasks : setPhase3Tasks;
    setter((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, isEditing: !t.isEditing } : t
      )
    );
  };

  const updateTaskTitle = (
    phaseNum: 2 | 3,
    taskId: string,
    newTitle: string
  ) => {
    const setter = phaseNum === 2 ? setPhase2Tasks : setPhase3Tasks;
    setter((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, title: newTitle } : t))
    );
  };

  const deleteTask = (phaseNum: 2 | 3, taskId: string) => {
    const setter = phaseNum === 2 ? setPhase2Tasks : setPhase3Tasks;
    setter((prev) => prev.filter((t) => t.id !== taskId));
    toast.success("Task deleted");
  };

  const addTask = (phaseNum: 2 | 3) => {
    const newTask: EditableTask = {
      id: uniqueId(),
      title: "",
      isEditing: true,
    };
    const setter = phaseNum === 2 ? setPhase2Tasks : setPhase3Tasks;
    setter((prev) => [...prev, newTask]);
  };

  // ── Regenerate ───────────────────────────────────────────────────────

  const regenerateTasks = async () => {
    setGeneratingTasks(true);
    try {
      const res = await fetch("/api/ai/generate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          ageGroup,
          productType,
          digitalTools,
          durationMonths,
          projectName: name,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to regenerate tasks");
      }

      const data = await res.json();

      const p2Tasks: EditableTask[] = (data.phase2Tasks || []).map(
        (t: { title: string; priority: string; order: number } | string) => ({
          id: uniqueId(),
          title: typeof t === "string" ? t : t.title,
          isEditing: false,
        })
      );
      const p3Tasks: EditableTask[] = (data.phase3Tasks || []).map(
        (t: { title: string; priority: string; order: number } | string) => ({
          id: uniqueId(),
          title: typeof t === "string" ? t : t.title,
          isEditing: false,
        })
      );

      setPhase2Tasks(p2Tasks);
      setPhase3Tasks(p3Tasks);
      toast.success("Tasks regenerated successfully! 🔄");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to regenerate tasks"
      );
    } finally {
      setGeneratingTasks(false);
    }
  };

  // ── Final Submission ─────────────────────────────────────────────────

  const handleSubmit = async () => {
    // Validate all tasks have titles
    const allPhase2Valid = phase2Tasks.every((t) => t.title.trim());
    const allPhase3Valid = phase3Tasks.every((t) => t.title.trim());

    if (!allPhase2Valid || !allPhase3Valid) {
      toast.error("All task titles must be filled");
      return;
    }

    if (phase2Tasks.length === 0 && phase3Tasks.length === 0) {
      toast.error("At least one dynamic task must be added");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          startDate,
          endDate,
          country: country.trim(),
          partnerSchools: partnerSchools
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          twinspaceUrl: twinspaceUrl.trim(),
          useTemplate: true,
          customTemplate: {
            phase2Tasks: phase2Tasks.map((t, i) => ({
              title: t.title.trim(),
              priority: "medium" as const,
              order: i + 1,
            })),
            phase3Tasks: phase3Tasks.map((t, i) => ({
              title: t.title.trim(),
              priority: "medium" as const,
              order: i + 1,
            })),
          },
          projectMeta: {
            topic: topic.trim(),
            ageGroup,
            productType,
            digitalTools: digitalTools.trim(),
            durationMonths,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create project");
      }

      const project = await res.json();
      toast.success("Project created successfully! 🎉");
      router.push(`/projects/${project.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create project"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Computed Values ──────────────────────────────────────────────────

  const totalTasks =
    PHASE_1_FIXED.tasks.length +
    phase2Tasks.length +
    phase3Tasks.length +
    PHASE_4_FIXED.tasks.length;

  // ── Render Step 1: Proje Bilgileri ───────────────────────────────────

  const renderStep1 = () => (
    <GlassCard className="max-w-2xl mx-auto">
      <div className="p-8">
        {/* Step header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t.newProjectDialog.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t.newProjectDialog.subtitle}
            </p>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent my-6" />

        <div className="space-y-5">
          {/* Proje Adı */}
          <FormField label={t.newProjectDialog.projectName} required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.newProjectDialog.projectNamePlaceholder}
              className={inputClasses}
            />
          </FormField>

          {/* Açıklama */}
          <FormField label={t.newProjectDialog.description}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={t.newProjectDialog.descriptionPlaceholder}
              className={cn(inputClasses, "resize-none")}
            />
          </FormField>

          {/* Tarihler */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label={t.newProjectDialog.startDate} required>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClasses}
              />
            </FormField>
            <FormField label={t.newProjectDialog.endDate} required>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputClasses}
              />
            </FormField>
          </div>

          {/* Ülke */}
          <FormField label={t.newProjectDialog.country}>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder={t.newProjectDialog.countryPlaceholder}
              className={inputClasses}
            />
          </FormField>

          {/* Ortak Okullar */}
          <FormField label={t.newProjectDialog.partnerSchools}>
            <input
              type="text"
              value={partnerSchools}
              onChange={(e) => setPartnerSchools(e.target.value)}
              placeholder={t.newProjectDialog.partnerSchoolsPlaceholder}
              className={inputClasses}
            />
          </FormField>

          {/* TwinSpace URL */}
          <FormField label={t.newProjectDialog.twinspaceUrl}>
            <input
              type="url"
              value={twinspaceUrl}
              onChange={(e) => setTwinspaceUrl(e.target.value)}
              placeholder="https://twinspace.etwinning.net/..."
              className={inputClasses}
            />
          </FormField>
        </div>

        {/* Navigation */}
        <div className="flex justify-end mt-8">
          <button
            type="button"
            onClick={handleNextStep1}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            {t.common.continue}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </GlassCard>
  );

  // ── Render Step 2: Proje Özelleştirme ────────────────────────────────

  const renderStep2 = () => (
    <GlassCard className="max-w-3xl mx-auto">
      <div className="p-8">
        {/* Step header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t.customizeStep.title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t.customizeStep.subtitle}
            </p>
          </div>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent my-6" />

        <div className="space-y-6">
          {/* Proje Konusu */}
          <FormField label={t.customizeStep.topicLabel} required>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={t.customizeStep.topicPlaceholder}
              className={inputClasses}
            />
          </FormField>

          {/* Hedef Yaş Grubu */}
          <FormField label={t.customizeStep.ageGroupLabel} required>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              className={cn(inputClasses, !ageGroup && "text-gray-400 dark:text-gray-500")}
            >
              <option value="" disabled className="bg-white text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                {t.customizeStep.ageGroupPlaceholder}
              </option>
              {AGE_GROUP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>

          {/* Ortak Ürün Türü - Grid of Cards */}
          <FormField label={t.customizeStep.productTypeLabel} required>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {PRODUCT_TYPE_OPTIONS.map((opt) => {
                const isSelected = productType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setProductType(opt.value)}
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-center group",
                      isSelected
                        ? "border-blue-500 bg-blue-50/80 dark:bg-blue-950/40 shadow-lg shadow-blue-500/15 scale-[1.02]"
                        : "border-gray-200/80 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/30 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 hover:scale-[1.01]"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <span className="text-2xl group-hover:scale-110 transition-transform duration-200" aria-hidden="true">
                      {opt.icon}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-medium leading-tight",
                        isSelected
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-gray-600 dark:text-gray-400"
                      )}
                    >
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </FormField>

          {/* Dijital Araçlar */}
          <FormField label={t.customizeStep.digitalToolsLabel}>
            <input
              type="text"
              value={digitalTools}
              onChange={(e) => setDigitalTools(e.target.value)}
              placeholder={t.customizeStep.digitalToolsPlaceholder}
              className={inputClasses}
            />
          </FormField>

          {/* Proje Süresi */}
          <FormField label={t.customizeStep.durationLabel} required>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={24}
                value={durationMonths}
                onChange={(e) =>
                  setDurationMonths(parseInt(e.target.value) || 4)
                }
                className={cn(inputClasses, "w-28")}
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {t.customizeStep.monthSuffix}
              </span>
            </div>
          </FormField>
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={() => goToStep(1)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200/80 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/30 text-gray-700 dark:text-gray-300 font-medium text-sm transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            type="button"
            onClick={generateTasks}
            disabled={generatingTasks}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          >
            {generatingTasks ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Tasks...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Tasks
              </>
            )}
          </button>
        </div>
      </div>
    </GlassCard>
  );

  // ── Render Phase Block (Step 3 helper) ───────────────────────────────

  const renderFixedPhase = (
    phase: TemplatePhase,
    colorClasses: { border: string; bg: string; text: string; badge: string }
  ) => (
    <GlassCard className="overflow-hidden">
      <div className={cn("border-l-4", colorClasses.border)}>
        {/* Phase header */}
        <div className={cn("px-5 py-4", colorClasses.bg)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white",
                  colorClasses.badge
                )}
              >
                {phase.order}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                {phase.title}
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-gray-200/60 dark:bg-gray-700/40 text-xs font-medium text-gray-500 dark:text-gray-400">
              Fixed
            </span>
          </div>
        </div>

        {/* Tasks */}
        <div className="px-5 py-3">
          <ul className="space-y-2">
            {phase.tasks.map((task, idx) => (
              <li
                key={idx}
                className="flex items-center gap-2.5 py-1.5 text-sm text-gray-500 dark:text-gray-400"
              >
                <CheckCircle2 className="w-4 h-4 text-gray-300 dark:text-gray-600 shrink-0" />
                <span className="opacity-75">{task.title}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 ml-6">
            {phase.tasks.length} tasks
          </p>
        </div>
      </div>
    </GlassCard>
  );

  const renderDynamicPhase = (
    phaseNum: 2 | 3,
    phaseTitle: string,
    tasks: EditableTask[],
    colorClasses: { border: string; bg: string; text: string; badge: string }
  ) => (
    <GlassCard className="overflow-hidden">
      <div className={cn("border-l-4", colorClasses.border)}>
        {/* Phase header */}
        <div className={cn("px-5 py-4", colorClasses.bg)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white",
                  colorClasses.badge
                )}
              >
                {phaseNum}
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                {phaseTitle}
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-100/60 dark:bg-blue-900/30 text-xs font-medium text-blue-600 dark:text-blue-400">
              🤖 AI Generated
            </span>
          </div>
        </div>

        {/* Tasks */}
        <div className="px-5 py-3">
          <ul className="space-y-1.5">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="group flex items-center gap-2 py-1.5 rounded-lg transition-colors duration-150"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0" />

                {task.isEditing ? (
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) =>
                      updateTaskTitle(phaseNum, task.id, e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") toggleEditTask(phaseNum, task.id);
                    }}
                    onBlur={() => toggleEditTask(phaseNum, task.id)}
                    autoFocus
                    placeholder="Type task title..."
                    className="flex-1 px-2 py-1 text-sm bg-blue-50/80 dark:bg-blue-950/30 border border-blue-300/50 dark:border-blue-700/50 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
                  />
                ) : (
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
                    {task.title || (
                      <span className="text-gray-400 italic">
                        Empty task...
                      </span>
                    )}
                  </span>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button
                    type="button"
                    onClick={() => toggleEditTask(phaseNum, task.id)}
                    className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 text-gray-400 hover:text-blue-500 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTask(phaseNum, task.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Add task button */}
          <button
            type="button"
            onClick={() => addTask(phaseNum)}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-xs font-medium text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-600 dark:hover:text-blue-400 transition-all duration-200 hover:bg-blue-50/30 dark:hover:bg-blue-950/20"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>

          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 ml-5">
            {tasks.length} tasks
          </p>
        </div>
      </div>
    </GlassCard>
  );

  // ── Render Step 3: Görev Onayı ───────────────────────────────────────

  const phaseColorSets = {
    1: {
      border: "border-blue-500",
      bg: "bg-blue-50/50 dark:bg-blue-950/20",
      text: "text-blue-600",
      badge: "bg-blue-500",
    },
    2: {
      border: "border-green-500",
      bg: "bg-green-50/50 dark:bg-green-950/20",
      text: "text-green-600",
      badge: "bg-green-500",
    },
    3: {
      border: "border-orange-500",
      bg: "bg-orange-50/50 dark:bg-orange-950/20",
      text: "text-orange-600",
      badge: "bg-orange-500",
    },
    4: {
      border: "border-purple-500",
      bg: "bg-purple-50/50 dark:bg-purple-950/20",
      text: "text-purple-600",
      badge: "bg-purple-500",
    },
  } as const;

  const renderStep3 = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <GlassCard>
        <div className="p-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/25">
                <ListTodo className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Task Review
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Review and edit tasks, then create your project
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Total task count */}
              <div className="px-4 py-2 rounded-xl bg-gray-100/80 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {totalTasks}
                  </span>
                  <span className="text-xs text-gray-500">total tasks</span>
                </div>
              </div>

              {/* Regenerate button */}
              <button
                type="button"
                onClick={regenerateTasks}
                disabled={generatingTasks}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-200/50 dark:border-blue-800/30 bg-blue-50/80 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-sm font-medium transition-all duration-200 hover:bg-blue-100/80 dark:hover:bg-blue-950/50 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {generatingTasks ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Regenerate
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Loading overlay for regeneration */}
      {generatingTasks && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-pulse">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
              <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              AI is generating your tasks...
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              This may take a few seconds
            </p>
          </div>
        </div>
      )}

      {/* Phase blocks */}
      {!generatingTasks && (
        <div className="space-y-4">
          {/* Phase 1 - Fixed */}
          {renderFixedPhase(PHASE_1_FIXED, phaseColorSets[1])}

          {/* Phase 2 - AI Generated / Editable */}
          {renderDynamicPhase(
            2,
            PHASE_2_STRUCTURE.title,
            phase2Tasks,
            phaseColorSets[2]
          )}

          {/* Phase 3 - AI Generated / Editable */}
          {renderDynamicPhase(
            3,
            PHASE_3_STRUCTURE.title,
            phase3Tasks,
            phaseColorSets[3]
          )}

          {/* Phase 4 - Fixed */}
          {renderFixedPhase(PHASE_4_FIXED, phaseColorSets[4])}
        </div>
      )}

      {/* Bottom navigation */}
      {!generatingTasks && (
        <div className="flex justify-between pt-4">
          <button
            type="button"
            onClick={() => goToStep(2)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200/80 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/30 text-gray-700 dark:text-gray-300 font-medium text-sm transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:scale-[1.02] active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-green-500/25 hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Create Project
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  // ── Main Render ──────────────────────────────────────────────────────

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Background gradient decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 rounded-full bg-purple-500/5 dark:bg-purple-500/10 blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-80 h-80 rounded-full bg-green-500/5 dark:bg-green-500/10 blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-800/60 transition-all duration-200 hover:scale-105 active:scale-95 border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create New Project
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              Create your eTwinning project step by step
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Step Content */}
        <div
          className={cn(
            "transition-all duration-300",
            isTransitioning
              ? "opacity-0 translate-y-4"
              : "opacity-100 translate-y-0"
          )}
        >
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
}
