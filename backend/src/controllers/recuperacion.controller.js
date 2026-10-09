const crypto = require("crypto");
const Usuario = require("../models/Usuario");
const { hashPassword } = require("../security/passwords");
const { esCorreoValido } = require("../validations/email");
const { obtenerConfiguracionCorreo, enviarCorreoRestablecimiento } = require("../services/correo");
function mensajeErrorEnvio(error) {
  const codigo = String(error.code || "").toUpperCase();
  const respuesta = Number(error.responseCode || 0);
  if (codigo === "EAUTH" || respuesta === 535) return "Gmail rechazó el acceso. Revisa SMTP_USER y usa una contraseña de aplicación de Google, no la contraseña normal de Gmail.";
  if (["ENOTFOUND", "ETIMEDOUT", "ECONNECTION", "ESOCKET", "ETLS"].includes(codigo)) return "No se pudo conectar con Gmail. Revisa que SMTP_HOST sea smtp.gmail.com, el puerto sea 587, SMTP_SECURE sea false y haya conexión a internet.";
  if (codigo === "EENVELOPE" || codigo === "EMESSAGE") return "Gmail rechazó la dirección de envío. Revisa MAIL_FROM y SMTP_USER.";
  return "No fue posible enviar el correo ahora. Revisa la configuración SMTP o contacta al administrador.";
}
const MENSAJE_SOLICITUD = "Si existe una cuenta con ese correo, enviaremos un enlace para restablecer la contraseña.";
exports.solicitarRestablecimiento = async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  if (!esCorreoValido(email)) return res.status(400).json({ mensaje: "Ingresa un correo electrónico válido." });
  if (!obtenerConfiguracionCorreo()) return res.status(503).json({ mensaje: "La recuperación por correo aún no está configurada. Contacta al administrador del taller." });
  try {
    const usuario = await Usuario.findOne({ email, activo: true });
    if (usuario) {
      const token = crypto.randomBytes(32).toString("base64url");
      usuario.resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
      usuario.resetTokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
      await usuario.save();
      const appUrl = obtenerConfiguracionCorreo().appUrl;
      const enlace = appUrl + "/restablecer-contrasena?token=" + encodeURIComponent(token);
      await enviarCorreoRestablecimiento(usuario.email, enlace);
    }
    return res.json({ mensaje: MENSAJE_SOLICITUD });
  } catch (error) {
    console.error("Error al solicitar restablecimiento:", error.code || error.name || "ERROR");
    return res.status(503).json({ mensaje: mensajeErrorEnvio(error) });
  }
};
exports.restablecerContrasena = async (req, res) => {
  const token = typeof req.body?.token === "string" ? req.body.token : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!/^[A-Za-z0-9_-]{40,50}$/.test(token)) return res.status(400).json({ mensaje: "El enlace de recuperación no es válido o ya venció." });
  if (password.length < 12 || password.length > 128) return res.status(400).json({ mensaje: "La nueva contraseña debe tener entre 12 y 128 caracteres." });
  try {
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const usuario = await Usuario.findOne({ resetTokenHash: tokenHash, resetTokenExpiresAt: { $gt: new Date() }, activo: true }).select("+resetTokenHash +resetTokenExpiresAt");
    if (!usuario) return res.status(400).json({ mensaje: "El enlace de recuperación no es válido o ya venció." });
    usuario.passwordHash = await hashPassword(password);
    usuario.tokenVersion = Number(usuario.tokenVersion || 0) + 1;
    usuario.resetTokenHash = undefined;
    usuario.resetTokenExpiresAt = undefined;
    await usuario.save();
    return res.json({ mensaje: "Contraseña actualizada. Ya puedes iniciar sesión con tu nueva contraseña." });
  } catch (error) {
    console.error("Error al restablecer contraseña:", error.message);
    return res.status(500).json({ mensaje: "No fue posible actualizar la contraseña." });
  }
};
