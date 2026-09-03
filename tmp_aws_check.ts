import { DynamoDBClient, DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";
import { SNSClient, GetTopicAttributesCommand } from "@aws-sdk/client-sns";

const region = process.env['AWS_REGION'] || "ap-south-1";
const credentials = {
  accessKeyId: process.env['AWS_ACCESS_KEY_ID']!,
  secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY']!,
};

async function checkCognito() {
  const clientId = process.env['COGNITO_CLIENT_ID'];
  const userPoolId = process.env['COGNITO_USER_POOL_ID'];
  if (!clientId || !userPoolId) return "MISSING_CONFIG";
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
  if (!res.ok) return `ERROR: ${text}`;
  return "OK";
}

async function check() {
  const results: any = {};

  try {
    results.cognito = await checkCognito();
  } catch (e: any) {
    results.cognito = "EXCEPTION: " + e.message;
  }

  try {
    const ddb = new DynamoDBClient({ region, credentials });
    await ddb.send(new DescribeTableCommand({ TableName: process.env['DYNAMODB_TABLE_NAME']! }));
    results.dynamodb = "OK";
  } catch (e: any) {
    results.dynamodb = e.name + ": " + e.message;
  }

  try {
    const s3 = new S3Client({ region, credentials });
    await s3.send(new HeadBucketCommand({ Bucket: process.env['S3_BUCKET_NAME']! }));
    results.s3 = "OK";
  } catch (e: any) {
    results.s3 = e.name + ": " + e.message;
  }

  try {
    const sns = new SNSClient({ region, credentials });
    await sns.send(new GetTopicAttributesCommand({ TopicArn: process.env['SNS_TOPIC_ARN']! }));
    results.sns = "OK";
  } catch (e: any) {
    results.sns = e.name + ": " + e.message;
  }

  console.log(JSON.stringify(results, null, 2));
}

check();
