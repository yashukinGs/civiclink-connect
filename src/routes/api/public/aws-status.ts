import { createFileRoute } from "@tanstack/react-router";
import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";
import { SNSClient, GetTopicAttributesCommand } from "@aws-sdk/client-sns";

async function checkCognito() {
  const clientId = process.env['COGNITO_CLIENT_ID'];
  const region = process.env['AWS_REGION'];
  if (!clientId || !region) return { status: "MISSING_CONFIG" };
  const endpoint = `https://cognito-idp.${region}.amazonaws.com/`;
  // Use an unauthenticated public action so we only verify the app client exists.
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
    },
    body: JSON.stringify({
      AuthFlow: "USER_PASSWORD_AUTH",
      ClientId: clientId,
      AuthParameters: { USERNAME: "test@civicconnect.local", PASSWORD: "TestPass123!" },
    }),
  });
  const text = await res.text();
  // Client exists if Cognito complains about the user, not the client.
  if (text.includes("User pool client") && text.includes("does not exist")) {
    return { status: "CLIENT_NOT_FOUND", detail: text };
  }
  if (text.includes("Incorrect username or password") || text.includes("User does not exist")) {
    return { status: "OK", detail: "App client exists (login would proceed to credential check)" };
  }
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
