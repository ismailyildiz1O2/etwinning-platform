import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";

// PUT /api/phases/[id] - Update a phase
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

    // Get the phase and check project membership
    const existingPhase = await prisma.phase.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingPhase) {
      return NextResponse.json(
        { error: "Phase not found" },
        { status: 404 }
      );
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: existingPhase.projectId,
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
    const { title, description, order, color, startDate, endDate, isCompleted } =
      body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (order !== undefined) updateData.order = order;
    if (color !== undefined) updateData.color = color;
    if (startDate !== undefined)
      updateData.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined)
      updateData.endDate = endDate ? new Date(endDate) : null;
    if (isCompleted !== undefined) updateData.isCompleted = isCompleted;

    const phase = await prisma.phase.update({
      where: { id },
      data: updateData,
      include: {
        tasks: {
          where: { deletedAt: null },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    await logActivity({
      projectId: existingPhase.projectId,
      userId,
      action: "updated",
      entityType: "phase",
      entityId: id,
      metadata: { fields: Object.keys(updateData) },
    });

    return NextResponse.json(phase);
  } catch (error) {
    console.error("Error updating phase:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/phases/[id] - Delete a phase (cascades to tasks)
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

    const existingPhase = await prisma.phase.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingPhase) {
      return NextResponse.json(
        { error: "Phase not found" },
        { status: 404 }
      );
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: existingPhase.projectId,
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

    // Cascade delete is handled by Prisma schema (onDelete: Cascade)
    await prisma.phase.delete({
      where: { id },
    });

    await logActivity({
      projectId: existingPhase.projectId,
      userId,
      action: "deleted",
      entityType: "phase",
      entityId: id,
      metadata: { title: existingPhase.title },
    });

    return NextResponse.json({ message: "Phase deleted successfully" });
  } catch (error) {
    console.error("Error deleting phase:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
