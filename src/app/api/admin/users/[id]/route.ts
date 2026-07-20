import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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
    
    // Prevent self-modification
    if (id === session.user.id) {
      return NextResponse.json({ error: "Kendi hesabınızı değiştiremezsiniz" }, { status: 400 });
    }

    const body = await request.json();
    const { role, isSuspended } = body;

    const ALLOWED_ROLES = ["admin", "teacher", "student"];
    const updateData: Record<string, unknown> = {};
    if (role !== undefined) {
      if (!ALLOWED_ROLES.includes(role)) {
        return NextResponse.json({ error: "Geçersiz rol" }, { status: 400 });
      }
      updateData.role = role;
    }
    if (isSuspended !== undefined) updateData.deletedAt = isSuspended ? new Date() : null;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
