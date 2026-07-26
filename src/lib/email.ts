import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy12345678901234567890123456");

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
      from: "eTwin Asistan <noreply@etwinasistan.com>",
      to,
      subject: `${inviterName} invited you to the ${projectName} project!`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Welcome to eTwin Assistant!</h2>
          <p><strong>${inviterName}</strong> has invited you to the <strong>${projectName}</strong> eTwinning project.</p>
          <p>Click the link below to join the project and start collaborating:</p>
          <a href="${inviteLink}" style="display: inline-block; padding: 10px 20px; background-color: #0056b3; color: white; text-decoration: none; border-radius: 5px;">Accept Invitation / Sign In</a>
          <br /><br />
          <p style="font-size: 13px; color: #666;">Note: If you receive a security warning on your phone when clicking the button, you can copy and paste the following link into your browser's address bar:</p>
          <p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-size: 12px; word-break: break-all; color: #333;">${inviteLink}</p>
          <br />
          <p>If you don't have an account yet, you can sign up with this email address.</p>
          <p>Best regards,<br />eTwin Assistant Team</p>
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

export async function sendPasswordResetEmail({
  to,
  resetLink,
}: {
  to: string;
  resetLink: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is not set. Reset email not sent to:", to);
    return { success: true, simulated: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "eTwin Asistan <noreply@etwinasistan.com>",
      to,
      subject: "Password Reset Request - eTwin Assistant",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>Hello,</p>
          <p>We received a password reset request for your eTwin Assistant account. You can set a new password by clicking the button below.</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #0056b3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset My Password</a>
          <br /><br />
          <p style="font-size: 13px; color: #666;">Note: If you receive a security warning on your phone when clicking the button, you can copy and paste the following link into your browser's address bar:</p>
          <p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-size: 12px; word-break: break-all; color: #333;">${resetLink}</p>
          <br />
          <p>If you did not request this, you can ignore this email. Your password will not be changed.</p>
          <p>This link is valid for 1 hour.</p>
          <p>Best regards,<br />eTwin Assistant Team</p>
        </div>
      `,
    });

    if (error) {
      console.error("Error sending reset email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Exception in sendPasswordResetEmail:", error);
    return { success: false, error };
  }
}
