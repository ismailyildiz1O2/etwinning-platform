import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "dummy-key");

export async function sendInviteEmail({
  to,
  projectName,
  inviterName,
  inviteLink,
}: {
  to: string;
  projectName: string;
  inviterName: string;
  inviteLink: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set. Email not sent to:", to);
    return { success: true, simulated: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "eTwin Asistan <onboarding@resend.dev>",
      to,
      subject: `${inviterName} sizi ${projectName} projesine davet etti!`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>eTwin Asistan'a Hoş Geldiniz!</h2>
          <p><strong>${inviterName}</strong> adlı kullanıcı sizi <strong>${projectName}</strong> adlı eTwinning projesine davet etti.</p>
          <p>Projeye katılmak ve ortak çalışmaya başlamak için aşağıdaki bağlantıya tıklayın:</p>
          <a href="${inviteLink}" style="display: inline-block; padding: 10px 20px; background-color: #0056b3; color: white; text-decoration: none; border-radius: 5px;">Daveti Kabul Et / Giriş Yap</a>
          <br /><br />
          <p>Eğer henüz bir hesabınız yoksa, aynı e-posta adresiyle kayıt olabilirsiniz.</p>
          <p>İyi çalışmalar,<br />eTwin Asistan Ekibi</p>
        </div>
      `,
    });

    if (error) {
      console.error("Error sending invite email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Exception in sendInviteEmail:", error);
    return { success: false, error };
  }
}
