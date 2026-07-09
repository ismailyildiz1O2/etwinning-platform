import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/admin/make-me-admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    await prisma.user.update({
      where: { id: userId },
      data: { role: "admin" },
    });

    // After updating the DB, the JWT token will still have the old role until the session expires or is refreshed.
    // The user will need to log out and log back in to get a new JWT token with the admin role.
    // Or we can just tell them to re-login.
    return NextResponse.json({ message: "Başarıyla admin yapıldınız. Lütfen çıkış yapıp tekrar giriş yapın." });
  } catch (error) {
    console.error("Error making admin:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
