import prisma from "@/lib/prisma";

/**
 * Supported entity types for activity logging.
 */
export type EntityType =
  | "project"
  | "phase"
  | "task"
  | "note"
  | "file"
  | "member"
  | "user";

/**
 * Common actions that can be logged.
 */
export type ActionType =
  | "created"
  | "updated"
  | "deleted"
  | "completed"
  | "uncompleted"
  | "assigned"
  | "unassigned"
  | "invited"
  | "joined"
  | "left"
  | "uploaded"
  | "removed"
  | "commented"
  | "reordered";

export interface LogActivityParams {
  projectId: string;
  userId: string;
  action: ActionType;
  entityType: EntityType;
  entityId: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an activity to the ActivityLog table.
 *
 * This function is fire-and-forget: errors are caught and logged to the
 * console so they never crash the caller's request.
 */
export async function logActivity({
  projectId,
  userId,
  action,
  entityType,
  entityId,
  metadata,
}: LogActivityParams): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        projectId,
        userId,
        action,
        entityType,
        entityId,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    // Never let activity logging crash a request
    console.error("[ActivityLogger] Failed to log activity:", error);
  }
}

/**
 * Fetch the most recent activity logs for a project.
 */
export async function getProjectActivity(
  projectId: string,
  limit: number = 20
) {
  return prisma.activityLog.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Fetch activity logs for a specific entity.
 */
export async function getEntityActivity(
  entityType: EntityType,
  entityId: string,
  limit: number = 10
) {
  return prisma.activityLog.findMany({
    where: { entityType, entityId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Fetch activity logs for a specific user across all projects.
 */
export async function getUserActivity(userId: string, limit: number = 20) {
  return prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/**
 * Human-readable description for an activity log entry (Turkish).
 */
export function describeActivity(
  action: ActionType,
  entityType: EntityType,
  metadata?: Record<string, unknown> | null
): string {
  const entityLabels: Record<EntityType, string> = {
    project: "proje",
    phase: "aşama",
    task: "görev",
    note: "not",
    file: "dosya",
    member: "üye",
    user: "kullanıcı",
  };

  const actionLabels: Record<ActionType, string> = {
    created: "oluşturdu",
    updated: "güncelledi",
    deleted: "sildi",
    completed: "tamamladı",
    uncompleted: "tamamlanmadı olarak işaretledi",
    assigned: "atadı",
    unassigned: "atamasını kaldırdı",
    invited: "davet etti",
    joined: "katıldı",
    left: "ayrıldı",
    uploaded: "yükledi",
    removed: "kaldırdı",
    commented: "yorum yaptı",
    reordered: "yeniden sıraladı",
  };

  const entity = entityLabels[entityType] || entityType;
  const actionText = actionLabels[action] || action;

  const name =
    metadata && typeof metadata === "object" && "name" in metadata
      ? ` "${metadata.name}"`
      : "";

  return `Bir ${entity}${name} ${actionText}`;
}
