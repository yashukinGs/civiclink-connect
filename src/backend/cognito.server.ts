// Server-only Cognito helpers. Uses AWS Cognito Identity Provider JSON API
// (cognito-idp) via plain fetch. The auth-flow actions used here
// (SignUp, ConfirmSignUp, InitiateAuth, ForgotPassword, ConfirmForgotPassword,
// ResendConfirmationCode) do NOT require SigV4 signing — they authenticate
// via the App Client ID configured in your Cognito User Pool.
//
// Required env vars (set via secrets):
//   AWS_REGION              e.g. "ap-south-1"
//   COGNITO_USER_POOL_ID    e.g. "ap-south-1_abcDEF123"
//   COGNITO_CLIENT_ID       App client ID (without a client secret)
//
// NOTE: Create the App Client with "Generate client secret" DISABLED.
// Otherwise every call also needs a SECRET_HASH (HMAC-SHA256).

export interface CognitoRuntimeConfig {
  region: string;
  clientId: string;
}

export function getCognitoConfig(): CognitoRuntimeConfig {
  const region = process.env.AWS_REGION;
  const clientId = process.env.COGNITO_CLIENT_ID;
  if (!region || !clientId) {
    throw new Error(
      "Cognito is not configured. Set AWS_REGION and COGNITO_CLIENT_ID secrets.",
    );
  }
  return { region, clientId };
}

interface CognitoErrorPayload {
  __type?: string;
  message?: string;
  Message?: string;
}

async function cognitoCall<TResponse>(
  config: CognitoRuntimeConfig,
  action: string,
  body: Record<string, unknown>,
): Promise<TResponse> {
  const endpoint = `https://cognito-idp.${config.region}.amazonaws.com/`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }
  }

  if (!res.ok) {
    const err = (parsed ?? {}) as CognitoErrorPayload;
    const msg =
      err.message || err.Message || err.__type || `Cognito ${action} failed`;
    throw new Error(msg);
  }

  return (parsed ?? {}) as TResponse;
}

export interface SignUpResult {
  UserSub: string;
  UserConfirmed: boolean;
  CodeDeliveryDetails?: {
    Destination?: string;
    DeliveryMedium?: string;
    AttributeName?: string;
  };
}

export function cognitoSignUp(
  config: CognitoRuntimeConfig,
  args: { email: string; password: string; name?: string },
): Promise<SignUpResult> {
  const attributes: Array<{ Name: string; Value: string }> = [
    { Name: "email", Value: args.email },
  ];
  if (args.name) attributes.push({ Name: "name", Value: args.name });

  return cognitoCall<SignUpResult>(config, "SignUp", {
    ClientId: config.clientId,
    Username: args.email,
    Password: args.password,
    UserAttributes: attributes,
  });
}

export function cognitoConfirmSignUp(
  config: CognitoRuntimeConfig,
  args: { email: string; code: string },
): Promise<Record<string, never>> {
  return cognitoCall(config, "ConfirmSignUp", {
    ClientId: config.clientId,
    Username: args.email,
    ConfirmationCode: args.code,
  });
}

export function cognitoResendCode(
  config: CognitoRuntimeConfig,
  args: { email: string },
): Promise<Record<string, unknown>> {
  return cognitoCall(config, "ResendConfirmationCode", {
    ClientId: config.clientId,
    Username: args.email,
  });
}

export interface InitiateAuthResult {
  AuthenticationResult?: {
    AccessToken: string;
    ExpiresIn: number;
    TokenType: string;
    RefreshToken: string;
    IdToken: string;
  };
  ChallengeName?: string;
  Session?: string;
}

export function cognitoSignIn(
  config: CognitoRuntimeConfig,
  args: { email: string; password: string },
): Promise<InitiateAuthResult> {
  return cognitoCall<InitiateAuthResult>(config, "InitiateAuth", {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: config.clientId,
    AuthParameters: {
      USERNAME: args.email,
      PASSWORD: args.password,
    },
  });
}

export function cognitoForgotPassword(
  config: CognitoRuntimeConfig,
  args: { email: string },
): Promise<Record<string, unknown>> {
  return cognitoCall(config, "ForgotPassword", {
    ClientId: config.clientId,
    Username: args.email,
  });
}

export function cognitoConfirmForgotPassword(
  config: CognitoRuntimeConfig,
  args: { email: string; code: string; newPassword: string },
): Promise<Record<string, never>> {
  return cognitoCall(config, "ConfirmForgotPassword", {
    ClientId: config.clientId,
    Username: args.email,
    ConfirmationCode: args.code,
    Password: args.newPassword,
  });
}
