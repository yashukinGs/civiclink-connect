import { createFileRoute } from "@tanstack/react-router";
import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";
import { SNSClient, GetTopicAttributesCommand } from "@aws-sdk/client-sns";

async function checkCognito() {
  const clientId = process.env['COGNITO_CLIENT_ID'];
  const userPoolId = process.env['COGNITO_USER_POOL_ID'];
  const region = process.env['AWS_REGION'];
  if (!clientId || !userPoolId || !region) return { status: "MISSING_CONFIG" };
  const endpoint = `https://cognito-idp.${region}.amazonaws.com/`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSCognitoIdentityProviderService.DescribeUserPoolClient",
    },
    body: JSON.stringify({ UserPoolId: userPoolId, ClientId: clientId }),
  });
  const text = await res.text();
  if (!res.ok) return { status: "ERROR", detail: text };
  return { status: "OK" };
}

export const Route = createFileRoute('/api/public/aws-status')({
  server: {
    handlers: {
      GET: async () => {
        const results: any = {};

        try {
          results.cognito = await checkCognito();
        } catch (e: any) {
          results.cognito = { status: "EXCEPTION", detail: e.message };
        }

        const region = process.env['AWS_DYNAMODB_REGION'] || process.env['AWS_REGION'];
        const credentials = {
          accessKeyId: process.env['AWS_ACCESS_KEY_ID']!,
          secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY']!,
        };

        try {
          const ddb = new DynamoDBClient({ region, credentials });
          await ddb.send(new DescribeTableCommand({ TableName: process.env['AWS_DYNAMODB_ISSUES_TABLE']! }));
          results.dynamodb = { status: "OK" };
        } catch (e: any) {
          results.dynamodb = { status: e.name || "ERROR", detail: e.message };
        }

        try {
          const s3 = new S3Client({ region: process.env['AWS_REGION'], credentials });
          await s3.send(new HeadBucketCommand({ Bucket: process.env['AWS_S3_BUCKET']! }));
          results.s3 = { status: "OK" };
        } catch (e: any) {
          results.s3 = { status: e.name || "ERROR", detail: e.message };
        }

        try {
          const sns = new SNSClient({ region: process.env['AWS_SNS_REGION'] || process.env['AWS_REGION'], credentials });
          await sns.send(new GetTopicAttributesCommand({ TopicArn: process.env['AWS_SNS_TOPIC_ARN']! }));
          results.sns = { status: "OK" };
        } catch (e: any) {
          results.sns = { status: e.name || "ERROR", detail: e.message };
        }

        return Response.json(results);
      }
    }
  }
});
