const path = require("path");
const { randomInt } = require("crypto");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const conectarDB = require("./config/database");
const Cliente = require("./models/Cliente");
const Vehiculo = require("./models/Vehiculo");
const OrdenReparacion = require("./models/OrdenReparacion");

const CANTIDAD = 40;

const nombres = [
  ["Laura", "Gómez"],
  ["Andrés", "Rodríguez"],
  ["Camila", "Martínez"],
  ["Santiago", "López"],
  ["Valentina", "Hernández"],
  ["Mateo", "García"],
  ["Isabella", "Pérez"],
  ["Nicolás", "Sánchez"],
  ["Mariana", "Ramírez"],
  ["Samuel", "Torres"],
];

const apellidos = ["Gómez", "Rodríguez", "Martínez", "López"];

const vehiculos = [
  ["Toyota", "Corolla", 2021, "Gris"],
  ["Chevrolet", "Onix", 2022, "Blanco"],
  ["Renault", "Duster", 2020, "Rojo"],
  ["Mazda", "3", 2023, "Azul"],
  ["Kia", "Picanto", 2019, "Negro"],
  ["Nissan", "Versa", 2022, "Plata"],
  ["Hyundai", "Tucson", 2021, "Blanco"],
  ["Suzuki", "Swift", 2020, "Rojo"],
  ["Volkswagen", "Polo", 2023, "Gris"],
  ["Ford", "Escape", 2019, "Azul"],
  ["Honda", "Civic", 2022, "Negro"],
  ["Chevrolet", "Tracker", 2021, "Plata"],
  ["Renault", "Logan", 2018, "Blanco"],
  ["Toyota", "Yaris", 2020, "Rojo"],
  ["Mazda", "CX-30", 2023, "Gris"],
  ["Kia", "Sportage", 2022, "Azul"],
  ["Nissan", "March", 2019, "Blanco"],
  ["Hyundai", "Accent", 2021, "Plata"],
  ["Suzuki", "Vitara", 2020, "Verde"],
  ["Volkswagen", "T-Cross", 2023, "Negro"],
];

const variantesReparacion = [
  "por mantenimiento preventivo",
  "por desgaste de componentes",
  "por falla reportada",
  "por inspección técnica",
];

const ordenes = [
  ["Cambio de aceite y filtros", "Aceite del motor vencido", "Cambio de aceite y filtros", "Recibido", 280000],
  ["Revisión del sistema de frenos", "Pastillas delanteras desgastadas", "Inspección y ajuste de frenos", "En Diagnóstico", 420000],
  ["Revisión y cambio de batería", "Batería con carga baja", "Prueba del sistema de carga", "En Reparación", 510000],
  ["Cambio de llantas", "Desgaste irregular en las llantas", "Alineación y balanceo", "En Reparación", 1250000],
  ["Cambio de pastillas de freno", "Pastillas próximas al límite", "Cambio de pastillas delanteras", "Listo", 390000],
  ["Revisión del sistema eléctrico", "Luz de tablero intermitente", "Diagnóstico del circuito eléctrico", "Recibido", 180000],
  ["Mantenimiento preventivo", "Revisión periódica del vehículo", "Inspección general y cambio de filtros", "En Diagnóstico", 350000],
  ["Cambio de amortiguadores", "Ruido en la suspensión delantera", "Revisión de suspensión", "En Reparación", 980000],
  ["Cambio de bujías", "Dificultad al encender el motor", "Instalación de bujías nuevas", "Entregado", 310000],
  ["Revisión del sistema de refrigeración", "Nivel de refrigerante bajo", "Prueba de fugas del sistema", "Recibido", 220000],
];

function crearPlacas() {
  return Array.from({ length: CANTIDAD }, (_, indice) => {
    const letras = Array.from({ length: 3 }, () =>
      String.fromCharCode(randomInt(65, 91)),
    ).join("");
    return `${letras}${String(indice + 1).padStart(3, "0")}`;
  });
}

async function obtenerPlacasDisponibles() {
  for (let intento = 0; intento < 10; intento += 1) {
    const placas = crearPlacas();
    const placaExistente = await Vehiculo.exists({ placa: { $in: placas } });
    if (!placaExistente) {
      return placas;
    }
  }

  throw new Error("No se pudieron generar placas únicas para el lote.");
}

async function insertarDatosMasivos() {
  await conectarDB();

  const identificadorLote = `${Date.now()}${randomInt(100000, 1000000)}`;
  const clientes = Array.from({ length: CANTIDAD }, (_, indice) => {
    const [nombre] = nombres[indice % nombres.length];
    const apellido = apellidos[Math.floor(indice / nombres.length)];
    const numero = String(indice + 1).padStart(3, "0");

    return {
      nombre,
      apellido,
      cedula: `98${identificadorLote}${numero}`,
      telefono: `300${identificadorLote.slice(-7)}${numero}`,
      email: `masivo.${identificadorLote}.${numero}@ejemplo.test`,
      direccion: `Calle ${10 + indice} # ${20 + indice}-${30 + indice}, Cali`,
    };
  });
  const clientesInsertados = await Cliente.insertMany(clientes);

  const placas = await obtenerPlacasDisponibles();
  const vehiculosInsertar = Array.from({ length: CANTIDAD }, (_, indice) => {
    const [marca, modelo, anio, color] = vehiculos[indice % vehiculos.length];

    return {
      placa: placas[indice],
      marca,
      modelo,
      anio,
      color,
      cliente: clientesInsertados[indice]._id,
    };
  });
  const vehiculosInsertados = await Vehiculo.insertMany(vehiculosInsertar);

  const ordenesInsertar = Array.from({ length: CANTIDAD }, (_, indice) => {
    const [
      descripcionProblema,
      diagnostico,
      trabajosRealizados,
      estado,
      monto,
    ] = ordenes[indice % ordenes.length];
    const variante =
      variantesReparacion[Math.floor(indice / ordenes.length)];

    return {
      vehiculo: vehiculosInsertados[indice]._id,
      descripcionProblema: `${descripcionProblema} ${variante}`,
      diagnostico: `${diagnostico}; ${variante}`,
      trabajosRealizados: `${trabajosRealizados}; prueba de funcionamiento y revisión final`,
      estado,
      monto: monto + indice * 1500,
      fechaEntrega: estado === "Entregado" ? new Date() : null,
    };
  });
  const ordenesInsertadas = await OrdenReparacion.insertMany(ordenesInsertar);

  console.log(
    `Carga masiva completada: ${clientesInsertados.length} clientes, ` +
      `${vehiculosInsertados.length} vehículos y ${ordenesInsertadas.length} órdenes ` +
      `(${clientesInsertados.length + vehiculosInsertados.length + ordenesInsertadas.length} documentos).`,
  );
}

insertarDatosMasivos()
  .catch((error) => {
    console.error("No fue posible insertar los datos masivos:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
