import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";

// POST /api/phases - Create a new phase
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { projectId, title, description, order, color, startDate, endDate } =
      body;

    if (!projectId || !title) {
      return NextResponse.json(
        { error: "projectId and title are required" },
        { status: 400 }
      );
    }

    // Check membership
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

    // Auto-determine order if not provided
    let phaseOrder = order;
    if (phaseOrder === undefined || phaseOrder === null) {
      const lastPhase = await prisma.phase.findFirst({
        where: { projectId },
        orderBy: { order: "desc" },
      });
      phaseOrder = lastPhase ? lastPhase.order + 1 : 1;
    }

    const phase = await prisma.phase.create({
      data: {
        projectId,
        title,
        description: description || null,
        order: phaseOrder,
        color: color || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
      include: {
        tasks: true,
      },
    });

    await logActivity({
      projectId,
      userId,
      action: "created",
      entityType: "phase",
      entityId: phase.id,
      metadata: { title: phase.title },
    });

    return NextResponse.json(phase, { status: 201 });
  } catch (error) {
    console.error("Error creating phase:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
