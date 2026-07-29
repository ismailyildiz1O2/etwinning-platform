import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PATCH /api/admin/projects/[id] - Update status, restore or soft-delete
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, isDeleted, permanentDelete } = body;

    // Hard permanent delete if requested
    if (permanentDelete) {
      await prisma.project.delete({
        where: { id },
      });
      return NextResponse.json({ success: true, message: "Project permanently deleted" });
    }

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (isDeleted !== undefined) updateData.deletedAt = isDeleted ? new Date() : null;

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/projects/[id] - Permanent hard delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Project permanently deleted" });
  } catch (error) {
    console.error("Error deleting project permanently:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
