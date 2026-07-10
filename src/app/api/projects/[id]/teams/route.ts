import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

    // Everyone (including teachers) should only see the teams they are members of in the chat sidebar
    const teams = await prisma.team.findMany({
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

    return NextResponse.json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
