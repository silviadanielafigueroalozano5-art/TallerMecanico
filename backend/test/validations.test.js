const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const { validarCliente } = require("../src/validations/clienteValidation");
const { validarVehiculo, normalizarPlaca, validarPlacaParam } = require("../src/validations/vehiculoValidation");
const { validarOrden } = require("../src/validations/ordenValidation");
const { validarId } = require("../src/validations/idValidation");
const { esCorreoValido } = require("../src/validations/email");
const Cliente = require("../src/models/Cliente");
const Vehiculo = require("../src/models/Vehiculo");
const Orden = require("../src/models/OrdenReparacion");
const { ESTADOS, puedeAvanzar } = require("../src/domain/ordenRules");
function ejecutar(middleware, { method = "POST", body = {}, params = { id: new mongoose.Types.ObjectId().toString() } } = {}) {
  const req = { method, body, params }; const salida = { statusCode: 200, payload: null, nextCalled: false };
  const res = { status(code) { salida.statusCode = code; return this; }, json(payload) { salida.payload = payload; return this; } };
  middleware(req, res, () => { salida.nextCalled = true; }); salida.req = req; return salida;
}
test("client accepts normalized valid data and optional blank email", () => {
  const r = ejecutar(validarCliente, { body: { nombre: " Ana María ", cedula: "12345", telefono: "+57 300 555 1234", email: "" } });
  assert.equal(r.nextCalled, true); assert.equal(r.req.body.nombre, "Ana María"); assert.equal(r.req.body.email, "");
});
test("client rejects missing required fields, malformed email, and unsupported fields", () => {
  for (const body of [{ nombre: "Ana", telefono: "3005551234" }, { nombre: "Ana", cedula: "12345", telefono: "3005551234", email: "ana@@correo.com" }, { nombre: "Ana", cedula: "12345", telefono: "3005551234", admin: true }]) {
    const r = ejecutar(validarCliente, { body }); assert.equal(r.nextCalled, false); assert.equal(r.statusCode, 400); assert.ok(r.payload.errores.length);
  }
});
test("client allows partial updates but rejects empty required values", () => {
  assert.equal(ejecutar(validarCliente, { method: "PUT", body: { email: "a@b.co" } }).nextCalled, true);
  assert.equal(ejecutar(validarCliente, { method: "PUT", body: { nombre: " " } }).statusCode, 400);
});
test("vehicle canonicalizes plates and requires an existing-owner id and mileage", () => {
  const id = new mongoose.Types.ObjectId().toString();
  const valid = ejecutar(validarVehiculo, { body: { placa: "abc-123", marca: "Mazda", modelo: "3", anio: 2020, cliente: id, kilometraje: 45000 } });
  assert.equal(valid.nextCalled, true); assert.equal(valid.req.body.placa, "ABC123");
  assert.equal(normalizarPlaca(" abc-123 "), "ABC123");
  assert.equal(ejecutar(validarVehiculo, { body: { placa: "ABC123", marca: "Mazda", modelo: "3", anio: 2020, cliente: "fake", kilometraje: -2 } }).statusCode, 400);
  assert.equal(ejecutar(validarVehiculo, { body: { placa: "ABC123", marca: "Mazda", modelo: "3", anio: 2020, cliente: id } }).statusCode, 400);
});
test("order requires a registered vehicle reference, description, and nonnegative item costs", () => {
  const id = new mongoose.Types.ObjectId().toString();
  const valid = ejecutar(validarOrden, { body: { vehiculo: id, descripcionProblema: "Falla de frenos", costoRepuestos: "120000", manoObra: 80000 } });
  assert.equal(valid.nextCalled, true); assert.equal(valid.req.body.estado, "Recibido"); assert.equal(valid.req.body.costoRepuestos, 120000);
  for (const body of [{ vehiculo: "bad", descripcionProblema: "Falla de frenos" }, { vehiculo: id, descripcionProblema: "x" }, { vehiculo: id, descripcionProblema: "Falla de frenos", manoObra: -1 }, { vehiculo: id, descripcionProblema: "Falla de frenos", estado: "Entregado" }, { vehiculo: id, descripcionProblema: "Falla de frenos", monto: 100 }]) assert.equal(ejecutar(validarOrden, { body }).statusCode, 400);
});
test("order update cannot change ownership or state", () => {
  const id = new mongoose.Types.ObjectId().toString();
  assert.equal(ejecutar(validarOrden, { method: "PUT", body: { costoRepuestos: 100 } }).nextCalled, true);
  assert.equal(ejecutar(validarOrden, { method: "PUT", body: { estado: "Entregado" } }).statusCode, 400);
  assert.equal(ejecutar(validarOrden, { method: "PUT", body: { vehiculo: id } }).statusCode, 400);
});
test("resource IDs are rejected before database access when malformed", () => {
  assert.equal(ejecutar(validarId, { params: { id: "not-an-id" } }).statusCode, 400);
  assert.equal(ejecutar(validarId).nextCalled, true);
});
test("order state only moves one step toward delivery", () => {
  assert.equal(ESTADOS.length, 5); assert.equal(puedeAvanzar("Recibido", "En Diagnóstico"), true);
  assert.equal(puedeAvanzar("Recibido", "Listo"), false); assert.equal(puedeAvanzar("Entregado", "Recibido"), false);
});
test("database schemas reject invalid email and missing vehicle mileage; calculate order total", async () => {
  await assert.rejects(new Cliente({ nombre: "Ana", cedula: "12345", telefono: "3005551234", email: "no-es-correo" }).validate());
  await assert.rejects(new Vehiculo({ placa: "ABC123", marca: "Mazda", modelo: "3", anio: 2020, cliente: new mongoose.Types.ObjectId() }).validate());
  const orden = new Orden({ vehiculo: new mongoose.Types.ObjectId(), descripcionProblema: "Falla de frenos", costoRepuestos: 120000, manoObra: 80000 });
  await orden.validate(); assert.equal(orden.monto, 200000);
});

test("email validator rejects malformed local parts and domains", () => {
  assert.equal(esCorreoValido("ana.perez+auto@taller.co"), true);
  for (const email of ["ana..perez@taller.co", ".ana@taller.co", "ana@-taller.co", "ana@taller.c", "ana@@taller.co", "ana@taller.co "]) assert.equal(esCorreoValido(email), false, email);
});
test("plate route rejects invalid characters and accepts formatted plates", () => {
  const invalid = ejecutar(validarPlacaParam, { params: { placa: ".*" } });
  assert.equal(invalid.statusCode, 400);
  const valid = ejecutar(validarPlacaParam, { params: { placa: "abc-123" } });
  assert.equal(valid.nextCalled, true); assert.equal(valid.req.params.placa, "ABC123");
});
