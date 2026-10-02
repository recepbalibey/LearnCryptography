import test from 'node:test';
import assert from 'node:assert/strict';
import { runExample } from '../src/data/practice.ts';
import { aesEncrypt, aesDecrypt, generateRsa, rsaEncrypt, rsaDecrypt, generateEcdsa, ecdsaSign, ecdsaVerify, digestHex, hostMatches } from '../src/lib/webcrypto.ts';

test('AES preserves UTF-8, rejects wrong keys and changed ciphertext, and uses fresh IVs', async () => {
  const text = 'Sensor: 24 °C';
  const a = await aesEncrypt(text, 'test-passphrase');
  const b = await aesEncrypt(text, 'test-passphrase');
  assert.notEqual(a.ivHex, b.ivHex);
  assert.equal(await aesDecrypt(a.cipherHex, 'test-passphrase', a.saltHex, a.ivHex), text);
  assert.equal(await aesDecrypt(a.cipherHex, 'wrong', a.saltHex, a.ivHex), null);
  const changed = (a.cipherHex.startsWith('00') ? '01' : '00') + a.cipherHex.slice(2);
  assert.equal(await aesDecrypt(changed, 'test-passphrase', a.saltHex, a.ivHex), null);
});

test('RSA rejects a different private key and checks UTF-8 byte limits', async () => {
  const [receiver, attacker] = await Promise.all([generateRsa(), generateRsa()]);
  const ciphertext = await rsaEncrypt(receiver, 'Secret');
  assert.equal(await rsaDecrypt(receiver, ciphertext), 'Secret');
  assert.equal(await rsaDecrypt(attacker, ciphertext), null);
  await assert.rejects(rsaEncrypt(receiver, 'é'.repeat(96)), /190 UTF-8 bytes/);
});

test('ECDSA rejects edits and signatures checked with the wrong public key', async () => {
  const [aida, eliot] = await Promise.all([generateEcdsa(), generateEcdsa()]);
  const sig = await ecdsaSign(aida, 'Install firmware');
  assert.equal(await ecdsaVerify(aida, sig.hex, 'Install firmware'), true);
  assert.equal(await ecdsaVerify(aida, sig.hex, 'Install firmware!'), false);
  assert.equal(await ecdsaVerify(eliot, sig.hex, 'Install firmware'), false);
});

test('SHA-256 matches a known digest and name matching limits wildcard depth', async () => {
  assert.equal(await digestHex('SHA-256', 'abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(hostMatches('*.aida.com', 'sensor.aida.com'), true);
  assert.equal(hostMatches('*.aida.com', 'a.b.aida.com'), false);
  assert.equal(hostMatches('*.aida.com', 'aida.com'), false);
  assert.equal(hostMatches('aida.com', 'eliot.com'), false);
});

test('all five displayed code examples run and expose their intended checks', async () => {
  const aes = await runExample('symmetric', '24 °C');
  assert.equal(aes.recovered, '24 °C'); assert.equal(aes.tamperingRejected, true);
  const rsa = await runExample('asymmetric', 'Secret');
  assert.equal(rsa.recovered, 'Secret');
  await assert.rejects(runExample('asymmetric', 'é'.repeat(96)), /190 UTF-8 bytes/);
  const hash = await runExample('hashing', 'Firmware');
  assert.equal(hash.same, false); assert.equal(hash.original.length, 64);
  const sig = await runExample('signature', 'Firmware');
  assert.equal(sig.valid, true); assert.equal(sig.validAfterEdit, false);
  const cert = await runExample('certificate', 'aida.com');
  assert.equal(cert.modelAccepted, true);
  const mismatch = await runExample('certificate', 'eliot.com');
  assert.equal(mismatch.trustedSignature, true); assert.equal(mismatch.modelAccepted, false);
  const literal = await runExample('hashing', '"; throw new Error("input is code")');
  assert.equal(literal.original.length, 64);
});
