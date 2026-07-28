import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  PHASE_1_FIXED,
  PHASE_2_STRUCTURE,
  PHASE_3_STRUCTURE,
  PHASE_4_FIXED,
  type TemplateTask,
} from "@/lib/etwinning-template";

// GET /api/projects - List user's projects
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const projects = await prisma.project.findMany({
      where: {
        deletedAt: null,
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        phases: {
          select: {
            id: true,
            title: true,
            order: true,
            color: true,
            isCompleted: true,
            _count: {
              select: { tasks: true },
            },
            tasks: {
              select: {
                isCompleted: true,
                assigneeId: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const isStudent = session.user.role === "student";

    const projectsWithCounts = projects.map((project: any) => {
      const totalTasks = project.phases.reduce(
        (sum: number, phase: any) => {
          const relevantTasks = isStudent
            ? phase.tasks.filter((t: any) => t.assigneeId === userId)
            : phase.tasks;
          return sum + relevantTasks.length;
        },
        0
      );
      const completedTasks = project.phases.reduce(
        (sum: number, phase: any) => {
          const relevantTasks = isStudent
            ? phase.tasks.filter((t: any) => t.assigneeId === userId)
            : phase.tasks;
          return sum + relevantTasks.filter((t: any) => t.isCompleted).length;
        },
        0
      );

      return {
        ...project,
        phaseCount: project.phases.length,
        taskCount: totalTasks,
        completedTaskCount: completedTasks,
      };
    });

    return NextResponse.json(projectsWithCounts);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create project with dynamic template support
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const {
      name,
      description,
      startDate,
      endDate,
      country,
      partnerSchools,
      twinspaceUrl,
      useTemplate,
      customTemplate,
    } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Name, startDate, and endDate are required" },
        { status: 400 }
      );
    }

    // Safe date parsing
    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);
    const validStart = isNaN(parsedStart.getTime()) ? new Date() : parsedStart;
    const validEnd = isNaN(parsedEnd.getTime())
      ? new Date(validStart.getTime() + 90 * 24 * 60 * 60 * 1000)
      : parsedEnd;

    // Safe partner schools JSON formatting
    let partnerSchoolsJson = "[]";
    if (Array.isArray(partnerSchools)) {
      partnerSchoolsJson = JSON.stringify(partnerSchools);
    } else if (typeof partnerSchools === "string" && partnerSchools.trim()) {
      partnerSchoolsJson = JSON.stringify(
        partnerSchools.split(",").map((s) => s.trim()).filter(Boolean)
      );
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        startDate: validStart,
        endDate: validEnd,
        country: country?.trim() || null,
        partnerSchools: partnerSchoolsJson,
        twinspaceUrl: twinspaceUrl?.trim() || null,
        members: {
          create: {
            userId,
            role: "owner",
            joinedAt: new Date(),
          },
        },
      },
    });

    // If useTemplate is true, create phases and tasks
    if (useTemplate) {
      const phase2Tasks: TemplateTask[] = customTemplate?.phase2Tasks || [];
      const phase3Tasks: TemplateTask[] = customTemplate?.phase3Tasks || [];

      const allPhases = [
        { ...PHASE_1_FIXED },
        { ...PHASE_2_STRUCTURE, tasks: phase2Tasks },
        { ...PHASE_3_STRUCTURE, tasks: phase3Tasks },
        { ...PHASE_4_FIXED },
      ];

      const startDateMs = validStart.getTime();
      const endDateMs = validEnd.getTime();
      const totalDurationMs = Math.max(86400000, endDateMs - startDateMs);
      const phaseDurationMs = totalDurationMs / 4;

      for (const phaseTemplate of allPhases) {
        const phase = await prisma.phase.create({
          data: {
            projectId: project.id,
            title: phaseTemplate.title,
            description: phaseTemplate.description,
            order: phaseTemplate.order,
            color: phaseTemplate.color,
          },
        });

        const tasks = phaseTemplate.tasks || [];
        if (tasks.length > 0) {
          const isAiPhase = phaseTemplate.order === 2 || phaseTemplate.order === 3;
          const phaseStartMs = startDateMs + (phaseTemplate.order - 1) * phaseDurationMs;
          const taskDurationMs = phaseDurationMs / tasks.length;

          const taskData = tasks.map((taskTemplate, index) => {
            const taskDueMs = phaseStartMs + (index + 1) * taskDurationMs;
            const dueDateObj = isNaN(taskDueMs) ? new Date(startDateMs) : new Date(taskDueMs);
            const taskTitle = typeof taskTemplate === "string" ? taskTemplate : taskTemplate.title;
            const taskPriority = typeof taskTemplate === "string" ? "medium" : (taskTemplate.priority || "medium");

            return {
              phaseId: phase.id,
              title: taskTitle || "Untitled Task",
              priority: taskPriority,
              aiGenerated: isAiPhase,
              dueDate: isNaN(dueDateObj.getTime()) ? null : dueDateObj,
            };
          });

          await prisma.task.createMany({
            data: taskData,
          });
        }
      }
    }

    // Fetch the complete project with all relations
    const fullProject = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
        phases: {
          include: {
            tasks: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });

    return NextResponse.json(fullProject, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
