/** Real browser cryptography. Requires localhost or HTTPS; no simulated fallback. */

const enc = new TextEncoder();
const dec = new TextDecoder();

export const subtleAvailable = typeof globalThis.crypto?.subtle !== "undefined";

export type Bytes = Uint8Array<ArrayBuffer>;

export function toHex(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, "0");
  return out;
}

export function toB64(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function hexToBytes(hex: string): Bytes {
  const clean = hex.replace(/[^0-9a-f]/gi, "");
  const out = new Uint8Array(new ArrayBuffer(clean.length / 2));
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
}

export function randomBytes(n: number): Bytes {
  const b = new Uint8Array(new ArrayBuffer(n));
  requireCrypto();
  crypto.getRandomValues(b);
  return b;
}

function requireCrypto(): void {
  if (!globalThis.crypto?.subtle) throw new Error("Real cryptography requires localhost or HTTPS.");
}

const nextId = () => toHex(randomBytes(12));

/* -------------------------------- hashing -------------------------------- */

export type HashAlgo = "SHA-1" | "SHA-256" | "SHA-512";

export async function digestHex(algo: HashAlgo, text: string): Promise<string> {
  requireCrypto();
  return toHex(await crypto.subtle.digest(algo, enc.encode(text)));
}

export function bitDifference(a: string, b: string): { bits: number; total: number; percent: number } {
  const len = Math.min(a.length, b.length);
  let bits = 0;
  for (let i = 0; i < len; i++) {
    const x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
    bits += ((x >> 3) & 1) + ((x >> 2) & 1) + ((x >> 1) & 1) + (x & 1);
  }
  const total = len * 4;
  return { bits, total, percent: total ? (bits / total) * 100 : 0 };
}

/* ------------------------------ symmetric AES ----------------------------- */

export interface AesResult {
  keyHex: string;
  saltHex: string;
  ivHex: string;
  cipherHex: string;
  ms: number;
}

async function deriveAesBits(passphrase: string, salt: Bytes): Promise<ArrayBuffer> {
  const base = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 60000, hash: "SHA-256" }, base, 256);
}

export async function aesEncrypt(message: string, passphrase: string, fixed?: { salt: Bytes; iv: Bytes }): Promise<AesResult> {
  const t0 = performance.now();
  const salt = fixed?.salt ?? randomBytes(16);
  const iv = fixed?.iv ?? randomBytes(12);


  const bits = await deriveAesBits(passphrase, salt);
  const key = await crypto.subtle.importKey("raw", bits, "AES-GCM", false, ["encrypt", "decrypt"]);
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(message));
  return { keyHex: toHex(bits), saltHex: toHex(salt), ivHex: toHex(iv), cipherHex: toHex(ct), ms: Math.round(performance.now() - t0) };
}

/** Returns the plaintext, or null when the authentication tag does not match. */
export async function aesDecrypt(cipherHex: string, passphrase: string, saltHex: string, ivHex: string): Promise<string | null> {
  try {
    const bits = await deriveAesBits(passphrase, hexToBytes(saltHex));
    const key = await crypto.subtle.importKey("raw", bits, "AES-GCM", false, ["encrypt", "decrypt"]);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: hexToBytes(ivHex) }, key, hexToBytes(cipherHex));
    return dec.decode(pt);
  } catch {
    return null;
  }
}

/* ------------------------------ asymmetric RSA ---------------------------- */

export interface RsaBundle {
  pair: CryptoKeyPair;
  id: string;
  spkiB64: string;
  pkcs8Len: number;
  modulusBits: number;
  fingerprint: string;
  keygenMs: number;
}

export async function generateRsa(): Promise<RsaBundle> {
  const t0 = performance.now();
  const id = nextId();

  const pair = await crypto.subtle.generateKey(
    { name: "RSA-OAEP", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["encrypt", "decrypt"],
  );
  const spki = await crypto.subtle.exportKey("spki", pair.publicKey);
  const pkcs8 = await crypto.subtle.exportKey("pkcs8", pair.privateKey);
  const fp = await crypto.subtle.digest("SHA-256", spki);
  return {
    pair, id,
    spkiB64: toB64(spki),
    pkcs8Len: pkcs8.byteLength,
    modulusBits: 2048,
    fingerprint: toHex(fp),
    keygenMs: Math.round(performance.now() - t0),
  };
}

export async function rsaEncrypt(bundle: RsaBundle, message: string): Promise<string> {
  if (enc.encode(message).length > 190) throw new Error("RSA-OAEP demo accepts at most 190 UTF-8 bytes.");

  return toHex(await crypto.subtle.encrypt({ name: "RSA-OAEP" }, bundle.pair.publicKey, enc.encode(message)));
}

export async function rsaDecrypt(bundle: RsaBundle, cipherHex: string): Promise<string | null> {
  try {
    const pt = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, bundle.pair.privateKey, hexToBytes(cipherHex));
    return dec.decode(pt);
  } catch {
    return null;
  }
}

/* ------------------------------ ECDSA signing ----------------------------- */

export interface EcBundle {
  pair: CryptoKeyPair;
  id: string;
  pubB64: string;
  fingerprint: string;
  curve: string;
  keygenMs: number;
}

export async function generateEcdsa(): Promise<EcBundle> {
  const t0 = performance.now();
  const id = nextId();

  const pair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const spki = await crypto.subtle.exportKey("spki", pair.publicKey);
  return { pair, id, pubB64: toB64(spki), fingerprint: toHex(await crypto.subtle.digest("SHA-256", spki)), curve: "P-256", keygenMs: Math.round(performance.now() - t0) };
}

export async function ecdsaSign(bundle: EcBundle, message: string): Promise<{ hex: string; r: string; s: string; ms: number }> {
  const t0 = performance.now();
  requireCrypto();
  const hex = toHex(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, bundle.pair.privateKey, enc.encode(message)));
  return { hex, r: hex.slice(0, 64), s: hex.slice(64), ms: Math.max(1, Math.round(performance.now() - t0)) };
}

export async function ecdsaVerify(bundle: EcBundle, sigHex: string, message: string): Promise<boolean> {
  requireCrypto();
  try {
    return await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, bundle.pair.publicKey, hexToBytes(sigHex), enc.encode(message));
  } catch {
    return false;
  }
}

/* ------------------------------- certificates ----------------------------- */

export interface CertRecord {
  subject: string;
  issuer: string;
  notBefore: string;
  notAfter: string;
  serial: string;
  keyFingerprint: string;
}

/** Teaching model only. Real X.509 signs the DER-encoded TBSCertificate. */
export function tbsBytes(rec: CertRecord): string {
  return JSON.stringify({ subject: rec.subject, issuer: rec.issuer, notBefore: rec.notBefore, notAfter: rec.notAfter, serial: rec.serial, keyFingerprint: rec.keyFingerprint });
}

/** Simplified DNS name matching, including one leftmost wildcard label. */
export function hostMatches(certName: string, host: string): boolean {
  const c = certName.trim().toLowerCase();
  const h = host.trim().toLowerCase();
  if (!c || !h) return false;
  if (c === h) return true;
  if (c.startsWith("*.")) {
    const suffix = c.slice(1);
    if (!h.endsWith(suffix)) return false;
    const left = h.slice(0, h.length - suffix.length);
    return left.length > 0 && !left.includes(".");
  }
  return false;
}

/** Measures one AES operation and one RSA private key operation in this browser. */
export async function benchmark(rsa: RsaBundle, cipherHex: string): Promise<{ aes: number; rsa: number }> {
  requireCrypto();
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt"]);
  const iv = randomBytes(12);
  const payload = randomBytes(32);
  const a0 = performance.now();
  for (let i = 0; i < 200; i++) {
    new DataView(iv.buffer).setUint32(8, i);
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, payload);
  }
  const aes = Math.round(((performance.now() - a0) / 200) * 1000) / 1000;
  const r0 = performance.now();
  for (let i = 0; i < 20; i++) await rsaDecrypt(rsa, cipherHex);
  const rsaMs = Math.round(((performance.now() - r0) / 20) * 1000) / 1000;
  return { aes: Math.max(aes, 0.001), rsa: Math.max(rsaMs, 0.001) };
}

/** Times a SHA-256 digest over one megabyte. */
export async function hashSpeed(): Promise<number> {
  const big = new Uint8Array(new ArrayBuffer(1024 * 1024));
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    for (let o = 0; o < big.length; o += 65536) crypto.getRandomValues(big.subarray(o, Math.min(o + 65536, big.length)));
  }
  const t0 = performance.now();
  requireCrypto();
  await crypto.subtle.digest("SHA-256", big);
  return Math.round((performance.now() - t0) * 100) / 100;
}
