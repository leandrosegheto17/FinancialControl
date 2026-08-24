/** Postgres bytea hex-input format ("\x..."), as expected by PostgREST for a bytea column. */
export function toPgBytea(bytes: Uint8Array): string {
  return "\\x" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Parses the "\x..." hex string PostgREST returns for a bytea column back into bytes. */
export function fromPgBytea(hex: string): Uint8Array {
  const clean = hex.startsWith("\\x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
