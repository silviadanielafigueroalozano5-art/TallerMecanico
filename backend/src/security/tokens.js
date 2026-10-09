const crypto = require("crypto");
const ISSUER = "taller-mecanico";
function getSecret() {
  if (process.env.JWT_SECRET && Buffer.byteLength(process.env.JWT_SECRET) >= 32) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === "production") throw new Error("Configura JWT_SECRET con al menos 32 caracteres antes de iniciar el servidor.");
  if (!global.__tallerJwtDevSecret) {
    global.__tallerJwtDevSecret = crypto.randomBytes(48).toString("base64url");
    console.warn("JWT_SECRET no está configurado; se usa una clave temporal solo para desarrollo.");
  }
  return global.__tallerJwtDevSecret;
}
function base64url(value) { return Buffer.from(value).toString("base64url"); }
function emitirToken(usuario) {
  const ahora = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({ sub: String(usuario._id), email: usuario.email, rol: usuario.rol, ver: Number(usuario.tokenVersion || 0), iss: ISSUER, iat: ahora, exp: ahora + 8 * 60 * 60 }));
  const firma = crypto.createHmac("sha256", getSecret()).update(header + "." + payload).digest("base64url");
  return header + "." + payload + "." + firma;
}
function verificarToken(token) {
  if (typeof token !== "string" || token.length > 4096) throw new Error("Token inválido.");
  const partes = token.split(".");
  if (partes.length !== 3) throw new Error("Token inválido.");
  const [header, payload, firma] = partes;
  const cabecera = JSON.parse(Buffer.from(header, "base64url").toString("utf8"));
  if (cabecera.alg !== "HS256" || cabecera.typ !== "JWT") throw new Error("Token inválido.");
  const esperada = crypto.createHmac("sha256", getSecret()).update(header + "." + payload).digest();
  const recibida = Buffer.from(firma, "base64url");
  if (esperada.length !== recibida.length || !crypto.timingSafeEqual(esperada, recibida)) throw new Error("Token inválido.");
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  const ahora = Math.floor(Date.now() / 1000);
  if (claims.iss !== ISSUER || !claims.sub || !Number.isInteger(claims.exp) || claims.exp <= ahora) throw new Error("Token vencido o inválido.");
  return claims;
}
function validarConfiguracionTokens() { getSecret(); }
module.exports = { emitirToken, verificarToken, validarConfiguracionTokens };
