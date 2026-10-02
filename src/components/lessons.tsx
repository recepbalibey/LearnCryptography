import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import {
  Node, Wire, Attacker, Box, TypeOut, HexPanel, Meter, Verdict, Padlock, KeyTag,
  Controls, Field, Toggle, Computing, StageFrame, Label, seg, ease,
} from "./stage-kit";
import {
  aesEncrypt, aesDecrypt, randomBytes, digestHex, bitDifference, generateRsa, rsaEncrypt, rsaDecrypt,
  generateEcdsa, ecdsaSign, ecdsaVerify, toHex, hostMatches, tbsBytes, benchmark, hashSpeed,
  type AesResult, type RsaBundle, type EcBundle,
} from "../lib/webcrypto";

export interface StageProps {
  scene: number;
  t: number;
}

function useDebounced<T>(value: T, ms = 220): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

const row = "flex items-center gap-2.5";

/* ============================ 01 SYMMETRIC ============================ */

export function SymmetricStage({ scene, t }: StageProps) {
  const [message, setMessage] = useState("Transfer 4000 EUR to Emma");
  const [passphrase, setPassphrase] = useState("north-harbour-7");
  const [guess, setGuess] = useState("north-harbor-7");
  const dm = useDebounced(message);
  const dp = useDebounced(passphrase);
  const dg = useDebounced(guess);

  const salt = useRef(randomBytes(16));
  const [res, setRes] = useState<AesResult | null>(null);
  const [eliotPlain, setEliotPlain] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    aesEncrypt(dm, dp, { salt: salt.current, iv: randomBytes(12) }).then((r) => alive && setRes(r));
    return () => { alive = false; };
  }, [dm, dp]);

  useEffect(() => {
    if (!res) return;
    let alive = true;
    aesDecrypt(res.cipherHex, dg, res.saltHex, res.ivHex).then((p) => alive && setEliotPlain(p));
    return () => { alive = false; };
  }, [res, dg]);

  const controls = (
    <Controls>
      <Field label="message" value={message} onChange={setMessage} width="w-56" mono={false} />
      <Field label="key passphrase" value={passphrase} onChange={setPassphrase} width="w-40" />
      <Field label="Eliot guesses" value={guess} onChange={setGuess} width="w-40" />
    </Controls>
  );

  if (!res) return <StageFrame controls={controls}><Computing what="deriving a 256 bit key with PBKDF2" /></StageFrame>;

  const wire = (() => {
    switch (scene) {
      case 0: return <Wire t={t} packet={message.slice(0, 26)} tone="danger" note="plain text, readable at every hop" copied={0.5} />;
      case 1: return <Wire t={t} idle note="key agreed off the network" />;
      case 2: return <Wire t={t} idle note="encryption happens before anything is sent" />;
      case 3: return <Wire t={t} packet={`${res.cipherHex.slice(0, 16)}...`} tone="neutral" note="AES-GCM ciphertext in transit" copied={0.5} />;
      case 4: return <Wire t={t} idle note="delivered, decrypting locally" />;
      default: return <Wire t={t} packet={`key ${res.keyHex.slice(0, 12)}...`} tone="danger" note="the key itself has to cross the same line" copied={0.45} />;
    }
  })();

  return (
    <StageFrame controls={controls}>
      <div className={row}>
        <Node name="Aida" role="sender" active={scene <= 3} />
        {wire}
        <Node name="Emma" role="receiver" active={scene === 4} />
      </div>

      {scene === 0 && (
        <Attacker mode="reads" title="reading the payload as it passes">
          <TypeOut text={`"${message}"`} reveal={seg(t, 0.35, 0.8)} />
        </Attacker>
      )}

      {scene === 1 && (
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr]">
          <Box label="input to PBKDF2">
            <div className="font-mono text-[12px]">{passphrase || "empty"}</div>
            <div className="mt-0.5 text-[11px] text-muted">salt {res.saltHex.slice(0, 12)}, 60 000 iterations, SHA-256</div>
          </Box>
          <div className="flex items-center justify-center"><ArrowRight size={15} className="text-line-strong" /></div>
          <Box label="real 256 bit key, both sides">
            <TypeOut text={res.keyHex.slice(0, 32) + "..."} reveal={seg(t, 0.2, 0.85)} />
            <div className="mt-1 flex gap-1.5"><KeyTag label="Aida" kind="secret" /><KeyTag label="Emma" kind="secret" /></div>
          </Box>
        </div>
      )}

      {scene === 2 && (
        <div className="grid gap-2 sm:grid-cols-[1.1fr_auto_1.4fr]">
          <div className="space-y-2">
            <Box label="plaintext"><span className="text-[12.5px]">{message}</span></Box>
            <div className="flex items-center gap-2">
              <Padlock p={ease(seg(t, 0.25, 0.7))} />
              <span className="text-[11px] text-muted">AES-256-GCM, iv {res.ivHex.slice(0, 12)}</span>
            </div>
          </div>
          <div className="flex items-center justify-center"><ArrowRight size={15} className="text-line-strong" /></div>
          <HexPanel label={`ciphertext, ${res.cipherHex.length / 2} bytes including the 16 byte tag`} hex={res.cipherHex} reveal={seg(t, 0.15, 0.9)} rows={3} />
        </div>
      )}

      {scene === 3 && (
        <Attacker mode="blocked" title="holds the bytes, tries his guessed key">
          <div className="space-y-1.5">
            <div className="font-mono text-[11px] text-muted">{res.cipherHex.slice(0, 48)}...</div>
            {eliotPlain === null ? (
              <Verdict ok={false}>AES-GCM rejected it, the authentication tag did not match</Verdict>
            ) : (
              <Verdict ok={false}>his guess was right, plaintext recovered: {eliotPlain}</Verdict>
            )}
          </div>
        </Attacker>
      )}

      {scene === 4 && (
        <div className="grid gap-2 sm:grid-cols-[1.3fr_auto_1fr]">
          <HexPanel label="ciphertext received" hex={res.cipherHex} rows={2} />
          <div className="flex flex-col items-center justify-center gap-1">
            <KeyTag label="same key" kind="secret" />
            <ArrowRight size={15} className="text-line-strong" />
          </div>
          <Box label="decrypted by Emma" tone="ok"><TypeOut text={message} reveal={seg(t, 0.25, 0.85)} /></Box>
        </div>
      )}

      {scene === 5 && (
        <div className="space-y-2">
          <Attacker mode="reads" title="now holds the same key bytes">
            <div className="font-mono text-[11px] text-danger">{res.keyHex.slice(0, 48)}...</div>
          </Attacker>
          <Verdict ok={false}>every past and future message under this key is readable</Verdict>
        </div>
      )}
    </StageFrame>
  );
}

/* ============================ 02 ASYMMETRIC =========================== */

export function AsymmetricStage({ scene, t }: StageProps) {
  const [message, setMessage] = useState("Session key: 9f2c-a14b");
  const dm = useDebounced(message);
  const [emma, setEmma] = useState<RsaBundle | null>(null);
  const [other, setOther] = useState<RsaBundle | null>(null);
  const [ct, setCt] = useState<string>("");
  const [opened, setOpened] = useState<string | null>(null);
  const [wrong, setWrong] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [bench, setBench] = useState<{ aes: number; rsa: number } | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([generateRsa(), generateRsa()]).then(([a, b]) => {
      if (!alive) return;
      setEmma(a);
      setOther(b);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!emma || !other) return;
    let alive = true;
    (async () => {
      try {
        const c = await rsaEncrypt(emma, dm);
        const [plain, incorrect] = await Promise.all([rsaDecrypt(emma, c), rsaDecrypt(other, c)]);
        if (!alive) return;
        setError(""); setCt(c); setOpened(plain); setWrong(incorrect);
      } catch (failure) {
        if (alive) setError(failure instanceof Error ? failure.message : "Encryption failed.");
      }
    })();
    return () => { alive = false; };
  }, [emma, other, dm]);

  useEffect(() => {
    if (scene < 5 || bench || !emma || !ct) return;
    let alive = true;
    (async () => {
      const result = await benchmark(emma, ct);
      if (alive) setBench(result);
    })();
    return () => { alive = false; };
  }, [scene, bench, emma, ct]);

  const controls = (
    <Controls>
      <Field label="message" value={message} onChange={setMessage} width="w-64" mono={false} />
      <span className="text-[11px] text-muted">RSA-OAEP 2048, generated in your browser</span>
    </Controls>
  );

  if (error) return <StageFrame controls={controls}><p role="alert" className="text-[14px] text-danger">{error}</p></StageFrame>;

  if (!emma || !ct) return <StageFrame controls={controls}><Computing what="generating a real 2048 bit RSA key pair" /></StageFrame>;

  const wire = (() => {
    switch (scene) {
      case 0: return <Wire t={t} idle note="key pair created locally, nothing sent" />;
      case 1: return <Wire t={t} reverse packet={`public key ${emma.spkiB64.slice(0, 14)}...`} tone="accent" note="public key travelling to Aida" copied={0.5} />;
      case 2: return <Wire t={t} idle note="encrypting before transmission" />;
      case 3: return <Wire t={t} packet={`${ct.slice(0, 14)}...`} tone="neutral" note="RSA ciphertext in transit" copied={0.45} />;
      case 4: return <Wire t={t} idle note="delivered" />;
      default: return <Wire t={t} packet="AES session key, wrapped" tone="accent" note="hybrid encryption model; TLS uses key agreement" />;
    }
  })();

  return (
    <StageFrame controls={controls}>
      <div className={row}>
        <Node name="Aida" role="sender" active={scene === 2} />
        {wire}
        <Node name="Emma" role="key owner" active={scene === 0 || scene === 4} kind={scene === 0 ? "machine" : "person"} />
      </div>

      {scene === 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          <Box label="public key, SPKI export">
            <TypeOut text={emma.spkiB64.slice(0, 40) + "..."} reveal={seg(t, 0.1, 0.7)} className="break-all" />
            <div className="mt-1 text-[11px] text-muted">sha256 {emma.fingerprint.slice(0, 16)}</div>
          </Box>
          <Box label="private key, kept locally" tone="muted">
            <div className="font-mono text-[12px] text-ink">{emma.pkcs8Len} bytes in the local demo export</div>
            <div className="mt-1 text-[11px] text-muted">generated in {emma.keygenMs} ms, modulus {emma.modulusBits} bits</div>
          </Box>
        </div>
      )}

      {scene === 1 && (
        <Attacker mode="blocked" title="copies the public key, which is harmless">
          <div className="font-mono text-[11px] text-muted">{emma.spkiB64.slice(0, 52)}...</div>
        </Attacker>
      )}

      {scene === 2 && (
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_1.5fr]">
          <div className="space-y-2">
            <Box label="plaintext"><span className="text-[12.5px]">{message}</span></Box>
            <div className="flex items-center gap-2"><Padlock p={ease(seg(t, 0.2, 0.65))} /><KeyTag label="Emma public" kind="public" /></div>
          </div>
          <div className="flex items-center justify-center"><ArrowRight size={15} className="text-line-strong" /></div>
          <HexPanel label={`ciphertext, always ${ct.length / 2} bytes`} hex={ct} reveal={seg(t, 0.1, 0.9)} rows={3} />
        </div>
      )}

      {scene === 3 && (
        <Attacker mode="blocked" title="runs decrypt with the only private key he owns">
          <Verdict ok={false}>{wrong === null ? "OperationError, the ciphertext does not belong to his key" : `unexpected: ${wrong}`}</Verdict>
        </Attacker>
      )}

      {scene === 4 && (
        <div className="grid gap-2 sm:grid-cols-[1.3fr_auto_1fr]">
          <HexPanel label="ciphertext received" hex={ct} rows={2} />
          <div className="flex flex-col items-center justify-center gap-1"><KeyTag label="Emma private" kind="private" /><ArrowRight size={15} className="text-line-strong" /></div>
          <Box label="decrypted" tone="ok"><TypeOut text={opened ?? ""} reveal={seg(t, 0.2, 0.8)} /></Box>
        </div>
      )}

      {scene === 5 && (
        <div className="space-y-2">
          {!bench ? (
            <Computing what="benchmarking AES against RSA in this browser" />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              <Box label="AES-256-GCM, one operation"><span className="font-mono text-[13px]">{bench.aes} ms</span></Box>
              <Box label="RSA-2048 private key, one operation" tone="muted"><span className="font-mono text-[13px] text-ink">{bench.rsa} ms</span></Box>
              <div className="sm:col-span-2">
                <Meter value={Math.min(100, (bench.aes / bench.rsa) * 100)} caption={`RSA is about ${Math.round(bench.rsa / Math.max(bench.aes, 0.001))} times slower here, which is why it only carries the session key`} />
              </div>
            </div>
          )}
        </div>
      )}
    </StageFrame>
  );
}

/* ============================== 03 HASHING ============================= */

type Algo = "SHA-1" | "SHA-256" | "SHA-512";

export function HashingStage({ scene, t }: StageProps) {
  const [a, setA] = useState("Transfer 4000 EUR");
  const [b, setB] = useState("Transfer 9000 EUR");
  const [algo, setAlgo] = useState<Algo>("SHA-256");
  const da = useDebounced(a);
  const db = useDebounced(b);
  const [ha, setHa] = useState("");
  const [hb, setHb] = useState("");
  const [speed, setSpeed] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([digestHex(algo, da), digestHex(algo, db)]).then(([x, y]) => {
      if (!alive) return;
      setHa(x);
      setHb(y);
    });
    return () => { alive = false; };
  }, [da, db, algo]);

  useEffect(() => {
    if (scene !== 2 || speed !== null) return;
    let alive = true;
    (async () => {
      const ms = await hashSpeed();
      if (alive) setSpeed(ms);
    })();
    return () => { alive = false; };
  }, [scene, speed]);

  const diff = useMemo(() => (ha && hb ? bitDifference(ha, hb) : null), [ha, hb]);

  // Real malleability demo: with a keystream cipher and no integrity tag,
  // flipping ciphertext bits flips the same plaintext bits.
  const flip = useMemo(() => {
    const original = "Transfer 4000 EUR";
    const keystream = randomBytes(original.length);
    const bytes = new TextEncoder().encode(original);
    const ctBytes = bytes.map((v, i) => v ^ keystream[i]);
    const idx = original.indexOf("4");
    const delta = "4".charCodeAt(0) ^ "9".charCodeAt(0);
    const tampered = Uint8Array.from(ctBytes);
    tampered[idx] = tampered[idx] ^ delta;
    const out = new TextDecoder().decode(tampered.map((v, i) => v ^ keystream[i]));
    return { idx, delta: delta.toString(16).padStart(2, "0"), out, ctHex: toHex(ctBytes) };
  }, []);

  const bits = algo === "SHA-1" ? 160 : algo === "SHA-256" ? 256 : 512;

  const controls = (
    <Controls>
      <Field label="input A" value={a} onChange={setA} width="w-48" mono={false} />
      <Field label="input B" value={b} onChange={setB} width="w-48" mono={false} />
      <div className="flex items-center gap-1">
        {(["SHA-1", "SHA-256", "SHA-512"] as Algo[]).map((x) => (
          <button key={x} onClick={() => setAlgo(x)} className={`rounded-md px-2 py-1 font-mono text-[11px] transition focus-ring ${algo === x ? "bg-ink text-canvas" : "border border-line bg-canvas text-muted hover:text-ink"}`}>
            {x}
          </button>
        ))}
      </div>
    </Controls>
  );

  if (!ha) return <StageFrame controls={controls}><Computing what="hashing with the browser digest API" /></StageFrame>;

  return (
    <StageFrame controls={controls}>
      {scene === 0 ? (
        <>
          <div className={row}>
            <Node name="Aida" role="sender" />
            <Wire t={t} packet={`${flip.ctHex.slice(0, 14)}...`} tone="danger" note="keystream cipher with no integrity tag" copied={0.4} />
            <Node name="Emma" role="receiver" active={t > 0.7} />
          </div>
          <Attacker mode="tampers" title={`flips byte ${flip.idx} by 0x${flip.delta}, without any key`}>
            <div className="grid gap-1.5 sm:grid-cols-2">
              <Box label="Aida wrote"><span className="text-[12.5px]">Transfer 4000 EUR</span></Box>
              <Box label="Emma decrypts" tone="danger"><span className="text-[12.5px] text-ink">{flip.out}</span></Box>
            </div>
          </Attacker>
        </>
      ) : (
        <>
          <div className="flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center">
            <Box label="input, any length" className="sm:w-[34%]"><span className="text-[12.5px]">{scene === 3 ? a : a}</span></Box>
            <div className="flex items-center justify-center">
              <Grinder t={t} algo={algo} />
            </div>
            <div className="min-w-0 flex-1">
              <HexPanel label={`${algo}, ${bits} bits out`} hex={ha} reveal={scene === 1 ? seg(t, 0.1, 0.85) : 1} rows={4} perRow={algo === "SHA-512" ? 16 : 8} diffAgainst={scene === 3 ? hb : undefined} />
            </div>
          </div>

          {scene === 1 && (
            <div className="text-[12px] text-muted">
              No key was used. There is no function that turns these {bits / 8} bytes back into the text.
            </div>
          )}

          {scene === 2 && (
            <div className="grid gap-2 sm:grid-cols-2">
              <Box label="second run, same input" tone="ok"><span className="font-mono text-[11px]">{ha.slice(0, 40)}...</span></Box>
              <Box label="speed measured here">{speed === null ? <span className="text-[12px] text-muted">timing 1 MB...</span> : <span className="font-mono text-[13px]">{speed} ms for 1 MB</span>}</Box>
            </div>
          )}

          {scene === 3 && diff && (
            <div className="space-y-2">
              <HexPanel label={`digest of input B: "${b}"`} hex={hb} diffAgainst={ha} rows={4} perRow={algo === "SHA-512" ? 16 : 8} tone="muted" />
              <Meter value={diff.percent} caption={`${diff.bits} of ${diff.total} bits differ, ${diff.percent.toFixed(1)} percent`} />
            </div>
          )}

          {scene === 4 && (
            <div className="space-y-2">
              <div className="grid gap-2 sm:grid-cols-2">
                <Box label="digest sent alongside the message"><span className="font-mono text-[11px]">{ha.slice(0, 40)}...</span></Box>
                <Box label="digest Emma computes herself"><span className="font-mono text-[11px]">{ha.slice(0, 40)}...</span></Box>
              </div>
              <Verdict ok>matching digests; trust depends on where the reference came from</Verdict>
            </div>
          )}

          {scene === 5 && (
            <div className="space-y-2">
              <Attacker mode="tampers" title="edits the text and publishes his own digest">
                <span className="font-mono text-[11px] text-danger">{hb.slice(0, 44)}...</span>
              </Attacker>
              <Verdict ok={false}>the comparison passes, because a digest says nothing about who produced it</Verdict>
            </div>
          )}
        </>
      )}
    </StageFrame>
  );
}

/** The digest machine. Its rotation is bound to scene progress. */
function Grinder({ t, algo }: { t: number; algo: Algo }) {
  return (
    <div className="flex flex-col items-center gap-1 px-1">
      <motion.div
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface"
        animate={{ rotate: t * 180 }}
        transition={{ type: "tween", duration: 0.12 }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="7.5" stroke="#23242a" strokeWidth="1.5" />
          <path d="M12 4.5v15M4.5 12h15M6.7 6.7l10.6 10.6M17.3 6.7 6.7 17.3" stroke="#23242a" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
        </svg>
      </motion.div>
      <span className="font-mono text-[10px] text-muted">{algo}</span>
    </div>
  );
}

/* ============================ 04 SIGNATURES =========================== */

export function SignatureStage({ scene, t }: StageProps) {
  const [doc, setDoc] = useState("Aida authorises 4000 EUR to Emma");
  const [tampered, setTampered] = useState(false);
  const [useEliotKey, setUseEliotKey] = useState(false);
  const dd = useDebounced(doc);

  const [aida, setAida] = useState<EcBundle | null>(null);
  const [eliot, setEliot] = useState<EcBundle | null>(null);
  const [sig, setSig] = useState<{ hex: string; r: string; s: string; ms: number } | null>(null);
  const [docHash, setDocHash] = useState("");
  const [verified, setVerified] = useState<boolean | null>(null);
  const [eliotSigValid, setEliotSigValid] = useState<boolean | null>(null);

  const received = tampered ? (dd.includes("4000") ? dd.replace("4000", "9000") : dd + " [edited by Eliot]") : dd;

  useEffect(() => {
    let alive = true;
    Promise.all([generateEcdsa(), generateEcdsa()]).then(([a, e]) => {
      if (!alive) return;
      setAida(a);
      setEliot(e);
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!aida) return;
    let alive = true;
    (async () => {
      const s = await ecdsaSign(aida, dd);
      const h = await digestHex("SHA-256", dd);
      if (!alive) return;
      setSig(s);
      setDocHash(h);
    })();
    return () => { alive = false; };
  }, [aida, dd]);

  useEffect(() => {
    if (!aida || !sig) return;
    let alive = true;
    ecdsaVerify(aida, sig.hex, received).then((v) => alive && setVerified(v));
    return () => { alive = false; };
  }, [aida, sig, received]);

  useEffect(() => {
    if (!aida || !eliot) return;
    let alive = true;
    (async () => {
      const forged = await ecdsaSign(eliot, received);
      const v = await ecdsaVerify(useEliotKey ? eliot : aida, forged.hex, received);
      if (alive) setEliotSigValid(v);
    })();
    return () => { alive = false; };
  }, [aida, eliot, received, useEliotKey]);

  const controls = (
    <Controls>
      <Field label="document" value={doc} onChange={setDoc} width="w-64" mono={false} />
      <Toggle on={tampered} onClick={() => setTampered(!tampered)}>{tampered ? "Eliot edited it" : "let Eliot edit it"}</Toggle>
      {scene === 5 && (
        <Toggle on={useEliotKey} onClick={() => setUseEliotKey(!useEliotKey)}>
          {useEliotKey ? "Emma is using Eliot's key" : "Emma is using Aida's key"}
        </Toggle>
      )}
    </Controls>
  );

  if (!aida || !sig) return <StageFrame controls={controls}><Computing what="generating an ECDSA P-256 key pair" /></StageFrame>;

  const wire = (() => {
    switch (scene) {
      case 0:
      case 1: return <Wire t={t} idle note="signing happens locally" />;
      case 2: return <Wire t={t} packet={`document + signature`} tone={tampered ? "danger" : "neutral"} note={tampered ? "Eliot rewrites the amount" : "both parts travel together"} copied={tampered ? 0.45 : undefined} />;
      case 3:
      case 4: return <Wire t={t} idle note="verification runs on Emma's side" />;
      default: return <Wire t={t} packet="which public key is Aida's" tone="danger" note="verification depends on the key you already hold" />;
    }
  })();

  return (
    <StageFrame controls={controls}>
      <div className={row}>
        <Node name="Aida" role="signer" active={scene <= 2} />
        {wire}
        <Node name="Emma" role="verifier" active={scene >= 3} />
      </div>

      {scene === 0 && (
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr]">
          <Box label="SHA-256 of the document"><TypeOut text={docHash.slice(0, 32) + "..."} reveal={seg(t, 0.1, 0.5)} /></Box>
          <div className="flex items-center justify-center gap-1"><KeyTag label="Aida private" kind="private" /></div>
          <Box label={`ECDSA signature, signed in ${sig.ms} ms`} tone="accent">
            <TypeOut text={sig.hex.slice(0, 32) + "..."} reveal={seg(t, 0.5, 0.95)} />
          </Box>
        </div>
      )}

      {scene === 1 && (
        <div className="grid gap-2 sm:grid-cols-2">
          <Box label="to keep a secret"><div className="flex items-center gap-2"><Padlock p={1} /><span className="text-[12px]">public key locks, private key opens</span></div></Box>
          <Box label="to prove authorship" tone="accent"><div className="flex items-center gap-2"><Padlock p={1} tone="ok" /><span className="text-[12px] text-ink">private key signs, public key verifies</span></div></Box>
        </div>
      )}

      {scene === 2 && (
        <div className="grid gap-2 sm:grid-cols-2">
          <Box label="document, still readable" tone={tampered ? "danger" : "neutral"}><span className="text-[12.5px] text-ink">{received}</span></Box>
          <Box label={`signature r and s, ${sig.hex.length / 2} bytes`}>
            <div className="font-mono text-[11px] text-muted">r {sig.r.slice(0, 18)}...</div>
            <div className="font-mono text-[11px] text-muted">s {sig.s.slice(0, 18)}...</div>
          </Box>
        </div>
      )}

      {(scene === 3 || scene === 4) && (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <Box label="document Emma received" tone={tampered ? "danger" : "neutral"}><span className="text-[12.5px] text-ink">{received}</span></Box>
            <Box label="verified against"><KeyTag label={`Aida public ${aida.pubB64.slice(0, 10)}`} kind="public" /></Box>
          </div>
          {verified === null ? (
            <Computing what="running crypto.subtle.verify" />
          ) : (
            <Verdict ok={verified}>
              {verified
                ? "verify() returned true, the document matches the signature and only Aida's private key could produce it"
                : "verify() returned false, one character changed and the signature no longer fits"}
            </Verdict>
          )}
        </div>
      )}

      {scene === 5 && (
        <div className="space-y-2">
          <Attacker mode="tampers" title="signs the same text with his own private key">
            <span className="font-mono text-[11px] text-danger">{eliot?.pubB64.slice(0, 40)}...</span>
          </Attacker>
          {eliotSigValid === null ? (
            <Computing what="verifying the forged signature" />
          ) : (
            <Verdict ok={!eliotSigValid}>
              {eliotSigValid
                ? "Emma used the key Eliot sent, so his forgery verifies as valid"
                : "Emma used Aida's real key, so the forgery fails"}
            </Verdict>
          )}
        </div>
      )}
    </StageFrame>
  );
}

/* =========================== 05 CERTIFICATES ========================== */

export function CertificateStage({ scene, t }: StageProps) {
  const [subject, setSubject] = useState("aida.com");
  const [address, setAddress] = useState("aida.com");
  const [expired, setExpired] = useState(false);
  const [rogue, setRogue] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const [today] = useState(() => new Date());
  const ds = useDebounced(subject);

  const [ca, setCa] = useState<EcBundle | null>(null);
  const [fake, setFake] = useState<EcBundle | null>(null);
  const [serverKey, setServerKey] = useState<EcBundle | null>(null);
  const [sig, setSig] = useState<{ hex: string; ms: number } | null>(null);
  const [sigValid, setSigValid] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([generateEcdsa(), generateEcdsa(), generateEcdsa()]).then(([c, f, s]) => {
      if (!alive) return;
      setCa(c);
      setFake(f);
      setServerKey(s);
    });
    return () => { alive = false; };
  }, []);

  const record = useMemo(
    () => ({
      subject: ds,
      issuer: "Example Root CA",
      notBefore: new Date(today.getTime() - 86400000 * 30).toISOString().slice(0, 10),
      notAfter: new Date(today.getTime() + 86400000 * (expired ? -1 : 90)).toISOString().slice(0, 10),
      serial: "0a:e3:91:7c:44",
      keyFingerprint: serverKey?.fingerprint ?? "",
    }),
    [ds, expired, serverKey, today],
  );

  useEffect(() => {
    if (!ca || !fake || !serverKey) return;
    let alive = true;
    (async () => {
      const signer = rogue ? fake : ca;
      const s = await ecdsaSign(signer, tbsBytes(record));
      const v = await ecdsaVerify(ca, s.hex, tbsBytes(record));
      if (!alive) return;
      setSig({ hex: s.hex, ms: s.ms });
      setSigValid(v);
    })();
    return () => { alive = false; };
  }, [ca, fake, serverKey, record, rogue]);

  const now = new Date();
  const dateOk = now >= new Date(record.notBefore) && now <= new Date(record.notAfter);
  const nameOk = hostMatches(record.subject, address);
  const allOk = Boolean(sigValid) && nameOk && dateOk && !revoked;

  const controls = (
    <Controls>
      <Field label="certificate subject" value={subject} onChange={setSubject} width="w-40" />
      <Field label="address bar" value={address} onChange={setAddress} width="w-40" />
      <Toggle on={expired} onClick={() => setExpired(!expired)}>{expired ? "dates expired" : "expire the dates"}</Toggle>
      <Toggle on={revoked} onClick={() => setRevoked(!revoked)}>{revoked ? "certificate revoked" : "revoke the certificate"}</Toggle>
      <Toggle on={rogue} onClick={() => setRogue(!rogue)}>{rogue ? "signed by an unknown CA" : "sign with an unknown CA"}</Toggle>
    </Controls>
  );

  if (!ca || !sig || !serverKey) return <StageFrame controls={controls}><Computing what="creating a certificate authority key pair" /></StageFrame>;

  const wire = (() => {
    switch (scene) {
      case 0: return <Wire t={t} packet="public key claiming aida.com" tone="danger" note="two keys, one name, nothing to tell them apart" />;
      case 1:
      case 2:
      case 3: return <Wire t={t} idle note="issuing happens before any visitor connects" />;
      default: return <Wire t={t} reverse packet={`certificate for ${record.subject}`} tone="accent" note="sent before any application data" />;
    }
  })();

  return (
    <StageFrame controls={controls}>
      <div className={row}>
        <Node name="Aida" role={record.subject} active={scene === 2 || scene === 4} kind="server" />
        {wire}
        <Node name="Emma" role="browser" active={scene >= 4} />
      </div>

      {scene === 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          <Box label="key A, real fingerprint"><span className="font-mono text-[11px]">{serverKey.fingerprint.slice(0, 30)}...</span></Box>
          <Box label="key B, also labelled Aida" tone="danger"><span className="font-mono text-[11px] text-ink">{fake?.fingerprint.slice(0, 30)}...</span></Box>
        </div>
      )}

      {scene === 1 && (
        <div className="grid gap-2 sm:grid-cols-[auto_1fr]">
          <Node name="Root CA" role="pre-installed" active kind="authority" />
          <Box label="root public key already on Emma's device">
            <span className="font-mono text-[11px]">{ca.pubB64.slice(0, 44)}...</span>
            <div className="mt-1 text-[11px] text-muted">Trust starts here, not with the website.</div>
          </Box>
        </div>
      )}

      {scene === 2 && (
        <div className="space-y-1.5">
          {["certificate request carries the name and the public key", "prove control of the domain with a DNS record", "checks recorded, then the request is approved"].map((s, i) => {
            const on = t > 0.15 + i * 0.25;
            return (
              <div key={s} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] transition-all duration-300 ${on ? "border-line bg-surface text-ink" : "border-dashed border-line bg-canvas text-muted"}`}>
                <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${on ? "bg-ink text-canvas" : "bg-sunken text-muted"}`}>{i + 1}</span>
                {s}
              </div>
            );
          })}
        </div>
      )}

      {scene === 3 && (
        <div className="grid gap-2 sm:grid-cols-[1.2fr_1fr]">
          <Box label="the bytes being signed, the TBS record">
            <div className="font-mono text-[11px] leading-relaxed text-ink">{tbsBytes(record).slice(0, 96)}</div>
          </Box>
          <Box label={`CA signature, produced in ${sig.ms} ms`} tone="accent">
            <TypeOut text={sig.hex.slice(0, 28) + "..."} reveal={seg(t, 0.25, 0.9)} />
          </Box>
        </div>
      )}

      {scene === 4 && (
        <div className="rounded-lg border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-3 py-1.5">
            <Label>certificate presented</Label>
            <span className="font-mono text-[10px] text-muted">serial {record.serial}</span>
          </div>
          <div className="grid gap-x-6 gap-y-0.5 px-3 py-2 font-mono text-[11px] sm:grid-cols-2">
            <span className="text-muted">subject</span><span>{record.subject}</span>
            <span className="text-muted">issuer</span><span>{rogue ? "Unknown CA" : record.issuer}</span>
            <span className="text-muted">validity</span><span>{record.notBefore} to {record.notAfter}</span>
            <span className="text-muted">signature</span><span className="truncate">{sig.hex.slice(0, 20)}...</span>
          </div>
        </div>
      )}

      {scene === 5 && (
        <div className="space-y-2">
          <div className="grid gap-1.5 sm:grid-cols-2">
            {[
              { ok: Boolean(sigValid), label: sigValid ? "signature verifies against the trusted root" : "signature does not verify against any trusted root" },
              { ok: nameOk, label: nameOk ? `name ${record.subject} matches ${address}` : `name ${record.subject} does not match ${address}` },
              { ok: dateOk, label: dateOk ? `inside ${record.notBefore} to ${record.notAfter}` : `outside ${record.notBefore} to ${record.notAfter}` },
              { ok: !revoked, label: revoked ? "revoked in this model" : "not revoked in this model (no live lookup)" },
            ].map((c, i) => {
              const shown = t > 0.1 + i * 0.18;
              return (
                <div key={c.label} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] transition-opacity duration-300 ${shown ? "opacity-100" : "opacity-25"} ${c.ok ? "border-ok/25 bg-ok-soft" : "border-danger/30 bg-danger-soft"}`}>
                  <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${c.ok ? "bg-ok" : "bg-danger"}`}>
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden>
                      {c.ok ? <path d="M1.5 5.2 4 7.5 8.5 2.5" stroke="#f4f2ed" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" /> : <path d="M2.2 2.2l5.6 5.6M7.8 2.2 2.2 7.8" stroke="#f4f2ed" strokeWidth="1.9" strokeLinecap="round" />}
                    </svg>
                  </span>
                  <span className="min-w-0 truncate text-ink">{c.label}</span>
                </div>
              );
            })}
          </div>
          <Verdict ok={allOk}>
            {allOk ? "model checks pass; real TLS also checks the chain and handshake" : "one model check failed; reject this certificate"}
          </Verdict>
        </div>
      )}
    </StageFrame>
  );
}

export const STAGES = {
  symmetric: SymmetricStage,
  asymmetric: AsymmetricStage,
  hashing: HashingStage,
  signature: SignatureStage,
  certificate: CertificateStage,
};
