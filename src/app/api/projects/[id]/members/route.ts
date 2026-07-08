import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import { sendInviteEmail } from "@/lib/email";

// GET /api/projects/[id]/members - List project members
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

    const members = await prisma.projectMember.findMany({
      where: { projectId: id },
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
      orderBy: { invitedAt: "asc" },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/members - Invite member by email
export async function POST(
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

    // Only owner can invite
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: id, userId },
      },
    });

    if (!membership || membership.role !== "owner") {
      return NextResponse.json(
        { error: "Forbidden: Only the project owner can invite members" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id },
      select: { name: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if user exists
    const invitedUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!invitedUser) {
      // Send invite email to register
      await sendInviteEmail({
        to: email,
        projectName: project.name,
        inviterName: session.user.name || session.user.email || "Bir kullanıcı",
        inviteLink: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/register?email=${encodeURIComponent(email)}`,
      });

      return NextResponse.json(
        { message: "Kullanıcı bulunamadı. E-posta adresine kayıt daveti gönderildi." },
        { status: 200 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: id, userId: invitedUser.id },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "User is already a member of this project" },
        { status: 409 }
      );
    }

    const newMember = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId: invitedUser.id,
        role: role || "member",
        joinedAt: new Date(),
      },
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
    });

    await logActivity({
      projectId: id,
      userId,
      action: "invited",
      entityType: "member",
      entityId: newMember.id,
      metadata: {
        invitedEmail: email,
        invitedUserId: invitedUser.id,
      },
    });

    // Send invite email to existing user
    await sendInviteEmail({
      to: email,
      projectName: project.name,
      inviterName: session.user.name || session.user.email || "Bir kullanıcı",
      inviteLink: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/projects/${id}`,
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error("Error inviting member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
