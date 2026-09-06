import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { QUALITY_LABEL_CRITERIA } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    // Verify project membership
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId: session.user.id,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden: You are not a member of this project" }, { status: 403 });
    }

    // Fetch project with all related data
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        phases: {
          include: {
            tasks: {
              include: {
                notes: true,
                files: true,
              }
            }
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Extract relevant data for the prompt
    let projectContext = `Project name: ${project.name}\nProject description: ${project.description || "Not provided"}\n\n`;
    projectContext += "Phases and tasks:\n";

    const criteriaTags: Record<string, any[]> = {};
    QUALITY_LABEL_CRITERIA.forEach(c => criteriaTags[c.id] = []);

    project.phases.forEach((phase: any) => {
      projectContext += `- ${phase.title}\n`;
      phase.tasks.forEach((task: any) => {
        projectContext += `  * Task: ${task.title} (Status: ${task.isCompleted ? 'Completed' : 'In progress'})\n`;
        if (task.description) {
          projectContext += `    Description: ${task.description}\n`;
        }
        
        let tags: string[] = [];
        try { tags = JSON.parse(task.tags || "[]"); } catch {}
        
        tags.forEach(t => {
          if (criteriaTags[t]) {
            criteriaTags[t].push({
              taskTitle: task.title,
              filesCount: task.files.length,
              notesCount: task.notes.length
            });
          }
        });
      });
    });

    projectContext += "\nAnalysis by Quality Label criteria:\n";
    QUALITY_LABEL_CRITERIA.forEach(c => {
      projectContext += `${c.label}: ${criteriaTags[c.id].length} task(s) tagged with this criterion.\n`;
      criteriaTags[c.id].forEach(item => {
        projectContext += `  - Task: ${item.taskTitle} (${item.filesCount} evidence files, ${item.notesCount} notes)\n`;
      });
    });

    // Generate AI draft
    const { generateContentWithGemini } = await import("@/lib/ai");
    
    const prompt = `
Below are the details of an eTwinning project: its phases, tasks and the evidence classified according to the eTwinning Quality Label criteria.

${projectContext}

Using this information, write a draft of an official eTwinning Quality Label application text.
The text must be professional, clear and convincing, and it MUST be written in English.
It must contain the following main sections:
1. Short Summary of the Project
2. Collaboration and Communication Between Partner Schools
3. Pedagogical Innovation and Creativity
4. Curriculum Integration
5. Use of Technology (Web 2.0 tools etc.)
6. Results, Impact and Evaluation

Under each section, refer to the concrete activities (tasks) carried out in the project as examples.
Return only the draft as plain text: no markdown (\`\`\` etc.), no extra explanations.
`;

    let draft = await generateContentWithGemini(prompt);

    if (!draft) {
      // Fallback: generate a structured template from project context
      const count = (id: string) => criteriaTags[id]?.length || 0;
      draft = `QUALITY LABEL APPLICATION DRAFT (Automatic Template)

1. Short Summary of the Project
The project "${project.name}" has been carried out successfully. ${project.description || "The project objectives have been achieved."}

2. Collaboration and Communication Between Partner Schools
Partner schools collaborated intensively throughout the project. ${count("isbirligi")} collaborative task(s) were completed.

3. Pedagogical Innovation and Creativity
Innovative teaching methods were used in the project. ${count("yenilikcilik")} task(s) involved pedagogical innovation.

4. Curriculum Integration
Project activities were successfully integrated into the school curriculum. ${count("mufredat")} task(s) were directly linked to the curriculum.

5. Use of Technology (Web 2.0 tools etc.)
Our students used a variety of Web 2.0 tools safely and effectively. ${count("teknoloji")} technology-focused task(s) were completed.

6. Results, Impact and Evaluation
The project had a lasting positive impact on students and teachers. ${count("sonuc")} result-oriented activity(ies) were carried out.

Please expand this draft with your own project details and evidence links.`;
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error("AI draft generation error:", error);
    return NextResponse.json({ error: "Failed to generate draft" }, { status: 500 });
  }
}
