import { describe, expect, it } from "vitest";
import {
  checkVerifier,
  decrypt,
  decryptRecursively,
  deriveKey,
  encrypt,
  generateSalt,
  isEncrypted,
  makeVerifier,
} from "./e2ee";

describe("e2ee utils", () => {
  it("encrypts and decrypts round-trip", async () => {
    const salt = generateSalt();
    const key = await deriveKey("test-passphrase-123", salt);

    const cipher = await encrypt(key, "Hydrate");
    expect(isEncrypted(cipher)).toBe(true);
    await expect(decrypt(key, cipher)).resolves.toBe("Hydrate");
  });

  it("rejects decrypt on non-e2ee values", async () => {
    const salt = generateSalt();
    const key = await deriveKey("test-passphrase-123", salt);
    await expect(decrypt(key, "plain-text")).rejects.toThrow("Not an e2ee ciphertext");
  });

  it("validates verifier only with matching key", async () => {
    const salt = generateSalt();
    const goodKey = await deriveKey("primary-passphrase", salt);
    const badKey = await deriveKey("wrong-passphrase", salt);
    const verifier = await makeVerifier(goodKey);

    await expect(checkVerifier(goodKey, verifier)).resolves.toBe(true);
    await expect(checkVerifier(badKey, verifier)).resolves.toBe(false);
  });

  it("recursively decrypts nested ciphertext without double-encrypt artifacts", async () => {
    const salt = generateSalt();
    const key = await deriveKey("test-passphrase-123", salt);

    const once = await encrypt(key, "Read 10 pages");
    const twice = await encrypt(key, once);

    await expect(decryptRecursively(key, twice)).resolves.toBe("Read 10 pages");
    await expect(decryptRecursively(key, "already-plain")).resolves.toBe("already-plain");
  });
});
