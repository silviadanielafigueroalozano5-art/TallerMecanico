const intentos = new Map();
function limitarIntentos(maximo = 5, ventanaMs = 15 * 60 * 1000) {
  return (req, res, next) => {
    const ahora = Date.now();
    const clave = req.ip || "desconocida";
    let estado = intentos.get(clave);
    if (!estado || ahora - estado.inicio >= ventanaMs) { estado = { inicio: ahora, cuenta: 0 }; intentos.set(clave, estado); }
    if (estado.cuenta >= maximo) return res.status(429).json({ mensaje: "Demasiadas solicitudes. Espera unos minutos antes de volver a intentar." });
    estado.cuenta += 1;
    if (intentos.size > 10000) for (const [ip, dato] of intentos) if (ahora - dato.inicio >= ventanaMs) intentos.delete(ip);
    next();
  };
}
module.exports = { limitarIntentos };
