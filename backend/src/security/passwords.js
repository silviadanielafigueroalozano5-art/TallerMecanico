const crypto = require("crypto");
const { promisify } = require("util");
const scrypt = promisify(crypto.scrypt);
const COST = 16384;
async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = await scrypt(password, salt, 64, { N: COST, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return ["scrypt", COST, salt.toString("base64url"), derived.toString("base64url")].join("$");
}
async function verifyPassword(password, encoded) {
  const [algorithm, costText, saltText, hashText] = String(encoded || "").split("$");
  if (algorithm !== "scrypt" || Number(costText) !== COST || !saltText || !hashText) return false;
  try {
    const expected = Buffer.from(hashText, "base64url");
    const actual = await scrypt(password, Buffer.from(saltText, "base64url"), expected.length, { N: COST, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  } catch { return false; }
}
module.exports = { hashPassword, verifyPassword };
