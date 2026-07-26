import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST /api/projects/[id]/tasks/quick
// Quickly assigns a task from the chat interface
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await context.params;
    const projectId = resolvedParams.id;

    const { title, assigneeId, dueDate, description } = await request.json();

    if (!title || !assigneeId) {
      return NextResponse.json({ error: "Title and assignee are required" }, { status: 400 });
    }

    // Verify access
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: session.user.id },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Find or create "Chat Tasks" phase
    let phase = await prisma.phase.findFirst({
      where: { projectId, title: "Chat Tasks" },
    });

    if (!phase) {
      const highestOrderPhase = await prisma.phase.findFirst({
        where: { projectId },
        orderBy: { order: "desc" },
      });
      phase = await prisma.phase.create({
        data: {
          projectId,
          title: "Chat Tasks",
          order: (highestOrderPhase?.order || 0) + 1,
          color: "orange",
        },
      });
    }

    // Create the task
    const task = await prisma.task.create({
      data: {
        phaseId: phase.id,
        title,
        description,
        assigneeId,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        assignee: {
          select: { id: true, name: true, image: true },
        },
      },
    });

    // Create a notification for the assignee
    const assigner = await prisma.user.findUnique({ where: { id: session.user.id } });
    await prisma.notification.create({
      data: {
        userId: assigneeId,
        type: "task_assigned",
        title: "New Task Assigned",
        message: `${assigner?.name || "Someone"} assigned you the task "${title}".`,
        link: `/dashboard/my-tasks`,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("POST Quick Task Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
