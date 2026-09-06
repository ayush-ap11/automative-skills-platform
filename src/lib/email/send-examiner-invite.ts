import "server-only";
import { BrevoClient } from "@getbrevo/brevo";

export interface SendExaminerInviteParams {
  toEmail: string;
  toName: string;
  tempPassword: string;
  orgName: string;
}

export interface SendExaminerInviteResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendExaminerInviteEmail({
  toEmail,
  toName,
  tempPassword,
  orgName,
}: SendExaminerInviteParams): Promise<SendExaminerInviteResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "AutoSkills Platform";
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ).replace(/\/$/, "");
  const loginUrl = `${appUrl}/login`;

  if (!apiKey || !senderEmail) {
    return {
      success: false,
      error:
        "Brevo configuration is incomplete (missing BREVO_API_KEY or BREVO_SENDER_EMAIL).",
    };
  }

  const client = new BrevoClient({
    apiKey,
  });

  const safeName = escapeHtml(toName);
  const safeOrg = escapeHtml(orgName);
  const safeEmail = escapeHtml(toEmail);
  const safePassword = escapeHtml(tempPassword);

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Examiner Account is Ready</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #0f172a; margin-top: 0;">Welcome, ${safeName}</h2>
  <p>You have been invited as an Assessment Examiner for <strong>${safeOrg}</strong> on the Automotive Skills Assessment & Candidate Readiness Platform.</p>
  
  <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
    <p style="margin: 0 0 10px 0; font-weight: 600; color: #334155;">Your Account Credentials:</p>
    <p style="margin: 4px 0;"><strong>Email:</strong> ${safeEmail}</p>
    <p style="margin: 4px 0;"><strong>Temporary Password:</strong> <code style="font-family: monospace; background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: 700; color: #0f172a;">${safePassword}</code></p>
  </div>

  <p style="margin: 24px 0;">
    <a href="${loginUrl}" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px;">
      Log In to Your Examiner Account
    </a>
  </p>
  <p style="font-size: 13px; color: #64748b;">Or log in at: <a href="${loginUrl}" style="color: #0284c7; text-decoration: underline;">${loginUrl}</a></p>

  <p style="color: #92400e; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 6px; padding: 12px; font-size: 13px; margin-top: 24px;">
    <strong>Security Notice:</strong> Please change your password immediately after logging in for security.
  </p>

  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
  <p style="font-size: 12px; color: #94a3b8; margin: 0;">
    Automotive Skills Assessment Platform &bull; Australian Automotive Industry
  </p>
</body>
</html>`;

  const textContent = `Welcome, ${toName}

You have been invited as an Assessment Examiner for ${orgName} on the Automotive Skills Assessment & Candidate Readiness Platform.

Your Account Credentials:
Email: ${toEmail}
Temporary Password: ${tempPassword}

Log in at: ${loginUrl}

Security Notice: Please change your password immediately after logging in for security.
`;

  try {
    const response = await client.transactionalEmails.sendTransacEmail({
      subject: "Your Examiner Account is Ready",
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [
        {
          name: toName,
          email: toEmail,
        },
      ],
      htmlContent,
      textContent,
    });

    return {
      success: true,
      messageId: response?.messageId || "sent",
    };
  } catch (err: any) {
    const message =
      err?.message || err?.body?.message || "Unknown error sending Brevo email";
    return {
      success: false,
      error: message,
    };
  }
}
