import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// DELETE /api/projects/[id]/notes/[noteId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, noteId } = await params;
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

    // Check if note belongs to user and project
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (note.userId !== userId || note.projectId !== id) {
      return NextResponse.json(
        { error: "Forbidden: You can only delete your own notes in this project" },
        { status: 403 }
      );
    }

    await prisma.note.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting project note:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
