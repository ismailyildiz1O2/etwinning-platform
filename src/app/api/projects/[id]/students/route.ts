import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hash } from "bcryptjs";
import { logActivity } from "@/lib/activity-logger";
import { SALT_ROUNDS } from "@/lib/constants";

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

    const hashedPassword = await hash(password, SALT_ROUNDS);

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

      // Find or create a team for the teacher
      let team = await tx.team.findFirst({
        where: {
          projectId,
          members: {
            some: { userId: session.user.id }
          }
        }
      });

      if (!team) {
        team = await tx.team.create({
          data: {
            projectId,
            name: `${session.user.name}'in Ekibi`,
            members: {
              create: {
                userId: session.user.id,
                role: "owner"
              }
            }
          }
        });
      }

      await tx.teamMember.create({
        data: {
          teamId: team.id,
          userId: user.id,
          role: "member",
          joinedAt: new Date(),
        },
      });

      return user;
    });

    await logActivity({
      projectId,
      userId: session.user.id,
      action: "created",
      entityType: "member",
      entityId: newStudent.id,
      metadata: { studentName: newStudent.name, username: newStudent.username },
    });

    return NextResponse.json(newStudent, { status: 201 });
  } catch (error) {
    console.error("Öğrenci ekleme hatası:", error);
    return NextResponse.json(
      { error: "Sunucu hatası" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    // Check permissions
    const projectMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: projectId,
          userId: session.user.id,
        },
      },
    });

    if (!projectMember || !["owner", "admin", "teacher", "member"].includes(projectMember.role)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const body = await request.json();
    const { studentId, name, username, password } = body;

    if (!studentId || !name || !username) {
      return NextResponse.json({ error: "Öğrenci ID, isim ve kullanıcı adı gereklidir" }, { status: 400 });
    }

    // Verify target user is a student in this project
    const targetMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: projectId,
          userId: studentId,
        },
      },
    });

    if (!targetMember || targetMember.role !== "student") {
      return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      name,
      username,
    };

    if (password && password.trim() !== "") {
      if (password.length < 6) {
        return NextResponse.json({ error: "Şifre en az 6 karakter olmalıdır" }, { status: 400 });
      }
      updateData.password = await hash(password, SALT_ROUNDS);
    }

    const updatedStudent = await prisma.user.update({
      where: { id: studentId },
      data: updateData,
    });

    return NextResponse.json({ success: true, user: { id: updatedStudent.id, name: updatedStudent.name, username: updatedStudent.username } });
  } catch (error: unknown) {
    console.error("Öğrenci güncelleme hatası:", error);
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: "Bu kullanıcı adı zaten kullanılıyor" }, { status: 409 });
    }
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
