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
              },
            },
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const projectsWithCounts = projects.map((project: any) => {
      const totalTasks = project.phases.reduce(
        (sum: number, phase: any) => sum + phase._count.tasks,
        0
      );
      const completedTasks = project.phases.reduce(
        (sum: number, phase: any) =>
          sum + phase.tasks.filter((t: any) => t.isCompleted).length,
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

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        country: country || null,
        partnerSchools: partnerSchools
          ? JSON.stringify(partnerSchools)
          : "[]",
        twinspaceUrl: twinspaceUrl || null,
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

      await Promise.all(
        allPhases.map(async (phaseTemplate) => {
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
            await prisma.task.createMany({
              data: tasks.map((taskTemplate) => ({
                phaseId: phase.id,
                title: taskTemplate.title,
                priority: taskTemplate.priority,
                aiGenerated: isAiPhase,
              })),
            });
          }
        })
      );
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
