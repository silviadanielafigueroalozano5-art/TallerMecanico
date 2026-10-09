const mongoose = require("mongoose");
function validarId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ mensaje: "El identificador solicitado no es válido." });
  next();
}
module.exports = { validarId };
