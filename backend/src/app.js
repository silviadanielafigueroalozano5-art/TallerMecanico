const express = require("express");
const cors = require("cors");
require("dotenv").config();

const conectarDB = require("./config/database");

const app = express();

app.use(cors());
app.use(express.json());

conectarDB();

app.get("/", (req, res) => {
    res.json({
        mensaje: "API del taller mecánico funcionando"
    });
});

// Rutas de la API
app.use("/api/clientes", require("./routes/cliente.routes"));
app.use("/api/vehiculos", require("./routes/vehiculo.routes"));
app.use("/api/ordenes", require("./routes/orden.routes"));

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});