import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/tasks/today - Get tasks due today or overdue for the current user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const isStudent = session.user.role === "student";
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // Find tasks assigned to the user or in projects where user is a member
    // that are due today or overdue
    const tasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        isCompleted: false,
        dueDate: {
          lte: todayEnd,
        },
        ...(isStudent ? { assigneeId: userId } : {}),
        phase: {
          project: {
            deletedAt: null,
            members: {
              some: { userId },
            },
          },
        },
      },
      include: {
        phase: {
          select: {
            title: true,
            color: true,
            order: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { dueDate: "asc" },
      take: 20,
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching today's tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
