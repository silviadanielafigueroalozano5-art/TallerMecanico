const { esCorreoValido } = require("./email");
const ALLOWED = new Set(["nombre", "apellido", "cedula", "telefono", "email", "direccion"]);
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
function rechazar(res, errores) { return res.status(400).json({ mensaje: "Revisa los datos del cliente.", errores }); }
function validarCliente(req, res, next) {
  const datos = req.body; const crear = req.method === "POST";
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) return rechazar(res, ["Envía los datos del cliente en formato válido."]);
  const errores = [];
  for (const campo of Object.keys(datos)) if (!ALLOWED.has(campo)) errores.push("El campo '" + campo + "' no está permitido.");
  if (!crear && !Object.keys(datos).length) errores.push("Envía al menos un dato para actualizar.");
  const salida = {};
  const texto = (campo, opciones = {}) => {
    const obligatorio = opciones.obligatorio || false; const minimo = opciones.minimo || 0; const maximo = opciones.maximo || 200;
    if (!own(datos, campo)) { if (crear && obligatorio) errores.push(campo + " es obligatorio."); return; }
    if (typeof datos[campo] !== "string") { errores.push(campo + " debe ser texto."); return; }
    const valor = datos[campo].trim();
    if (!valor && obligatorio) errores.push(campo + " es obligatorio.");
    else if (valor && valor.length < minimo) errores.push(campo + " debe tener al menos " + minimo + " caracteres.");
    else if (valor.length > maximo) errores.push(campo + " no puede superar " + maximo + " caracteres.");
    salida[campo] = valor;
  };
  texto("nombre", { obligatorio: true, minimo: 2, maximo: 80 });
  texto("apellido", { minimo: 2, maximo: 80 });
  texto("cedula", { obligatorio: true, minimo: 5, maximo: 20 });
  if (typeof datos.cedula === "string" && datos.cedula.trim() && !/^[\p{L}\p{N} .-]{5,20}$/u.test(datos.cedula.trim())) errores.push("La cédula solo puede contener letras, números, espacios, puntos o guiones.");
  texto("telefono", { obligatorio: true, minimo: 7, maximo: 24 });
  if (typeof datos.telefono === "string" && datos.telefono.trim()) {
    const tel = datos.telefono.trim(); const digitos = tel.replace(/\D/g, "");
    if (!/^[+()\d .-]+$/.test(tel) || digitos.length < 7 || digitos.length > 15) errores.push("El teléfono debe tener entre 7 y 15 dígitos y usar un formato válido.");
  }
  texto("email", { maximo: 254 });
  if (typeof datos.email === "string" && datos.email.trim()) {
    const email = datos.email.trim();
    if (!esCorreoValido(email)) errores.push("Ingresa un correo electrónico válido.");
  }
  texto("direccion", { minimo: 5, maximo: 200 });
  if (typeof datos.nombre === "string" && datos.nombre.trim() && !/^[\p{L} .'-]+$/u.test(datos.nombre.trim())) errores.push("El nombre solo puede contener letras, espacios, puntos, apóstrofes o guiones.");
  if (typeof datos.apellido === "string" && datos.apellido.trim() && !/^[\p{L} .'-]+$/u.test(datos.apellido.trim())) errores.push("El apellido contiene caracteres no válidos.");
  if (errores.length) return rechazar(res, errores);
  if (crear) { salida.apellido = salida.apellido || ""; salida.email = (salida.email || "").toLowerCase(); salida.direccion = salida.direccion || ""; }
  else if (own(salida, "email")) salida.email = salida.email.toLowerCase();
  req.body = salida; next();
}
module.exports = { validarCliente };
