const Usuario = require("../models/Usuario");
const { verificarToken } = require("../security/tokens");
function extraerToken(authorization) {
  const match = String(authorization || "").match(/^Bearer ([A-Za-z0-9._~-]+)$/i);
  return match ? match[1] : null;
}
async function autenticar(req, res, next) {
  const token = extraerToken(req.get("authorization"));
  if (!token) return res.status(401).json({ mensaje: "Inicia sesión para acceder a este recurso." });
  try {
    const claims = verificarToken(token);
    const usuario = await Usuario.findOne({ _id: claims.sub, activo: true }).select("email rol tokenVersion").lean();
    if (!usuario || Number(usuario.tokenVersion || 0) !== Number(claims.ver || 0)) return res.status(401).json({ mensaje: "La sesión ya no es válida. Inicia sesión nuevamente." });
    req.usuario = usuario;
    next();
  } catch {
    return res.status(401).json({ mensaje: "La sesión venció o no es válida. Inicia sesión nuevamente." });
  }
}
function soloAdmin(req, res, next) {
  if (req.usuario?.rol !== "admin") return res.status(403).json({ mensaje: "No tienes permisos para realizar esta acción." });
  next();
}
module.exports = { autenticar, soloAdmin, extraerToken };
