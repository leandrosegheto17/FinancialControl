export const rpName = "FinancialControl";
export const rpID = Deno.env.get("WEBAUTHN_RP_ID") ?? "localhost";
export const rpOrigin = Deno.env.get("WEBAUTHN_ORIGIN") ?? "http://localhost:5173";

/** Challenges older than this are rejected, forcing a fresh ceremony. */
export const CHALLENGE_TTL_MS = 2 * 60 * 1000;
