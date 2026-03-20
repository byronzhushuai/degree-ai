import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendReportEmail({
  toEmail,
  reportId,
  userName,
}: {
  toEmail: string;
  reportId: string;
  userName?: string;
}) {
  const reportUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/report/${reportId}`;

  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: toEmail,
    subject: 'Your Degree Analysis Report is Ready 🎓',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #1a1a1a;">Your Report is Ready</h2>
        <p style="color: #555;">Hi ${userName || 'there'},</p>
        <p style="color: #555;">Thank you for using Degree AI. Your personalized degree analysis report is ready. Click the button below to view your full results:</p>
        <a href="${reportUrl}"
           style="display: inline-block; margin: 24px 0; padding: 14px 28px;
                  background: #2563eb; color: white; text-decoration: none;
                  border-radius: 8px; font-weight: 600;">
          View My Report
        </a>
        <p style="color: #999; font-size: 13px;">Or copy this link: ${reportUrl}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="color: #bbb; font-size: 12px;">Degree AI · degree-ai.vercel.app</p>
      </div>
    `,
  });
}
