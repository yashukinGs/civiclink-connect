import { createServerFn } from "@tanstack/react-start";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  issueId: z.string().uuid(),
  status: z.string().min(1),
});

export const notifyIssueStatusChanged = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => inputSchema.parse(input))
  .handler(async ({ data }) => {
    const region = process.env.AWS_SNS_REGION || process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const topicArn = process.env.AWS_SNS_TOPIC_ARN;

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error("AWS credentials for SNS are not configured.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: issue, error: issueErr } = await supabaseAdmin
      .from("issues")
      .select("id, ticket_id, title, status, user_id")
      .eq("id", data.issueId)
      .maybeSingle();
    if (issueErr) throw new Error(issueErr.message);
    if (!issue) throw new Error("Issue not found");

    let reporterPhone: string | null = null;
    if (issue.user_id) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("mobile")
        .eq("id", issue.user_id)
        .maybeSingle();
      reporterPhone = profile?.mobile ?? null;
    }

    const sns = new SNSClient({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    const smsBody = `CivicConnect: Your complaint ${issue.ticket_id} status is now "${data.status}". - ${issue.title}`;

    const results: { channel: string; ok: boolean; error?: string; messageId?: string }[] = [];

    // Direct SMS to reporter's phone (if E.164)
    if (reporterPhone) {
      const phone = normalizePhone(reporterPhone);
      if (phone) {
        try {
          const res = await sns.send(
            new PublishCommand({
              PhoneNumber: phone,
              Message: smsBody,
              MessageAttributes: {
                "AWS.SNS.SMS.SMSType": {
                  DataType: "String",
                  StringValue: "Transactional",
                },
              },
            }),
          );
          results.push({ channel: "sms", ok: true, messageId: res.MessageId });
        } catch (err) {
          results.push({
            channel: "sms",
            ok: false,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      } else {
        results.push({ channel: "sms", ok: false, error: "Invalid phone format" });
      }
    }

    // Also publish to topic so subscribed admins/officers receive it
    if (topicArn) {
      try {
        const res = await sns.send(
          new PublishCommand({
            TopicArn: topicArn,
            Subject: `Complaint ${issue.ticket_id} → ${data.status}`,
            Message: smsBody,
          }),
        );
        results.push({ channel: "topic", ok: true, messageId: res.MessageId });
      } catch (err) {
        results.push({
          channel: "topic",
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return { results };
  });

function normalizePhone(raw: string): string | null {
  const trimmed = raw.trim().replace(/[\s-]/g, "");
  if (/^\+\d{8,15}$/.test(trimmed)) return trimmed;
  // If it's a 10-digit Indian mobile, default to +91
  if (/^\d{10}$/.test(trimmed)) return `+91${trimmed}`;
  return null;
}
