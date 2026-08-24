import { generateRegistrationOptions, verifyRegistrationResponse } from "npm:@simplewebauthn/server@10";
import type { RegistrationResponseJSON } from "npm:@simplewebauthn/types@10";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { toPgBytea } from "../_shared/bytes.ts";
import { adminClient, getRequestUserId } from "../_shared/supabaseClients.ts";
import { CHALLENGE_TTL_MS, rpID, rpName, rpOrigin } from "../_shared/webauthnConfig.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const userId = await getRequestUserId(req);
  if (!userId) return jsonResponse({ error: "Unauthorized" }, 401);

  const body = await req.json();
  const db = adminClient();

  if (body.step === "options") {
    const { data: profile } = await db.from("profiles").select("full_name").eq("id", userId).single();
    const { data: existingCredentials } = await db
      .from("webauthn_credentials")
      .select("credential_id")
      .eq("user_id", userId);

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new TextEncoder().encode(userId),
      userName: profile?.full_name ?? userId,
      attestationType: "none",
      excludeCredentials: (existingCredentials ?? []).map((c) => ({ id: c.credential_id })),
      authenticatorSelection: { residentKey: "preferred", userVerification: "preferred" },
    });

    await db.from("webauthn_challenges").upsert({ user_id: userId, challenge: options.challenge, created_at: new Date().toISOString() });

    return jsonResponse(options);
  }

  if (body.step === "verify") {
    const { data: challengeRow } = await db
      .from("webauthn_challenges")
      .select("challenge, created_at")
      .eq("user_id", userId)
      .single();

    if (!challengeRow || Date.now() - new Date(challengeRow.created_at).getTime() > CHALLENGE_TTL_MS) {
      return jsonResponse({ error: "Challenge expired, request new options" }, 400);
    }

    const verification = await verifyRegistrationResponse({
      response: body.response as RegistrationResponseJSON,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: rpOrigin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return jsonResponse({ error: "Registration verification failed" }, 400);
    }

    const { credential } = verification.registrationInfo;

    await db.from("webauthn_credentials").insert({
      user_id: userId,
      credential_id: credential.id,
      public_key: toPgBytea(credential.publicKey),
      sign_count: credential.counter,
      device_label: body.deviceLabel ?? null,
    });

    await db.from("webauthn_challenges").delete().eq("user_id", userId);

    return jsonResponse({ verified: true });
  }

  return jsonResponse({ error: "Invalid step, expected 'options' or 'verify'" }, 400);
});
