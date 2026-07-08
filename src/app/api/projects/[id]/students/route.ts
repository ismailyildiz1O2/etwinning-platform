import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { logActivity } from "@/lib/activity-logger";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await params since it's a promise in Next.js 15+
    const resolvedParams = await context.params;
    const projectId = resolvedParams.id;

    // Sadece proje üyeleri (tercihen admin/owner) öğrenci ekleyebilir
    const projectMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: projectId,
          userId: session.user.id,
        },
      },
    });

    if (!projectMember || !["owner", "admin", "member"].includes(projectMember.role)) {
      return NextResponse.json(
        { error: "Bu projeye öğrenci ekleme yetkiniz yok" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, username, password } = body;

    if (!name || !username || !password) {
      return NextResponse.json(
        { error: "İsim, kullanıcı adı ve şifre gereklidir" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Şifre en az 6 karakter olmalıdır" },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Bu kullanıcı adı zaten alınmış" },
        { status: 409 }
      );
    }

    const hashedPassword = await hash(password, 12);

    // Run in transaction to ensure both user creation and project member addition succeed
    const newStudent = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: {
          name,
          username,
          password: hashedPassword,
          role: "student",
        },
      });

      await tx.projectMember.create({
        data: {
          projectId,
          userId: user.id,
          role: "student",
          joinedAt: new Date(),
        },
      });

      return user;
    });

    // Log the activity
    await logActivity({
      projectId,
      userId: session.user.id,
      action: "created",
      entityType: "member",
      entityId: newStudent.id,
      metadata: { studentName: newStudent.name, username: newStudent.username },
    });

    return NextResponse.json({ success: true, user: { id: newStudent.id, name: newStudent.name, username: newStudent.username } }, { status: 201 });
  } catch (error) {
    console.error("Add student error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
