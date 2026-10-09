const test = require("node:test");
const assert = require("node:assert/strict");
for (const key of ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "MAIL_FROM", "APP_URL"]) process.env[key] = "";
const app = require("../src/app");

test("private API collections require a bearer token and login validates input", async (t) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const base = "http://127.0.0.1:" + server.address().port;
  for (const route of ["/api/clientes", "/api/vehiculos", "/api/vehiculos/placa/ABC123/estado", "/api/ordenes", "/api/historial"]) {
    const response = await fetch(base + route);
    assert.equal(response.status, 401, route + " must require authentication");
  }
  const invalidLogin = await fetch(base + "/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "incorrecto..@dominio.com", password: "password123" }),
  });
  assert.equal(invalidLogin.status, 400);
  const recoveryUnavailable = await fetch(base + "/api/auth/forgot-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "silviadanielafigueroa7@gmail.com" }),
  });
  assert.equal(recoveryUnavailable.status, 503);
  const invalidReset = await fetch(base + "/api/auth/reset-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: "invalid", password: "short" }),
  });
  assert.equal(invalidReset.status, 400);

});
