import prisma from "@/lib/prisma";

/**
 * Automatically purge (permanently delete) soft-deleted projects, tasks, and users
 * that were deleted more than 30 days (1 month) ago and not restored.
 */
export async function autoPruneDeletedItems() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [deletedProjects, deletedTasks, deletedUsers] = await Promise.all([
      prisma.project.deleteMany({
        where: {
          deletedAt: {
            lte: thirtyDaysAgo,
          },
        },
      }),
      prisma.task.deleteMany({
        where: {
          deletedAt: {
            lte: thirtyDaysAgo,
          },
        },
      }),
      prisma.user.deleteMany({
        where: {
          deletedAt: {
            lte: thirtyDaysAgo,
          },
        },
      }),
    ]);

    return {
      deletedProjectsCount: deletedProjects.count,
      deletedTasksCount: deletedTasks.count,
      deletedUsersCount: deletedUsers.count,
    };
  } catch (error) {
    console.error("Error auto-pruning deleted items:", error);
    return { deletedProjectsCount: 0, deletedTasksCount: 0, deletedUsersCount: 0 };
  }
}
