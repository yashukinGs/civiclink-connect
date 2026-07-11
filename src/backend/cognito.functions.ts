import { createServerFn } from "@tanstack/react-start";
import {
  cognitoConfirmForgotPassword,
  cognitoConfirmSignUp,
  cognitoForgotPassword,
  cognitoResendCode,
  cognitoSignIn,
  cognitoSignUp,
  getCognitoConfig,
} from "@/backend/cognito.server";

// Cognito demo endpoints (public — no requireSupabaseAuth middleware).
// This is a college-project demo showing AWS Cognito auth flow. The main
// app auth is still Lovable Cloud; this is an isolated demo route.

export const cognitoSignUpFn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; password: string; name?: string }) => input)
  .handler(async ({ data }) => {
    const config = getCognitoConfig();
    const result = await cognitoSignUp(config, data);
    return {
      userSub: result.UserSub,
      confirmed: result.UserConfirmed,
      destination: result.CodeDeliveryDetails?.Destination,
    };
  });

export const cognitoConfirmSignUpFn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; code: string }) => input)
  .handler(async ({ data }) => {
    const config = getCognitoConfig();
    await cognitoConfirmSignUp(config, data);
    return { ok: true };
  });

export const cognitoResendCodeFn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => input)
  .handler(async ({ data }) => {
    const config = getCognitoConfig();
    await cognitoResendCode(config, data);
    return { ok: true };
  });

export const cognitoSignInFn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; password: string }) => input)
  .handler(async ({ data }) => {
    const config = getCognitoConfig();
    const result = await cognitoSignIn(config, data);
    const auth = result.AuthenticationResult;
    if (!auth) {
      throw new Error(
        result.ChallengeName
          ? `Additional challenge required: ${result.ChallengeName}`
          : "Sign-in did not return tokens",
      );
    }
    return {
      accessToken: auth.AccessToken,
      idToken: auth.IdToken,
      refreshToken: auth.RefreshToken,
      expiresIn: auth.ExpiresIn,
      tokenType: auth.TokenType,
    };
  });

export const cognitoForgotPasswordFn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => input)
  .handler(async ({ data }) => {
    const config = getCognitoConfig();
    await cognitoForgotPassword(config, data);
    return { ok: true };
  });

export const cognitoConfirmForgotPasswordFn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; code: string; newPassword: string }) => input)
  .handler(async ({ data }) => {
    const config = getCognitoConfig();
    await cognitoConfirmForgotPassword(config, data);
    return { ok: true };
  });
