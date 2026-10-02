export interface Scene {
  label: string;
  narration: string;
  caption: string;
}

export interface Lesson {
  id: "symmetric" | "asymmetric" | "hashing" | "signature" | "certificate";
  num: string;
  title: string;
  question: string;
  inherited: string;
  solves: string;
  leaves: string;
  oneLine: string;
  minutes: string;
  labTitle: string;
  labHint: string;
  scenes: Scene[];
}

export const LESSONS: Lesson[] = [
  {
    id: "symmetric",
    num: "01",
    title: "Symmetric encryption",
    question: "How do two people hide a message from everyone else on the line?",
    inherited: "Nothing yet. This is the starting point.",
    solves: "Confidentiality. AES-GCM also checks that the encrypted data has not been changed.",
    leaves: "Both sides need the same key first. Sending that key over the same line hands it to Eliot.",
    oneLine: "One key locks, the same key unlocks.",
    minutes: "6 scenes",
    labTitle: "Encrypt a message, then give Eliot the key",
    labHint: "Change the key by one character and watch Emma's output break.",
    scenes: [
      {
        label: "The open line",
        narration:
          "Aida sends Emma a payment instruction. Between them sit routers, a Wi-Fi access point and an internet provider. Eliot runs one of those hops, so he reads the text exactly as written.",
        caption: "Plain text on a shared network is readable by whoever carries it.",
      },
      {
        label: "One shared key",
        narration:
          "Aida and Emma agree on a secret value, K7. Both hold the same copy. This single key will do the locking and the unlocking, which is what symmetric means.",
        caption: "Symmetric: one key, held by both sides.",
      },
      {
        label: "Locking the message",
        narration:
          "AES-GCM takes the text, a key and a fresh IV, then produces ciphertext and an authentication tag. The content is hidden, but its length is still visible. The tag lets Emma reject changed data.",
        caption: "text + key produces ciphertext",
      },
      {
        label: "Eliot copies it",
        narration:
          "Eliot still captures everything. He now holds a block of bytes with no structure he can use. Intercepting and reading are two different things.",
        caption: "Interception without the key gives noise.",
      },
      {
        label: "Emma unlocks it",
        narration:
          "Emma runs the same algorithm in reverse with the same key. The original text comes back, byte for byte.",
        caption: "ciphertext + same key returns the original",
      },
      {
        label: "What is still broken",
        narration:
          "Aida and Emma had to share K7 before any of this worked. If she mails the key, Eliot copies it in transit and reads everything afterwards. Meeting in person does not scale to a laptop opening a hundred sites a day.",
        caption: "Unsolved: agreeing on a key across an untrusted line.",
      },
    ],
  },
  {
    id: "asymmetric",
    num: "02",
    title: "Asymmetric encryption",
    question: "How do you agree on a secret with someone you have never met?",
    inherited: "Symmetric encryption works, but the key has to travel, and Eliot watches the line.",
    solves: "A way to encrypt for a receiver without sharing a secret first, provided you have their real public key.",
    leaves: "You still need to check whose public key you have. Encryption alone also does not prove who sent the message.",
    oneLine: "A public key locks, only the matching private key opens.",
    minutes: "6 scenes",
    labTitle: "Generate a key pair and test who can open the message",
    labHint: "Try opening the ciphertext with the public key. It will not work, and that is the point.",
    scenes: [
      {
        label: "Two keys instead of one",
        narration:
          "Emma generates a linked pair. The public key can be handed to anyone. The private key stays on her machine and is never sent anywhere. What one key locks, only the other opens.",
        caption: "One pair: public to share, private to keep.",
      },
      {
        label: "Publishing the public key",
        narration:
          "Emma puts her public key on her site. Aida downloads it. Eliot downloads it too, and that changes nothing, because a public key can only lock.",
        caption: "A public key is meant to be copied.",
      },
      {
        label: "Aida locks with Emma's public key",
        narration:
          "Aida encrypts the message with Emma's public key using RSA-OAEP. Emma's private key can decrypt it. Aida can still know the message because she wrote it and may have kept a copy.",
        caption: "Encrypt with the recipient's public key.",
      },
      {
        label: "Eliot is stuck",
        narration:
          "Eliot holds the ciphertext and the public key. Recovering the private key from the public one means factoring a 2048 bit number, which is not something you brute force.",
        caption: "Holding the public key does not help him open it.",
      },
      {
        label: "Emma opens it",
        narration:
          "Emma applies her private key and reads the message. This RSA-OAEP pair is for encryption. Lesson four uses a separate ECDSA pair for signing and verification.",
        caption: "Decrypt with the private key.",
      },
      {
        label: "Why TLS still uses lesson 01",
        narration:
          "Public key operations are more costly and RSA-OAEP only accepts small inputs. Modern TLS uses a key agreement method, such as ephemeral Diffie-Hellman, rather than this RSA encryption demo. It then protects traffic with symmetric encryption.",
        caption: "Public key encryption and key agreement are different tools.",
      },
    ],
  },
  {
    id: "hashing",
    num: "03",
    title: "Hashing",
    question: "How does Emma know the message arrived exactly as it was sent?",
    inherited: "Encryption hides data. Hashing is a separate tool for comparing data, such as a downloaded file.",
    solves: "A way to detect changes when you compare against a trusted digest.",
    leaves: "Eliot can edit the message and recompute the hash himself. A bare fingerprint proves nothing about who made it.",
    oneLine: "Any input becomes one fixed length fingerprint, and it never runs backwards.",
    minutes: "6 scenes",
    labTitle: "Change one character and count the damage",
    labHint: "Type the same word in both fields, then capitalise one letter.",
    scenes: [
      {
        label: "The new problem",
        narration:
          "This scene uses a simple XOR cipher with no authentication tag. Eliot can flip a byte to change the payment amount. AES-GCM from lesson one would reject that change. Encryption needs an integrity check.",
        caption: "An unauthenticated cipher can allow changes. AES-GCM rejects them.",
      },
      {
        label: "A fingerprint, not a lock",
        narration:
          "A hash function takes any input and returns a fixed length value. There is no key and no decrypt operation. It only goes one way, like blending fruit.",
        caption: "SHA-256 returns 64 hex characters for anything.",
      },
      {
        label: "Same input, same output",
        narration:
          "The function is deterministic. Aida and Emma can each compute it on their own copy and compare results without exchanging the data again.",
        caption: "Deterministic, so two sides can compare.",
      },
      {
        label: "One character, a different fingerprint",
        narration:
          "Changing a single letter rewrites roughly half the output bits. There is no way to make a small edit and keep the fingerprint close to the original.",
        caption: "Small edit in, unrelated output.",
      },
      {
        label: "Checking a delivery",
        narration:
          "Emma gets a trusted reference hash and hashes her file. Different hashes prove that the inputs differ. Matching hashes are strong evidence of a match with SHA-256, but cannot give a mathematical guarantee because collisions exist.",
        caption: "Recompute and compare, that is the whole check.",
      },
      {
        label: "What is still broken",
        narration:
          "If Eliot can replace both a message and its reference hash, he can make the check pass. A bare hash cannot protect against an active attacker. You need a trusted reference, a message authentication code, or a signature.",
        caption: "Unsolved: tying the fingerprint to a person.",
      },
    ],
  },
  {
    id: "signature",
    num: "04",
    title: "Digital signatures",
    question: "How does Emma know the message came from Aida and not from Eliot?",
    inherited: "A hash detects changes, but anyone can compute a hash, including the attacker.",
    solves: "Evidence that the holder of a private key signed this exact message. Identity depends on trusting the matching public key.",
    leaves: "Verification uses Aida's public key. If Eliot can pass off his own key as Aida's, he signs as Aida.",
    oneLine: "Sign with a private key. Verify with its matching public key.",
    minutes: "6 scenes",
    labTitle: "Sign a document, then let Eliot edit it",
    labHint: "Change the document and watch verification fail.",
    scenes: [
      {
        label: "Sign the message",
        narration:
          "Aida uses ECDSA to sign the message with her private key. The signing algorithm hashes the message as part of its work. The output is a signature with two numbers, r and s. ECDSA does not encrypt a hash.",
        caption: "signature = sign(private key, message)",
      },
      {
        label: "Signing and encryption",
        narration:
          "Encryption hides a message. Signing produces evidence about it. Aida signs with an ECDSA private key and Emma verifies with the matching public key. Verification returns true or false; it does not open a signature.",
        caption: "Private key signs, public key verifies.",
      },
      {
        label: "Both parts travel",
        narration:
          "The message and the signature are sent together. The signature adds proof, not secrecy, so the text stays readable unless it is also encrypted. In practice both are used at once.",
        caption: "Readable, but no longer forgeable.",
      },
      {
        label: "Emma verifies",
        narration:
          "Emma gives the public key, signature and received message to the verification algorithm. A valid result is evidence that the matching private key signed those bytes. Emma must already know that this public key belongs to Aida.",
        caption: "verify(public key, signature, message) returns true or false.",
      },
      {
        label: "Eliot tries again",
        narration:
          "Eliot changes four thousand to nine thousand. Verification fails because the signature was made for different bytes. To sign the edited message as Aida, he would need her private key.",
        caption: "Changed message, failed verification.",
      },
      {
        label: "What is still broken",
        narration:
          "All of this rests on Emma having Aida's real public key. If Eliot hands over his own key with Aida's name on it, his signatures verify perfectly and Emma sees a valid result.",
        caption: "Unsolved: proving a public key belongs to who it claims.",
      },
    ],
  },
  {
    id: "certificate",
    num: "05",
    title: "Digital certificates",
    question: "How do you know a public key really belongs to the name on it?",
    inherited: "Signatures prove key ownership, but a key by itself carries no identity.",
    solves: "Trust in the key itself, through a third party that both sides already accept.",
    leaves: "Trust still depends on authorities, key safety and correct checks. A valid domain certificate does not prove honest intent.",
    oneLine: "A certificate is a public key plus a name, signed by an authority your device already trusts.",
    minutes: "6 scenes",
    labTitle: "Issue a certificate and run the browser checks",
    labHint: "Break one field and see which check fails.",
    scenes: [
      {
        label: "Key substitution",
        narration:
          "Two public keys arrive, both labelled Aida. One is hers, one is Eliot's. Nothing in the bytes tells them apart, so Emma picks the wrong one and Eliot reads and signs everything.",
        caption: "A raw key carries no identity.",
      },
      {
        label: "A party both sides already trust",
        narration:
          "Certificate authorities solve this by being pre-installed. Your operating system and browser ship with their public keys, so trust is established before you visit any site.",
        caption: "Root keys arrive with the device, not with the website.",
      },
      {
        label: "Validation before issuing",
        narration:
          "Aida asks for a certificate for aida.com. The authority checks she controls the domain, usually through a DNS record or a file on the server. Organisation certificates add company documents.",
        caption: "The authority verifies before it signs anything.",
      },
      {
        label: "The certificate is a signed record",
        narration:
          "The authority builds a record holding the name, Aida's public key and a validity window, then signs the whole record with its own private key. That signature is lesson four applied to an identity claim.",
        caption: "certificate = name + public key + validity, signed by the authority",
      },
      {
        label: "Presented on connection",
        narration:
          "When Emma's browser opens aida.com, the server sends the certificate before any data. Emma no longer receives a bare key, she receives a claim she can check.",
        caption: "The server presents, the client checks.",
      },
      {
        label: "Check the certificate",
        narration:
          "The browser checks the chain to a trusted root, the domain and the validity dates. Revocation handling varies. This demo models those checks with a signed record. In a typical TLS 1.3 connection, the certified key verifies the server's handshake signature; separate temporary keys agree the traffic secrets.",
        caption: "Certificates support authentication. TLS also needs key agreement and protected traffic.",
      },
    ],
  },
];

export const CHAIN = [
  { num: "01", title: "Symmetric", gives: "Secrecy", gap: "Need a shared secret" },
  { num: "02", title: "Asymmetric", gives: "Public key encryption", gap: "Whose public key?" },
  { num: "03", title: "Hashing", gives: "Integrity", gap: "Anyone can hash" },
  { num: "04", title: "Signatures", gives: "Signed messages", gap: "Whose key is it" },
  { num: "05", title: "Certificates", gives: "Trusted keys", gap: "Trust still has limits" },
];

export const COMPARISON = [
  {
    name: "Symmetric encryption",
    keys: "One shared key",
    does: "Hides content",
    speed: "Fast, used for bulk data",
    breaks: "Key distribution",
    real: "AES in TLS, disk and backup encryption",
  },
  {
    name: "Asymmetric encryption",
    keys: "Public and private pair",
    does: "Delivers a secret to a stranger",
    speed: "Slow, small payloads only",
    breaks: "Key ownership is unproven",
    real: "RSA-OAEP demos, hybrid encryption",
  },
  {
    name: "Hashing",
    keys: "No keys",
    does: "Compares data with a trusted digest",
    speed: "Fast, one direction",
    breaks: "Not tied to a sender",
    real: "File checksums; part of password hashing",
  },
  {
    name: "Digital signature",
    keys: "Private signs, public verifies",
    does: "Binds a message to a signing key",
    speed: "Medium",
    breaks: "Needs the correct public key",
    real: "Software updates, signed documents",
  },
  {
    name: "Digital certificate",
    keys: "Authority signs a name and key",
    does: "Binds a key to an identity",
    speed: "Checked once per connection",
    breaks: "Requires trusting the authority",
    real: "Every HTTPS connection",
  },
];

export const QUIZ = [
  {
    lesson: "01",
    q: "Aida encrypts with key K7 and sends the result to Emma. What does Emma need?",
    options: ["A different key derived from K7", "The same key K7", "No key, the algorithm reverses itself", "Eliot's key"],
    answer: 1,
    explain: "Symmetric means one key in both directions. That is also why the key itself has to be delivered safely.",
  },
  {
    lesson: "02",
    q: "Aida wants to send Emma something only Emma can read. Which key does she encrypt with?",
    options: ["Aida's private key", "Aida's public key", "Emma's public key", "Emma's private key"],
    answer: 2,
    explain: "Encrypt with the recipient's public key, because only the matching private key opens it, and Emma is the only holder.",
  },
  {
    lesson: "03",
    q: "Eliot intercepts a message and its hash, edits the message, then recomputes the hash. What happens?",
    options: ["The check fails, hashing blocks him", "The check passes, hashing alone does not prove the sender", "The hash cannot be recomputed", "Emma gets an error"],
    answer: 1,
    explain: "A hash sent on the same untrusted line can be replaced. Use a trusted digest, a MAC, or a signature to resist this attack.",
  },
  {
    lesson: "04",
    q: "How does Emma check an ECDSA signature?",
    options: ["Decrypt it with Aida's private key", "Verify the message and signature with Aida's public key", "Decrypt the document with Emma's key", "Compare the signature with the plain text"],
    answer: 1,
    explain: "ECDSA verification checks the message, signature and public key. It returns a boolean; there is no decryption step.",
  },
  {
    lesson: "05",
    q: "What does a valid domain certificate help a browser check?",
    options: ["The business is honest", "A binding between the domain and a public key through a trusted certificate chain", "That the server sent its private key", "That the connection uses no encryption"],
    answer: 1,
    explain: "The padlock is about key ownership and transport security, not about the honesty of the business behind the domain.",
  },
];

export const FAQ = [
  {
    q: "Is hashing a form of encryption?",
    a: "No. Encryption is reversible with a key, hashing has no key and no reverse. If you need to read the value later, encrypt it. If you only need to check it, hash it.",
  },
  {
    q: "Why not use asymmetric encryption for everything?",
    a: "Public key encryption has input limits and higher cost. Modern TLS uses key agreement to derive traffic keys, then an authenticated cipher such as AES-GCM protects the data.",
  },
  {
    q: "Is signing just encryption with the private key?",
    a: "No. They are separate operations. This site uses RSA-OAEP for encryption and ECDSA for signing, with different key pairs. ECDSA verification checks a signature; it does not decrypt it.",
  },
  {
    q: "What happens if a private key leaks?",
    a: "An attacker may sign or impersonate the key owner, depending on the key's purpose. Replace the key and revoke its certificate. Past TLS traffic protected with forward secrecy is not decrypted just by stealing the server's long-term key.",
  },
];
