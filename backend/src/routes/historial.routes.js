const express = require("express");
const router = express.Router();
const c = require("../controllers/historial.controller");
const { autenticar } = require("../middleware/autenticar");
router.use(autenticar);

router.get("/", c.obtenerHistorial);

module.exports = router;
