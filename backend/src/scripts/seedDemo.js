const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const conectarDB = require("../config/database");
const Cliente = require("../models/Cliente");
const Vehiculo = require("../models/Vehiculo");
const OrdenReparacion = require("../models/OrdenReparacion");
const { sincronizarHistorialBase } = require("../controllers/orden.controller");

const clientes = [
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
  ["Lucía", "Flores"],
  ["Daniel", "Rivera"],
  ["Gabriela", "Morales"],
  ["Sebastián", "Castro"],
  ["Manuela", "Ortiz"],
  ["Alejandro", "Álvarez"],
  ["Juliana", "Jiménez"],
  ["David", "Vargas"],
  ["Sara", "Rojas"],
  ["Felipe", "Mendoza"],
  ["Paula", "Cárdenas"],
  ["Juan", "Navarro"],
  ["Antonella", "Restrepo"],
  ["Esteban", "Ospina"],
  ["Daniela", "Mejía"],
];

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
  ["Ford", "Fiesta", 2018, "Azul"],
  ["Honda", "HR-V", 2022, "Gris"],
  ["Chevrolet", "Spark", 2019, "Rojo"],
  ["Renault", "Kwid", 2021, "Blanco"],
  ["Toyota", "RAV4", 2023, "Plata"],
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
  ["Cambio de correas y mangueras", "Correa con señales de desgaste", "Cambio de correa de accesorios", "En Reparación", 460000],
  ["Reparación del sistema de escape", "Vibración en el tubo de escape", "Ajuste de soportes y uniones", "Listo", 295000],
  ["Revisión del sistema de frenos", "Pedal de freno con recorrido largo", "Inspección de frenos", "En Diagnóstico", 260000],
  ["Cambio de aceite y filtros", "Mantenimiento por kilometraje", "Cambio de aceite y filtro de aire", "Entregado", 275000],
  ["Revisión de suspensión y dirección", "Volante desviado hacia un lado", "Alineación y revisión de dirección", "En Reparación", 540000],
  ["Cambio de batería", "Vehículo no conserva la carga", "Prueba y reemplazo de batería", "Recibido", 620000],
  ["Cambio de bombillos y fusibles", "Luz trasera fuera de servicio", "Reemplazo de bombillo", "Listo", 95000],
  ["Revisión de niveles de líquidos", "Solicitud de revisión preventiva", "Verificación de niveles y fugas", "En Diagnóstico", 150000],
  ["Cambio de amortiguadores", "Rebote excesivo en carretera", "Revisión de amortiguadores traseros", "En Reparación", 870000],
  ["Mantenimiento preventivo", "Servicio programado", "Cambio de aceite e inspección general", "Recibido", 330000],
  ["Reparación básica del motor", "Pérdida de potencia al acelerar", "Diagnóstico de motor", "En Diagnóstico", 750000],
  ["Cambio de pastillas y discos", "Vibración al frenar", "Cambio de discos y pastillas", "En Reparación", 1120000],
  ["Revisión del sistema eléctrico", "Falla intermitente en luces", "Revisión de fusibles y conexiones", "Listo", 175000],
  ["Cambio de refrigerante", "Refrigerante degradado", "Lavado y llenado del sistema", "Recibido", 240000],
  ["Mantenimiento preventivo", "Servicio general por kilometraje", "Cambio de filtros y revisión de seguridad", "Entregado", 390000],
];

function fechaIngresoDiasAtras(dias) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  fecha.setHours(12, 0, 0, 0);
  return fecha;
}

function firmaOrdenDemo({ cliente, vehiculo, orden }) {
  return JSON.stringify({
    nombre: `${cliente.nombre} ${cliente.apellido}`.trim(),
    marca: vehiculo.marca,
    modelo: vehiculo.modelo,
    anio: vehiculo.anio,
    color: vehiculo.color,
    descripcionProblema: orden.descripcionProblema,
    diagnostico: orden.diagnostico,
    trabajosRealizados: orden.trabajosRealizados,
    monto: orden.monto,
  });
}

async function cargarDatosDemo() {
  await conectarDB();

  let clientesCreados = 0;
  let vehiculosCreados = 0;
  let ordenesCreadas = 0;
  const ordenesDemoExistentes = await OrdenReparacion.find()
    .populate({
      path: "vehiculo",
      select: "placa marca modelo anio color cliente",
      populate: { path: "cliente", select: "nombre apellido cedula" },
    })
    .lean();
  const firmasOrdenesDemo = new Set(
    ordenesDemoExistentes
      .filter(
        (orden) =>
          orden.vehiculo?.placa?.startsWith("DEM") &&
          orden.vehiculo.cliente?.cedula?.startsWith("990000"),
      )
      .map((orden) =>
        firmaOrdenDemo({
          cliente: orden.vehiculo.cliente,
          vehiculo: orden.vehiculo,
          orden,
        }),
      ),
  );

  for (let indice = 0; indice < clientes.length; indice += 1) {
    const numero = String(indice + 1).padStart(3, "0");
    const cedula = `990000${String(indice + 1).padStart(3, "0")}`;
    const [nombre, apellido] = clientes[indice];
    let cliente = await Cliente.findOne({ cedula });

    if (!cliente) {
      cliente = await Cliente.create({
        nombre,
        apellido,
        cedula,
        telefono: `3005550${String(indice + 1).padStart(3, "0")}`,
        email: `cliente${numero}@ejemplo.test`,
        direccion: `Calle ${10 + indice} # ${20 + indice}-${30 + indice}, Cali`,
      });
      clientesCreados += 1;
    }

    const placa = `DEM${String(indice + 1).padStart(3, "0")}`;
    let vehiculo = await Vehiculo.findOne({ placa });
    if (!vehiculo) {
      const [marca, modelo, anio, color] = vehiculos[indice];
      vehiculo = await Vehiculo.create({
        placa,
        marca,
        modelo,
        anio,
        color,
        cliente: cliente._id,
        kilometraje: 25000 + indice * 1375,
      });
      vehiculosCreados += 1;
    }

    const [descripcionProblema, diagnostico, trabajosRealizados, estado, monto] =
      ordenes[indice];
    const firma = firmaOrdenDemo({
      cliente,
      vehiculo,
      orden: { descripcionProblema, diagnostico, trabajosRealizados, monto },
    });
    const ordenExistente = await OrdenReparacion.findOne({
      vehiculo: vehiculo._id,
      descripcionProblema,
    });

    if (!ordenExistente && !firmasOrdenesDemo.has(firma)) {
      const fechaIngreso = fechaIngresoDiasAtras((indice * 3) % 25);
      const fechaEntrega = estado === "Entregado" ? fechaIngresoDiasAtras(1) : null;
      await OrdenReparacion.create({
        vehiculo: vehiculo._id,
        fechaIngreso,
        fechaEntrega,
        descripcionProblema,
        diagnostico,
        trabajosRealizados,
        estado,
        monto,
      });
      firmasOrdenesDemo.add(firma);
      ordenesCreadas += 1;
    }
  }

  for (let indice = clientes.length; indice < clientes.length + 34; indice += 1) {
    const numero = String(indice + 1).padStart(3, "0");
    const cedula = `990000${numero}`;
    const [nombre, apellido] = clientes[indice % clientes.length];
    const clienteExistente = await Cliente.findOne({ cedula });

    if (!clienteExistente) {
      await Cliente.create({
        nombre,
        apellido,
        cedula,
        telefono: `3005550${numero}`,
        email: `cliente${numero}@ejemplo.test`,
        direccion: `Calle ${10 + indice} # ${20 + indice}-${30 + indice}, Cali`,
      });
      clientesCreados += 1;
    }
  }

  for (let indice = clientes.length; indice < clientes.length + 33; indice += 1) {
    const numero = String(indice + 1).padStart(3, "0");
    const placa = `DEM${numero}`;
    const vehiculoExistente = await Vehiculo.findOne({ placa });

    if (!vehiculoExistente) {
      const cliente = await Cliente.findOne({ cedula: `990000${numero}` });
      if (!cliente) {
        throw new Error(`No se encontró el cliente demo ${numero} para asociar su vehículo.`);
      }

      const [marca, modelo, anio, color] = vehiculos[indice % vehiculos.length];
      await Vehiculo.create({
        placa,
        marca,
        modelo,
        anio,
        color,
        cliente: cliente._id,
        kilometraje: 25000 + indice * 1375,
      });
      vehiculosCreados += 1;
    }

  }

  const inicioDatosAdicionales = clientes.length + 34;
  for (let indice = inicioDatosAdicionales; indice < inicioDatosAdicionales + 100; indice += 1) {
    const numero = String(indice + 1).padStart(3, "0");
    const cedula = `990000${numero}`;
    const placa = `DEM${numero}`;
    const [nombre, apellido] = clientes[indice % clientes.length];
    let cliente = await Cliente.findOne({ cedula });

    if (!cliente) {
      cliente = await Cliente.create({
        nombre,
        apellido,
        cedula,
        telefono: `3005550${numero}`,
        email: `cliente${numero}@ejemplo.test`,
        direccion: `Calle ${10 + indice} # ${20 + indice}-${30 + indice}, Cali`,
      });
      clientesCreados += 1;
    }

    const vehiculoExistente = await Vehiculo.findOne({ placa });
    if (!vehiculoExistente) {
      const [marca, modelo, anio, color] = vehiculos[indice % vehiculos.length];
      await Vehiculo.create({
        placa,
        marca,
        modelo,
        anio,
        color,
        cliente: cliente._id,
        kilometraje: 25000 + indice * 1375,
      });
      vehiculosCreados += 1;
    }
  }

  const historialSincronizado = await sincronizarHistorialBase();
  if (!historialSincronizado) {
    throw new Error("No fue posible sincronizar el historial de las órdenes.");
  }

  console.log(
    `Datos de demostración listos: ${clientesCreados} clientes, ${vehiculosCreados} vehículos y ${ordenesCreadas} órdenes nuevos.`,
  );
}

cargarDatosDemo()
  .catch((error) => {
    console.error("No fue posible cargar los datos de demostración:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
