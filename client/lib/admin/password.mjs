import crypto from "crypto";

function safeCompareText(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function hashAdminPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derivedKey}`;
}

export function verifyAdminPassword(password, candidateSecret) {
  if (!candidateSecret) {
    return false;
  }

  if (candidateSecret.startsWith("scrypt:")) {
    const [, salt, expectedHash] = candidateSecret.split(":");

    if (!salt || !expectedHash) {
      return false;
    }

    const derivedKey = crypto.scryptSync(password, salt, 64).toString("hex");
    return safeCompareText(derivedKey, expectedHash);
  }

  return safeCompareText(password, candidateSecret);
}
