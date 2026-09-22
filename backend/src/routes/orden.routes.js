const express = require("express");
const router = express.Router();
const c = require("../controllers/orden.controller");

router.get("/", c.obtenerOrdenes);
router.get("/activas", c.obtenerOrdenesActivas); // antes de /:id
router.get("/:id", c.obtenerOrden);
router.post("/", c.crearOrden);
router.put("/:id", c.actualizarOrden);
router.put("/:id/estado", c.cambiarEstado);
router.delete("/:id", c.eliminarOrden);

module.exports = router;
