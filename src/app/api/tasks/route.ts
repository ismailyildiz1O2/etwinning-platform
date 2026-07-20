import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";

// GET /api/tasks - List tasks with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);

    const phaseId = searchParams.get("phaseId");
    const projectId = searchParams.get("projectId");
    const isCompleted = searchParams.get("isCompleted");
    const priority = searchParams.get("priority");
    const assigneeId = searchParams.get("assigneeId");
    const aiGenerated = searchParams.get("aiGenerated");

    // Build where clause
    const where: Record<string, unknown> = {
      deletedAt: null,
    };

    if (phaseId) where.phaseId = phaseId;
    if (isCompleted !== null && isCompleted !== undefined && isCompleted !== "") {
      where.isCompleted = isCompleted === "true";
    }
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;
    if (aiGenerated !== null && aiGenerated !== undefined && aiGenerated !== "") {
      where.aiGenerated = aiGenerated === "true";
    }

    // If projectId is specified, filter tasks by project
    if (projectId) {
      // Verify membership
      const membership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: { projectId, userId },
        },
      });

      if (!membership) {
        return NextResponse.json(
          { error: "Forbidden: You are not a member of this project" },
          { status: 403 }
        );
      }

      where.phase = { projectId };
    } else {
      // Only return tasks from projects the user is a member of
      where.phase = {
        project: {
          deletedAt: null,
          members: {
            some: { userId },
          },
        },
      };
    }

    const tasks = await prisma.task.findMany({
      where,
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
        _count: {
          select: { notes: true, files: true },
        },
      },
      orderBy: [
        { dueDate: { sort: "asc", nulls: "last" } },
        { createdAt: "asc" }
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const {
      phaseId,
      title,
      description,
      priority,
      dueDate,
      assigneeId,
      tags,
      aiGenerated,
      parentId,
    } = body;

    if (!phaseId || !title) {
      return NextResponse.json(
        { error: "phaseId and title are required" },
        { status: 400 }
      );
    }

    // Get phase to check project membership
    const phase = await prisma.phase.findUnique({
      where: { id: phaseId },
      select: { projectId: true },
    });

    if (!phase) {
      return NextResponse.json(
        { error: "Phase not found" },
        { status: 404 }
      );
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: phase.projectId, userId },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this project" },
        { status: 403 }
      );
    }

    const task = await prisma.task.create({
      data: {
        phaseId,
        title,
        description: description || null,
        priority: priority || "medium",
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
        tags: tags ? JSON.stringify(tags) : "[]",
        aiGenerated: aiGenerated || false,
        parentId: parentId || null,
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
      projectId: phase.projectId,
      userId,
      action: "created",
      entityType: "task",
      entityId: task.id,
      metadata: { title: task.title, phaseId },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
