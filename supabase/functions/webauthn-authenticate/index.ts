import { generateAuthenticationOptions, verifyAuthenticationResponse } from "npm:@simplewebauthn/server@10";
import type { AuthenticationResponseJSON } from "npm:@simplewebauthn/types@10";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { fromPgBytea } from "../_shared/bytes.ts";
import { adminClient, getRequestUserId } from "../_shared/supabaseClients.ts";
import { CHALLENGE_TTL_MS, rpID, rpOrigin } from "../_shared/webauthnConfig.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const userId = await getRequestUserId(req);
  if (!userId) return jsonResponse({ error: "Unauthorized" }, 401);

  const body = await req.json();
  const db = adminClient();

  if (body.step === "options") {
    const { data: credentials } = await db
      .from("webauthn_credentials")
      .select("credential_id")
      .eq("user_id", userId);

    if (!credentials || credentials.length === 0) {
      return jsonResponse({ error: "No WebAuthn credential registered for this user" }, 400);
    }

    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: "preferred",
      allowCredentials: credentials.map((c) => ({ id: c.credential_id })),
    });

    await db.from("webauthn_challenges").upsert({ user_id: userId, challenge: options.challenge, created_at: new Date().toISOString() });

    return jsonResponse(options);
  }

  if (body.step === "verify") {
    const response = body.response as AuthenticationResponseJSON;

    const { data: challengeRow } = await db
      .from("webauthn_challenges")
      .select("challenge, created_at")
      .eq("user_id", userId)
      .single();

    if (!challengeRow || Date.now() - new Date(challengeRow.created_at).getTime() > CHALLENGE_TTL_MS) {
      return jsonResponse({ error: "Challenge expired, request new options" }, 400);
    }

    const { data: credentialRow } = await db
      .from("webauthn_credentials")
      .select("id, credential_id, public_key, sign_count")
      .eq("user_id", userId)
      .eq("credential_id", response.id)
      .single();

    if (!credentialRow) return jsonResponse({ error: "Unknown credential" }, 400);

    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: rpOrigin,
      expectedRPID: rpID,
      credential: {
        id: credentialRow.credential_id,
        publicKey: fromPgBytea(credentialRow.public_key),
        counter: credentialRow.sign_count,
      },
    });

    if (!verification.verified) {
      return jsonResponse({ error: "Authentication verification failed" }, 400);
    }

    await db
      .from("webauthn_credentials")
      .update({
        sign_count: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", credentialRow.id);

    await db.from("webauthn_challenges").delete().eq("user_id", userId);

    return jsonResponse({ verified: true });
  }

  return jsonResponse({ error: "Invalid step, expected 'options' or 'verify'" }, 400);
});
