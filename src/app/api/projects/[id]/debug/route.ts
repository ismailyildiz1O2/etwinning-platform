import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const teams = await prisma.team.findMany({
    where: { projectId: params.id },
    include: { members: { include: { user: true } } }
  });
  const projectMembers = await prisma.projectMember.findMany({
    where: { projectId: params.id },
    include: { user: true }
  });
  return NextResponse.json({ teams, projectMembers });
}
