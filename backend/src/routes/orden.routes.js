const express = require("express");
const router = express.Router();
const c = require("../controllers/orden.controller");
const { autenticar } = require("../middleware/autenticar");
router.use(autenticar);
const { validarOrden } = require("../validations/ordenValidation");
const { validarId } = require("../validations/idValidation");

router.get("/", c.obtenerOrdenes);
router.get("/activas", c.obtenerOrdenesActivas); // antes de /:id
router.get("/:id", validarId, c.obtenerOrden);
router.post("/", validarOrden, c.crearOrden);
router.put("/:id", validarId, validarOrden, c.actualizarOrden);
router.put("/:id/estado", validarId, c.cambiarEstado);
router.delete("/:id", validarId, c.eliminarOrden);

module.exports = router;
