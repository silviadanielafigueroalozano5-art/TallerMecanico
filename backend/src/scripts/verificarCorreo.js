const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const nodemailer = require("nodemailer");
const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "MAIL_FROM", "APP_URL"];
const missing = required.filter((key) => !String(process.env[key] || "").trim());
if (missing.length) {
  console.error("Faltan estos campos en backend/.env: " + missing.join(", "));
  process.exitCode = 1;
} else {
  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 12000,
  });
  const timeout = setTimeout(() => {
    console.error("El servidor de correo no respondió dentro de 15 segundos. Revisa la red y la configuración SMTP.");
    transporter.close();
    process.exitCode = 1;
  }, 15000);
  transporter.verify().then(() => {
    console.log("Conexión SMTP lista. Se verificó el acceso, no se envió ningún correo.");
  }).catch((error) => {
    const code = error.code || "SMTP_ERROR";
    const mensaje = code === "EAUTH" ? "Autenticación rechazada: revisa usuario y contraseña de aplicación." :
      ["ETIMEDOUT", "ECONNECTION", "ESOCKET"].includes(code) ? "No se pudo conectar al servidor SMTP; revisa host, puerto, TLS y conexión a internet." :
      "La verificación SMTP falló. Código: " + code;
    console.error(mensaje);
    process.exitCode = 1;
  }).finally(() => { clearTimeout(timeout); transporter.close(); });
}
