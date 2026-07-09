import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/projects/[id]/teams
export async function GET(
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
    const userId = session.user.id;

    // Check membership
    const projectMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
    });

    if (!projectMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let teams = [];
    if (session.user.role === "admin" || session.user.role === "teacher") {
      // Teachers/Admins can see all teams
      teams = await prisma.team.findMany({
        where: { projectId },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, role: true, image: true } } }
          }
        }
      });
    } else {
      // Students only see their own teams
      teams = await prisma.team.findMany({
        where: { 
          projectId,
          members: { some: { userId } }
        },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, role: true, image: true } } }
          }
        }
      });
    }

    return NextResponse.json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
