import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";

// PATCH /api/tasks/[id]/complete - Toggle task completion
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    const existingTask = await prisma.task.findUnique({
      where: { id, deletedAt: null },
      include: {
        phase: {
          select: { projectId: true },
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: existingTask.phase.projectId,
          userId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this project" },
        { status: 403 }
      );
    }

    // Toggle isCompleted
    const task = await prisma.task.update({
      where: { id },
      data: {
        isCompleted: !existingTask.isCompleted,
      },
      include: {
        phase: {
          select: {
            id: true,
            title: true,
            color: true,
            projectId: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    await logActivity({
      projectId: existingTask.phase.projectId,
      userId,
      action: task.isCompleted ? "completed" : "uncompleted",
      entityType: "task",
      entityId: id,
      metadata: { title: task.title, isCompleted: task.isCompleted },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error toggling task completion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
