const test = require("node:test");
const assert = require("node:assert/strict");
const { hashPassword, verifyPassword } = require("../src/security/passwords");
const { emitirToken, verificarToken } = require("../src/security/tokens");

test("passwords use salted scrypt and verify only the correct password", async () => {
  const hashA = await hashPassword("UnaClaveSegura-2026");
  const hashB = await hashPassword("UnaClaveSegura-2026");
  assert.notEqual(hashA, hashB);
  assert.equal(await verifyPassword("UnaClaveSegura-2026", hashA), true);
  assert.equal(await verifyPassword("otra contraseña", hashA), false);
});

test("signed tokens validate and reject altered signatures", () => {
  const token = emitirToken({ _id: "usuario-id", email: "admin@taller.com", rol: "admin" });
  const claims = verificarToken(token);
  assert.equal(claims.sub, "usuario-id");
  assert.equal(claims.rol, "admin");
  assert.equal(claims.ver, 0);
  const partes = token.split(".");
  partes[2] = (partes[2][0] === "a" ? "b" : "a") + partes[2].slice(1);
  assert.throws(() => verificarToken(partes.join(".")));
});

test("token parser rejects malformed input", () => {
  assert.throws(() => verificarToken("not-a-token"));
});
