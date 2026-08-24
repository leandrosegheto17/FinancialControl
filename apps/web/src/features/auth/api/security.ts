import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/types";
import { supabase } from "@/lib/supabase/client";

export async function hasLocalUnlockConfigured(userId: string): Promise<boolean> {
  const [{ data: profile }, { count }] = await Promise.all([
    supabase.from("profiles").select("pin_hash").eq("id", userId).single(),
    supabase.from("webauthn_credentials").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  return Boolean(profile?.pin_hash) || Boolean(count && count > 0);
}

export async function setPin(pin: string): Promise<void> {
  const { error } = await supabase.rpc("set_pin", { p_pin: pin });
  if (error) throw error;
}

export async function verifyPin(pin: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("verify_pin", { p_pin: pin });
  if (error) throw error;
  return Boolean(data);
}

async function callWebauthnFunction(
  fn: "webauthn-register" | "webauthn-authenticate",
  body: Record<string, unknown>
): Promise<unknown> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) throw error;
  return data;
}

export async function registerWebauthnCredential(deviceLabel?: string): Promise<void> {
  const options = await callWebauthnFunction("webauthn-register", { step: "options" });
  const response = await startRegistration(options as PublicKeyCredentialCreationOptionsJSON);
  await callWebauthnFunction("webauthn-register", { step: "verify", response, deviceLabel });
}

export async function authenticateWithWebauthn(): Promise<boolean> {
  const options = await callWebauthnFunction("webauthn-authenticate", { step: "options" });
  const response = await startAuthentication(options as PublicKeyCredentialRequestOptionsJSON);
  const result = (await callWebauthnFunction("webauthn-authenticate", { step: "verify", response })) as {
    verified: boolean;
  };
  return result.verified;
}

export async function listWebauthnCredentials(userId: string) {
  const { data, error } = await supabase
    .from("webauthn_credentials")
    .select("id, device_label, created_at, last_used_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function removeWebauthnCredential(id: string) {
  const { error } = await supabase.from("webauthn_credentials").delete().eq("id", id);
  if (error) throw error;
}
