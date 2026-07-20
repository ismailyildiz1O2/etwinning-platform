import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SALT_ROUNDS } from "@/lib/constants";
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Eksik bilgi" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
    }

    // Verify current password
    if (user.password) {
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return NextResponse.json({ error: "Mevcut şifre hatalı" }, { status: 400 });
      }
    } else {
      // User might be logged in with OAuth (no password), but we're mostly using credentials
      return NextResponse.json({ error: "Bu hesaba şifre ile giriş yapılamıyor" }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword,
      }
    });

    return NextResponse.json({ message: "Şifreniz başarıyla güncellendi" });
  } catch (error) {
    console.error("Security update error:", error);
    return NextResponse.json(
      { error: "Şifre güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
