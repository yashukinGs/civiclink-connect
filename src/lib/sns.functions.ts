import { createServerFn } from "@tanstack/react-start";
import {
  PublishCommand,
  SNSClient,
  SubscribeCommand,
  SetSubscriptionAttributesCommand,
} from "@aws-sdk/client-sns";
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
    if (!topicArn) {
      throw new Error("AWS_SNS_TOPIC_ARN is not configured.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: issue, error: issueErr } = await supabaseAdmin
      .from("issues")
      .select("id, ticket_id, title, status, user_id")
      .eq("id", data.issueId)
      .maybeSingle();
    if (issueErr) throw new Error(issueErr.message);
    if (!issue) throw new Error("Issue not found");

    let reporterEmail: string | null = null;
    if (issue.user_id) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("id", issue.user_id)
        .maybeSingle();
      reporterEmail = profile?.email?.trim() || null;
    }

    const sns = new SNSClient({
      region,
      credentials: { accessKeyId, secretAccessKey },
    });

    const results: {
      channel: string;
      ok: boolean;
      error?: string;
      messageId?: string;
      info?: string;
    }[] = [];

    // 1) Ensure reporter's email is subscribed to the topic with a filter policy
    //    so only their notifications reach them. Subscribe is idempotent —
    //    calling it again returns the existing SubscriptionArn.
    if (reporterEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reporterEmail)) {
      try {
        const sub = await sns.send(
          new SubscribeCommand({
            TopicArn: topicArn,
            Protocol: "email",
            Endpoint: reporterEmail,
            ReturnSubscriptionArn: true,
            Attributes: {
              FilterPolicy: JSON.stringify({ reporterEmail: [reporterEmail] }),
              FilterPolicyScope: "MessageAttributes",
            },
          }),
        );
        const subArn = sub.SubscriptionArn;
        // If already confirmed, ensure the filter policy is up-to-date.
        if (subArn && subArn !== "pending confirmation") {
          try {
            await sns.send(
              new SetSubscriptionAttributesCommand({
                SubscriptionArn: subArn,
                AttributeName: "FilterPolicy",
                AttributeValue: JSON.stringify({ reporterEmail: [reporterEmail] }),
              }),
            );
          } catch {
            // non-fatal
          }
          results.push({ channel: "subscribe", ok: true, info: "confirmed" });
        } else {
          results.push({
            channel: "subscribe",
            ok: true,
            info: "pending_confirmation_email_sent",
          });
        }
      } catch (err) {
        results.push({
          channel: "subscribe",
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // 2) Publish to the topic tagged with reporterEmail — filter policy on the
    //    subscription ensures only that reporter's confirmed inbox receives it.
    const subject = `CivicConnect: Complaint ${issue.ticket_id} status updated`;
    const body = `Hello,\n\nYour complaint "${issue.title}" (${issue.ticket_id}) status has been updated to "${data.status}".\n\nTicket ID: ${issue.ticket_id}\n\n— CivicConnect`;

    try {
      const res = await sns.send(
        new PublishCommand({
          TopicArn: topicArn,
          Subject: subject,
          Message: body,
          MessageAttributes: reporterEmail
            ? {
                reporterEmail: { DataType: "String", StringValue: reporterEmail },
              }
            : undefined,
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

    console.log("[SNS notify]", {
      issueId: data.issueId,
      ticketId: issue.ticket_id,
      status: data.status,
      email: reporterEmail,
      results,
    });
    return { results };
  });
