const test = require("node:test");
const assert = require("node:assert/strict");
const Usuario = require("../src/models/Usuario");
const auth = require("../src/controllers/auth.controller");
const { hashPassword } = require("../src/security/passwords");
const { verificarToken } = require("../src/security/tokens");

test("login issues a token with the current account version after password reset", async () => {
  const original = Usuario.findOne;
  const passwordHash = await hashPassword("UnaClaveSegura-2026");
  Usuario.findOne = () => ({
    select(projection) {
      assert.match(projection, /tokenVersion/);
      return Promise.resolve({ _id: "usuario-id", email: "admin@taller.com", rol: "admin", tokenVersion: 3, passwordHash });
    },
  });
  const response = {
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  try {
    await auth.iniciarSesion({ body: { email: "admin@taller.com", password: "UnaClaveSegura-2026" } }, response);
    assert.equal(response.statusCode, undefined);
    assert.equal(verificarToken(response.body.token).ver, 3);
  } finally {
    Usuario.findOne = original;
  }
});
