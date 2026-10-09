const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const readline = require("readline/promises");
const { stdin, stdout } = require("process");
const mongoose = require("mongoose");
const conectarDB = require("../config/database");
const Usuario = require("../models/Usuario");
const { hashPassword } = require("../security/passwords");
const { esCorreoValido } = require("../validations/email");
function preguntar(mensaje) {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  return rl.question(mensaje).finally(() => rl.close());
}
function preguntarSecreto(mensaje) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") throw new Error("Ejecuta este comando en una terminal interactiva para ingresar la contraseña de forma oculta.");
  stdout.write(mensaje);
  stdin.setRawMode(true);
  stdin.resume();
  return new Promise((resolve, reject) => {
    let valor = "";
    const finalizar = (error) => {
      stdin.removeListener("data", alDato);
      stdin.setRawMode(false);
      stdout.write("\n");
      if (error) reject(error); else resolve(valor);
    };
    const alDato = (dato) => {
      for (const caracter of dato.toString("utf8")) {
        if (caracter === "\u0003") return finalizar(new Error("Operación cancelada."));
        if (caracter === "\r" || caracter === "\n") return finalizar();
        if (caracter === "\u007f" || caracter === "\b") { valor = valor.slice(0, -1); stdout.write("\b \b"); continue; }
        if (caracter >= " ") { valor += caracter; stdout.write("*"); }
      }
    };
    stdin.on("data", alDato);
  });
}
(async () => {
  try {
    const email = (await preguntar("Correo del usuario: ")).trim().toLowerCase();
    const password = await preguntarSecreto("Contraseña (mínimo 12 caracteres, entrada oculta): ");
    const rolIngresado = (await preguntar("Rol [admin/operario] (admin): ")).trim().toLowerCase();
    const rol = rolIngresado || "admin";
    if (!esCorreoValido(email)) throw new Error("Correo inválido.");
    if (password.length < 12 || password.length > 128) throw new Error("La contraseña debe tener entre 12 y 128 caracteres.");
    if (!["admin", "operario"].includes(rol)) throw new Error("El rol debe ser admin u operario.");
    await conectarDB();
    const passwordHash = await hashPassword(password);
    await Usuario.create({ email, passwordHash, rol });
    console.log("Usuario creado. Ya puedes iniciar sesión.");
  } catch (error) {
    console.error("No se pudo crear el usuario:", error.code === 11000 ? "Ese correo ya está registrado." : error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState) await mongoose.disconnect();
  }
})();
