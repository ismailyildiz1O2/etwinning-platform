import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-logger";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function getFileType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (mimeType === "application/pdf") return "pdf";
  if (
    mimeType === "application/msword" ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return "document";
  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
    return "spreadsheet";
  if (
    mimeType === "application/vnd.ms-powerpoint" ||
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  )
    return "presentation";
  if (
    mimeType === "application/zip" ||
    mimeType === "application/x-rar-compressed" ||
    mimeType === "application/x-7z-compressed"
  )
    return "archive";
  if (mimeType.startsWith("text/")) return "text";
  return "other";
}

// GET /api/tasks/[id]/files - List files for a task
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

    // Get the task and verify membership
    const task = await prisma.task.findUnique({
      where: { id, deletedAt: null },
      include: {
        phase: {
          select: { projectId: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.phase.projectId,
          userId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this project" },
        { status: 403 }
      );
    }

    const files = await prisma.file.findMany({
      where: { taskId: id },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error("Error fetching files:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/tasks/[id]/files - Upload a file for a task
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

    // Get the task and verify membership
    const task = await prisma.task.findUnique({
      where: { id, deletedAt: null },
      include: {
        phase: {
          select: { projectId: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.phase.projectId,
          userId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this project" },
        { status: 403 }
      );
    }

    // Check if JSON request (for external links)
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await request.json();
      if (!body.url || !body.name) {
        return NextResponse.json({ error: "Name and URL required for external links" }, { status: 400 });
      }

      const fileRecord = await prisma.file.create({
        data: {
          taskId: id,
          name: body.name,
          url: body.url,
          publicId: "",
          fileType: "link",
          isExternal: true,
          externalUrl: body.url,
          tags: body.tags || "[]",
        },
      });

      await logActivity({
        projectId: task.phase.projectId,
        userId,
        action: "uploaded",
        entityType: "file",
        entityId: fileRecord.id,
        metadata: { taskId: id, taskTitle: task.title, fileName: body.name, isExternal: true },
      });

      return NextResponse.json(fileRecord, { status: 201 });
    }

    // Parse FormData for actual file uploads
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Determine file type from mime
    const fileType = getFileType(file.type);

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: "Dosya yükleme henüz yapılandırılmadı. Lütfen Cloudinary ayarlarınızı kontrol edin." },
        { status: 501 } // Not Implemented
      );
    }

    // Upload to Cloudinary via upload_stream
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `etwin-asistan/${id}`,
          resource_type: "auto",
          public_id: `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9]/g, "_")}`,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    }) as { secure_url: string; public_id: string };

    const url = uploadResult.secure_url;
    const publicId = uploadResult.public_id;

    // Create file record in database
    const fileRecord = await prisma.file.create({
      data: {
        taskId: id,
        name: file.name,
        url,
        publicId,
        fileType,
        tags: task.tags || "[]",
      },
    });

    await logActivity({
      projectId: task.phase.projectId,
      userId,
      action: "uploaded",
      entityType: "file",
      entityId: fileRecord.id,
      metadata: { taskId: id, taskTitle: task.title, fileName: file.name },
    });

    return NextResponse.json(fileRecord, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id]/files - Delete a file from a task
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

    // Get the task and verify membership
    const task = await prisma.task.findUnique({
      where: { id, deletedAt: null },
      include: {
        phase: {
          select: { projectId: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.phase.projectId,
          userId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Forbidden: You are not a member of this project" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fileId } = body;

    if (!fileId) {
      return NextResponse.json(
        { error: "fileId is required" },
        { status: 400 }
      );
    }

    // Find the file and verify it belongs to this task
    const fileRecord = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    if (fileRecord.taskId !== id) {
      return NextResponse.json(
        { error: "File does not belong to this task" },
        { status: 400 }
      );
    }

    // Delete file record from database
    await prisma.file.delete({
      where: { id: fileId },
    });

    // Try to remove from Cloudinary
    try {
      if (fileRecord.publicId) {
        await cloudinary.uploader.destroy(fileRecord.publicId);
      }
    } catch {
      console.warn(`Could not delete file from Cloudinary: ${fileRecord.publicId}`);
    }

    await logActivity({
      projectId: task.phase.projectId,
      userId,
      action: "deleted",
      entityType: "file",
      entityId: fileId,
      metadata: { taskId: id, taskTitle: task.title, fileName: fileRecord.name },
    });

    return NextResponse.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id]/files - Update a file (tags, description, name)
export async function PATCH(
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

    const task = await prisma.task.findUnique({
      where: { id, deletedAt: null },
      include: {
        phase: {
          select: { projectId: true },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.phase.projectId,
          userId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { fileId, name, tags, description } = body;

    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 });
    }

    const fileRecord = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!fileRecord || fileRecord.taskId !== id) {
      return NextResponse.json({ error: "File not found in this task" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (tags !== undefined) updateData.tags = JSON.stringify(tags);
    if (description !== undefined) updateData.description = description;

    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: updateData,
    });

    await logActivity({
      projectId: task.phase.projectId,
      userId,
      action: "updated",
      entityType: "file",
      entityId: fileId,
      metadata: { taskId: id, fileName: updatedFile.name },
    });

    return NextResponse.json(updatedFile);
  } catch (error) {
    console.error("Error updating file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

