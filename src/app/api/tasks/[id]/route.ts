import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";

// GET /api/tasks/[id] - Get a single task with notes and files
export async function GET(
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

    const task = await prisma.task.findUnique({
      where: { id, deletedAt: null },
      include: {
        phase: {
          select: {
            id: true,
            title: true,
            color: true,
            projectId: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
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
        notes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        files: {
          orderBy: { uploadedAt: "desc" },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    // Check membership
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.phase.projectId,
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

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/tasks/[id] - Update a task
// Also export as PATCH for compatibility
export async function PUT(
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

    const body = await request.json();
    const {
      title,
      description,
      isCompleted,
      priority,
      dueDate,
      alarmDate,
      assigneeId,
      tags,
      phaseId,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined)
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (alarmDate !== undefined)
      updateData.alarmDate = alarmDate ? new Date(alarmDate) : null;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);
    if (phaseId !== undefined) updateData.phaseId = phaseId;

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
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
        notes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        files: true,
      },
    });

    await logActivity({
      projectId: existingTask.phase.projectId,
      userId,
      action: "updated",
      entityType: "task",
      entityId: id,
      metadata: { fields: Object.keys(updateData), title: task.title },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Soft delete a task
export async function DELETE(
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

    await prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logActivity({
      projectId: existingTask.phase.projectId,
      userId,
      action: "deleted",
      entityType: "task",
      entityId: id,
      metadata: { title: existingTask.title },
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH is an alias for PUT
export { PUT as PATCH };
