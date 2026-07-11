import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getDynamoConfig, putIssueItem } from "@/lib/dynamodb.server";

const mirrorInput = z.object({
  ticket_id: z.string().min(1),
  title: z.string(),
  category: z.string(),
  priority: z.string(),
  description: z.string(),
  location: z.string().nullable().optional(),
  status: z.string(),
  is_anonymous: z.boolean().optional(),
  image_url: z.string().nullable().optional(),
  attachments: z.array(z.any()).optional(),
  created_at: z.string(),
});

export const mirrorIssueToDynamo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: z.infer<typeof mirrorInput>) => mirrorInput.parse(input))
  .handler(async ({ data, context }) => {
    const cfg = getDynamoConfig();
    if (!cfg) {
      console.warn("[DynamoDB] not configured, skipping mirror");
      return { ok: false, skipped: true };
    }
    try {
      await putIssueItem(cfg, {
        ticket_id: data.ticket_id,
        user_id: context.userId,
        title: data.title,
        category: data.category,
        priority: data.priority,
        description: data.description,
        location: data.location ?? null,
        status: data.status,
        is_anonymous: data.is_anonymous ?? false,
        image_url: data.image_url ?? null,
        attachments: data.attachments ?? [],
        created_at: data.created_at,
        mirrored_at: new Date().toISOString(),
      });
      return { ok: true };
    } catch (err) {
      const e = err as { name?: string; message?: string };
      console.error("[DynamoDB mirror] failed", { name: e.name, message: e.message });
      return { ok: false, error: e.message ?? "DynamoDB PutItem failed" };
    }
  });
