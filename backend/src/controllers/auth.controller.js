const Usuario = require("../models/Usuario");
const { verifyPassword } = require("../security/passwords");
const { emitirToken } = require("../security/tokens");
const { esCorreoValido } = require("../validations/email");
exports.iniciarSesion = async (req, res) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    if (!esCorreoValido(email) || password.length < 8 || password.length > 128) {
      return res.status(400).json({ mensaje: "Ingresa un correo válido y una contraseña de 8 a 128 caracteres." });
    }
    const usuario = await Usuario.findOne({ email, activo: true }).select("+passwordHash email rol tokenVersion");
    const valida = await verifyPassword(password, usuario?.passwordHash || "");
    if (!usuario || !valida) return res.status(401).json({ mensaje: "Correo o contraseña incorrectos." });
    res.json({ token: emitirToken(usuario), expiresIn: 28800, usuario: { email: usuario.email, rol: usuario.rol } });
  } catch (error) {
    console.error("Error al iniciar sesión:", error.message);
    res.status(500).json({ mensaje: "No fue posible iniciar sesión." });
  }
};
