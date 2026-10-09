const test = require("node:test");
const assert = require("node:assert/strict");
const { emitirToken } = require("../src/security/tokens");
const { extraerToken } = require("../src/middleware/autenticar");

test("auth middleware extracts valid bearer tokens and rejects malformed headers", () => {
  const token = emitirToken({ _id: "usuario-id", email: "admin@taller.com", rol: "admin" });
  assert.equal(extraerToken("Bearer " + token), token);
  assert.equal(extraerToken("Basic " + token), null);
  assert.equal(extraerToken("Bearer " + token + " extra"), null);
  assert.equal(extraerToken(""), null);
});
