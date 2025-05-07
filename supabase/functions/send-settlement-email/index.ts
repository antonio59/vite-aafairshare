import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const SMTP_HOST = Deno.env.get("SMTP_HOST")!;
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT")!);
const SMTP_USER = Deno.env.get("SMTP_USER")!;
const SMTP_PASS = Deno.env.get("SMTP_PASS")!;
const SMTP_FROM = Deno.env.get("SMTP_FROM")!;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { to, month, users, paid, total, settlement, csvBase64, pdfBase64 } = body;

  if (!to || !month || !users || !paid || !total || !settlement || !csvBase64 || !pdfBase64) {
    return new Response("Missing required fields", { status: 400 });
  }

  // Generate HTML email
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h1 style="color: #222;">AAFairShare</h1>
      <h2>Settlement Report - ${month}</h2>
      <p>Hi ${users.join(" and ")},</p>
      <p>Here's the settlement summary for <b>${month}</b>:</p>
      <div style="background: #fafafa; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <div>Andres Paid: <b>£${Number(paid.andres).toFixed(2)}</b></div>
        <div>Antonio Paid: <b>£${Number(paid.antonio).toFixed(2)}</b></div>
        <div>Total Expenses: <b>£${Number(total).toFixed(2)}</b></div>
      </div>
      <div style="background: #f5f5f5; padding: 12px; border-radius: 6px; margin-bottom: 16px;">
        Settlement: <b>${settlement}</b>
      </div>
      <p>Please find the detailed CSV and PDF reports attached.</p>
      <p>Thanks,<br><b>The AAFairShare Team</b></p>
    </div>
  `;

  // Prepare attachments
  const attachments = [
    {
      filename: `settlement-${month}.csv`,
      content: csvBase64,
      encoding: "base64",
    },
    {
      filename: `settlement-${month}.pdf`,
      content: pdfBase64,
      encoding: "base64",
    },
  ];

  const client = new SmtpClient();

  try {
    await client.connectTLS({
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      username: SMTP_USER,
      password: SMTP_PASS,
    });

    await client.send({
      from: SMTP_FROM,
      to,
      subject: `AAFairShare Settlement Report - ${month}`,
      html,
      attachments,
    });

    await client.close();
    return new Response("Email sent!", { status: 200 });
  } catch (err) {
    console.error("SMTP error:", err);
    return new Response("Failed to send email", { status: 500 });
  }
}); 