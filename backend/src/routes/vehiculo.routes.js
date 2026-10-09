const express = require("express");
const router = express.Router();
const c = require("../controllers/vehiculo.controller");
const { autenticar, soloAdmin } = require("../middleware/autenticar");
const { validarVehiculo, validarPlacaParam } = require("../validations/vehiculoValidation");
const { validarId } = require("../validations/idValidation");

router.use(autenticar);
router.get("/", c.obtenerVehiculos);
router.get("/placa/:placa/estado", validarPlacaParam, c.consultarEstadoPublico);
router.get("/placa/:placa", validarPlacaParam, c.buscarPorPlaca); // ¡importante declarar ANTES de /:id para que Express no confunda "placa" con un id!
router.get("/:id", validarId, c.obtenerVehiculo);
router.post("/", validarVehiculo, c.crearVehiculo);
router.put("/:id", validarId, validarVehiculo, c.actualizarVehiculo);
router.delete("/:id", validarId, soloAdmin, c.eliminarVehiculo);

module.exports = router;
