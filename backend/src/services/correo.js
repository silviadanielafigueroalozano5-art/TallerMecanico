function obtenerConfiguracionCorreo() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const passOriginal = process.env.SMTP_PASS;
  const pass = host === "smtp.gmail.com" ? String(passOriginal || "").replace(/\s/g, "") : String(passOriginal || "").trim();
  const from = process.env.MAIL_FROM || user;
  const appUrl = process.env.APP_URL;
  if (!host || !Number.isInteger(port) || !user || !pass || !from || !appUrl) return null;
  let base;
  try { base = new URL(appUrl); } catch { return null; }
  if (process.env.NODE_ENV === "production" && base.protocol !== "https:") return null;
  if (!["http:", "https:"].includes(base.protocol)) return null;
  return { host, port, user, pass, from, appUrl: base.origin, secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true" };
}
async function enviarCorreoRestablecimiento(destinatario, enlace) {
  const nodemailer = require("nodemailer");
  const config = obtenerConfiguracionCorreo();
  if (!config) throw new Error("El servicio de correo no está configurado.");
  const transporte = nodemailer.createTransport({ host: config.host, port: config.port, secure: config.secure, auth: { user: config.user, pass: config.pass }, connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 15000 });
  await transporte.sendMail({
    from: config.from,
    to: destinatario,
    subject: "Restablece tu contraseña del Taller Mecánico",
    text: "Recibimos una solicitud para cambiar la contraseña de tu cuenta. Abre este enlace dentro de los próximos 30 minutos: " + enlace + " . Si no solicitaste el cambio, ignora este mensaje.",
    html: "<p>Recibimos una solicitud para cambiar la contraseña de tu cuenta.</p><p><a href=\"" + enlace + "\">Restablecer contraseña</a></p><p>El enlace vence en 30 minutos. Si no solicitaste el cambio, ignora este mensaje.</p>",
  });
}
module.exports = { obtenerConfiguracionCorreo, enviarCorreoRestablecimiento };
