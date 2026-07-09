import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";

// GET /api/projects/[id] - Get full project details
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

    // Check membership
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: id, userId },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this project" },
        { status: 403 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id, deletedAt: null },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
              },
            },
          },
        },
        phases: {
          orderBy: { order: "asc" },
          include: {
            tasks: {
              where: { deletedAt: null, parentId: null },
              orderBy: { createdAt: "asc" },
              include: {
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
                subTasks: {
                  where: { deletedAt: null },
                  orderBy: { createdAt: "asc" },
                  include: {
                    assignee: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                    files: true,
                    _count: {
                      select: { notes: true, files: true },
                    },
                  },
                },
                _count: {
                  select: { notes: true, files: true, subTasks: true },
                },
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update project
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

    // Check membership
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: id, userId },
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
      name,
      description,
      status,
      startDate,
      endDate,
      country,
      partnerSchools,
      twinspaceUrl,
      language,
    } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (country !== undefined) updateData.country = country;
    if (partnerSchools !== undefined)
      updateData.partnerSchools = JSON.stringify(partnerSchools);
    if (twinspaceUrl !== undefined) updateData.twinspaceUrl = twinspaceUrl;
    if (language !== undefined) updateData.language = language;

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        members: {
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
        },
        phases: {
          orderBy: { order: "asc" },
        },
      },
    });

    await logActivity({
      projectId: id,
      userId,
      action: "updated",
      entityType: "project",
      entityId: id,
      metadata: { fields: Object.keys(updateData) },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Soft delete project
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

    // Only owner can delete
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: id, userId },
      },
    });

    if (!membership || membership.role !== "owner") {
      return NextResponse.json(
        { error: "Forbidden: Only the project owner can delete this project" },
        { status: 403 }
      );
    }

    await prisma.project.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await logActivity({
      projectId: id,
      userId,
      action: "deleted",
      entityType: "project",
      entityId: id,
    });

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
