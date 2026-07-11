import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

export interface DynamoRuntimeConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  table: string;
}

export function getDynamoConfig(): DynamoRuntimeConfig | null {
  const region = process.env.AWS_DYNAMODB_REGION || process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const table = process.env.AWS_DYNAMODB_ISSUES_TABLE;
  if (!region || !accessKeyId || !secretAccessKey || !table) return null;
  return { region, accessKeyId, secretAccessKey, table };
}

function createClient(cfg: DynamoRuntimeConfig) {
  return new DynamoDBClient({
    region: cfg.region,
    credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
  });
}

export async function putIssueItem(cfg: DynamoRuntimeConfig, item: Record<string, unknown>) {
  const client = createClient(cfg);
  await client.send(
    new PutItemCommand({
      TableName: cfg.table,
      Item: marshall(item, { removeUndefinedValues: true, convertClassInstanceToMap: true }),
    }),
  );
}
