import type { Lesson } from './curriculum';

export interface Practice {
  idea: string;
  terms: [string, string][];
  experiment: string[];
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
  input: string;
  code: string;
  caution: string;
  sources: { label: string; url: string }[];
}

export const PRACTICE: Record<Lesson['id'], Practice> = {
  symmetric: {
    idea: 'Two sides share one secret key. AES-GCM hides the message and adds a tag that detects changes. The IV is public, but must never repeat with the same key.',
    terms: [['Key', 'The secret used to encrypt and decrypt.'], ['IV', 'A fresh value for each encryption under one key.'], ['Tag', 'Evidence that the encrypted data has not changed.']],
    experiment: ['Open scene 04 and copy the passphrase into Eliot\'s guess.', 'Predict whether he can read the message, then try it.', 'Change one letter in his guess. Explain why decryption fails.'],
    question: 'You encrypt two different messages with the same AES-GCM key. What must you change?',
    choices: ['Use a fresh IV for each message', 'Keep the IV the same', 'Send the secret key with each message'],
    answer: 0,
    explanation: 'Repeating a key and IV pair breaks GCM security. Send the IV with the ciphertext, but keep the key secret.',
    input: 'Sensor reading: 24 C',
    code: `const bytes = new TextEncoder().encode(input);
const key = await crypto.subtle.generateKey(
  { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
);
const iv = crypto.getRandomValues(new Uint8Array(12));
const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes);
const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
const changed = new Uint8Array(ciphertext.slice(0));
changed[0] ^= 1;
let tamperingRejected = false;
try {
  await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, changed);
} catch { tamperingRejected = true; }
return {
  encryptedBytes: ciphertext.byteLength,
  recovered: new TextDecoder().decode(plaintext), tamperingRejected
};`,
    caution: 'This example generates a random key. The animation uses PBKDF2 to turn a passphrase into a key. A short password is still easy to guess. Never use visible demo keys for real data.',
    sources: [{ label: 'Web Crypto: AES-GCM', url: 'https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt' }],
  },
  asymmetric: {
    idea: 'RSA-OAEP encrypts small messages with a public key. Only the matching private key decrypts them. Key agreement, such as Diffie-Hellman, is a different operation: both sides derive a shared secret.',
    terms: [['Public key', 'Safe to share, but check its owner.'], ['Private key', 'Kept secret by the receiver.'], ['Hybrid encryption', 'Symmetric encryption for data, public key tools for the key.']],
    experiment: ['Open scene 05 and try the receiver\'s private key.', 'Switch to the attacker\'s private key and compare the result.', 'Explain how a fake public key would change the story.'],
    question: 'Eliot replaces Emma\'s public key with his own. Aida encrypts to that key. Who can decrypt?',
    choices: ['Emma, because her name is on the key', 'Eliot, with the matching private key', 'Anyone with the public key'],
    answer: 1,
    explanation: 'Correct encryption can protect a message for the wrong person. Authenticate the public key.',
    input: 'A small secret',
    code: `const bytes = new TextEncoder().encode(input);
// Maximum for 2048-bit RSA-OAEP with SHA-256: 190 bytes.
if (bytes.length > 190) throw new Error("Use at most 190 UTF-8 bytes.");
const pair = await crypto.subtle.generateKey({
  name: "RSA-OAEP", modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256"
}, false, ["encrypt", "decrypt"]);
const ciphertext = await crypto.subtle.encrypt({ name: "RSA-OAEP" }, pair.publicKey, bytes);
const plaintext = await crypto.subtle.decrypt({ name: "RSA-OAEP" }, pair.privateKey, ciphertext);
return {
  inputBytes: bytes.length, encryptedBytes: ciphertext.byteLength,
  recovered: new TextDecoder().decode(plaintext)
};`,
    caution: 'This is RSA encryption, not a TLS handshake. Modern TLS uses key agreement and a separate signature for server authentication. RSA has a strict byte limit.',
    sources: [{ label: 'RSA-OAEP standard', url: 'https://www.rfc-editor.org/rfc/rfc8017.html#section-7.1' }],
  },
  hashing: {
    idea: 'A hash turns data into a fixed-size digest. SHA-256 produces 256 bits. A hash has no secret key and cannot tell you who made it. Get your reference digest from a trusted source.',
    terms: [['Digest', 'The output of a hash function.'], ['Collision', 'Different inputs with the same digest.'], ['Avalanche effect', 'A small change usually changes about half the output bits.']],
    experiment: ['Open scene 04 and put the same text in A and B.', 'Predict the result, then change one letter in B.', 'Read the bit difference. Must it be exactly 50 percent?'],
    question: 'A download and its hash both come from an attacker. Does a matching digest prove the file is safe?',
    choices: ['Yes, SHA-256 proves safety', 'No, the attacker can replace both', 'Yes, hashing hides the file'],
    answer: 1,
    explanation: 'A match with an attacker\'s digest tells you nothing about trust. Use a trusted digest or verify a signature.',
    input: 'Firmware version 1.0',
    code: `const encode = text => new TextEncoder().encode(text);
const hex = bytes => Array.from(new Uint8Array(bytes))
  .map(b => b.toString(16).padStart(2, "0")).join("");
const original = await crypto.subtle.digest("SHA-256", encode(input));
const edited = await crypto.subtle.digest("SHA-256", encode(input + "!"));
return {
  original: hex(original), edited: hex(edited),
  same: hex(original) === hex(edited), outputBits: 256
};`,
    caution: 'Plain SHA-256 alone is not suitable for password storage. Use a password hashing scheme, salt and suitable cost. SHA-1 appears only for comparison; do not choose it for collision resistance.',
    sources: [{ label: 'Web Crypto: digest', url: 'https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest' }],
  },
  signature: {
    idea: 'A signature binds a message to a private key. ECDSA signs; it does not encrypt. Anyone with the matching public key can verify. You still need to connect that public key to a person or device you trust.',
    terms: [['Sign', 'Create a signature with the private key.'], ['Verify', 'Check the message, signature and public key.'], ['Authenticity', 'Evidence about the source, based on trust in the key.']],
    experiment: ['Open scene 04 and verify the original document.', 'Let Eliot edit it and check the result.', 'Open scene 06 and switch Emma\'s public key. Why can the attacker\'s signature now pass?'],
    question: 'A signature verifies. What can you conclude before checking who owns the public key?',
    choices: ['The message is secret', 'Aida must be the author', 'The signature fits this message and public key'],
    answer: 2,
    explanation: 'Verification checks against a key. Identity requires trust in its owner. Signatures do not hide the message.',
    input: 'Install firmware version 1.0',
    code: `const bytes = new TextEncoder().encode(input);
const pair = await crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" }, false, ["sign", "verify"]
);
const algorithm = { name: "ECDSA", hash: "SHA-256" };
const signature = await crypto.subtle.sign(algorithm, pair.privateKey, bytes);
const valid = await crypto.subtle.verify(algorithm, pair.publicKey, signature, bytes);
const edited = new TextEncoder().encode(input + " [changed]");
const validAfterEdit = await crypto.subtle.verify(algorithm, pair.publicKey, signature, edited);
return { signatureBytes: signature.byteLength, valid, validAfterEdit };`,
    caution: 'Keep signing keys private and separate from encryption keys. A signature is evidence about a key, not an automatic guarantee about identity or legal responsibility.',
    sources: [{ label: 'Web Crypto: signatures', url: 'https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/sign' }],
  },
  certificate: {
    idea: 'A certificate binds a public key to a name through an issuer\'s signature. A browser checks a chain to a trusted root, the name, dates and other rules. A valid certificate does not prove honest intent.',
    terms: [['Issuer', 'The authority signing the certificate.'], ['Trust root', 'A starting point the client already trusts.'], ['Revocation', 'Rejecting a certificate before it expires.']],
    experiment: ['Open scene 06 and change the address bar to another domain.', 'Restore it, then expire the dates or use an unknown authority.', 'Try revocation. Why is a correct signature alone not enough?'],
    question: 'A certificate has a valid signature but names another domain. Accept it for aida.com?',
    choices: ['No, the domain check must pass too', 'Yes, the signature is enough', 'Yes, if the page looks right'],
    answer: 0,
    explanation: 'A trusted signature supports only the claims that were signed. It cannot fix a domain mismatch.',
    input: 'aida.com',
    code: `// A signed JSON model, not X.509 or a browser validator.
const ca = await crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" }, false, ["sign", "verify"]
);
const server = await crypto.subtle.generateKey(
  { name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]
);
const publicKey = await crypto.subtle.exportKey("jwk", server.publicKey);
const bytes = new TextEncoder().encode(JSON.stringify({ subject: input, publicKey }));
const algorithm = { name: "ECDSA", hash: "SHA-256" };
const signature = await crypto.subtle.sign(algorithm, ca.privateKey, bytes);
const trustedSignature = await crypto.subtle.verify(algorithm, ca.publicKey, signature, bytes);
const nameMatches = input.toLowerCase() === "aida.com";
return { subject: input, trustedSignature, nameMatches,
  modelAccepted: trustedSignature && nameMatches };`,
    caution: 'These are simplified signed records. They do not parse X.509, build real chains, contact a CA or check live revocation. Use your TLS library for real certificate validation.',
    sources: [{ label: 'X.509 validation', url: 'https://www.rfc-editor.org/rfc/rfc5280.html#section-6' }, { label: 'TLS 1.3', url: 'https://www.rfc-editor.org/rfc/rfc8446.html' }],
  },
};

// Only fixed lesson examples run. Learner input is a parameter, never code.
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
export async function runExample(id: Lesson['id'], input: string): Promise<unknown> {
  if (!globalThis.crypto?.subtle) throw new Error('Use localhost or HTTPS for Web Crypto.');
  return new AsyncFunction('input', PRACTICE[id].code)(input);
}
