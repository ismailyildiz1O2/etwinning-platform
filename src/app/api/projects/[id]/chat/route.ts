import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/projects/[id]/chat?channel=general
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const channel = searchParams.get("channel");

    if (!channel) {
      return NextResponse.json({ error: "Kanal belirtilmedi" }, { status: 400 });
    }

    const resolvedParams = await context.params;
    const projectId = resolvedParams.id;

    // Verify access
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: session.user.id },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Bu projeye erişim yetkiniz yok" }, { status: 403 });
    }

    // Access control based on channel
    const userRole = member.role; // "owner", "admin", "member", "student"
    if (channel === "teachers" && userRole === "student") {
      return NextResponse.json({ error: "Bu kanala erişim yetkiniz yok" }, { status: 403 });
    }

    if (channel === "local_teachers" && userRole === "student") {
      return NextResponse.json({ error: "Bu kanala erişim yetkiniz yok" }, { status: 403 });
    }

    // If channel is team_<id>, verify user is in that team
    if (channel.startsWith("team_")) {
      const teamId = channel.replace("team_", "");
      const teamMember = await prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId, userId: session.user.id } },
      });
      if (!teamMember && !["owner", "admin"].includes(userRole)) {
        return NextResponse.json({ error: "Bu ekibe erişim yetkiniz yok" }, { status: 403 });
      }
    }

    let actualChannel = channel;
    if (channel === "local_teachers") {
      actualChannel = `local_teachers_${member.user?.country || "unknown"}`;
    }

    const messages = await prisma.message.findMany({
      where: {
        projectId,
        channel: actualChannel,
        deletedAt: null,
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true, role: true, country: true },
        },
        files: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("GET Chat Error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST /api/projects/[id]/chat
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

    const body = await request.json();
    const { channel, content, fileIds } = body;

    if (!channel || !content) {
      return NextResponse.json({ error: "Kanal ve içerik gereklidir" }, { status: 400 });
    }

    // Verify access
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: session.user.id },
      },
      include: { user: true },
    });

    if (!member) {
      return NextResponse.json({ error: "Bu projeye erişim yetkiniz yok" }, { status: 403 });
    }

    const userRole = member.role;
    if (channel === "teachers" && userRole === "student") {
      return NextResponse.json({ error: "Bu kanala yazma yetkiniz yok" }, { status: 403 });
    }

    if (channel === "local_teachers" && userRole === "student") {
      return NextResponse.json({ error: "Bu kanala yazma yetkiniz yok" }, { status: 403 });
    }

    if (channel === "local_teachers" && !member.user.country) {
      // Don't fail, just use 'unknown' fallback
    }

    let actualChannel = channel;
    if (channel === "local_teachers") {
      actualChannel = `local_teachers_${member.user?.country || "unknown"}`;
    }

    const message = await prisma.message.create({
      data: {
        projectId,
        channel: actualChannel,
        senderId: session.user.id,
        content,
        // If there are files, link them
        ...(fileIds && fileIds.length > 0
          ? {
              files: {
                connect: fileIds.map((id: string) => ({ id })),
              },
            }
          : {}),
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true, role: true, country: true },
        },
        files: true,
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("POST Chat Error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
