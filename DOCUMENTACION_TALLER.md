# Taller Mecánico

## Qué hace

Aplicación para administrar clientes, vehículos y reparaciones de un taller. El personal puede buscar vehículos, crear órdenes, registrar abonos y consultar el historial.

## Tecnologías

- Interfaz: Vue 3.5.43, Quasar 2.34.0 y Vite 8.3.0.
- Servidor: Node.js y Express.
- Base de datos: MongoDB con Mongoose.

Las versiones del frontend están fijadas en frontend/package.json y frontend/package-lock.json. El proyecto usa Vue 3; no usa Vue 2.

Las pantallas están en archivos Vue. Sus plantillas usan componentes Quasar y también algunas etiquetas nativas. frontend/index.html es la entrada que Vite necesita para iniciar la aplicación; las pantallas se construyen en Vue.

## Funciones principales

- Iniciar sesión y recuperar la contraseña.
- Buscar clientes por cédula y vehículos por placa.
- Registrar y editar clientes y vehículos.
- Crear órdenes de reparación, actualizar su avance y registrar abonos.
- Consultar órdenes activas, historial y vehículos entregados.
- Eliminar clientes o vehículos cuando no tengan registros relacionados que deban conservarse.

La opción de activar o desactivar clientes y vehículos fue retirada. Los vehículos muestran el estado de reparación de su orden más reciente.

## Archivos principales

| Archivo | Para qué sirve |
|---|---|
| frontend/src/views/LoginView.vue | Inicio de sesión. |
| frontend/src/views/BusquedaPlacaView.vue | Pantalla principal del taller. |
| frontend/src/components/GestorClientesModal.vue | Gestión de clientes y vehículos. |
| frontend/src/components/EditorClienteVehiculo.vue | Edición de clientes y vehículos. |
| frontend/src/utils/useGestionClientes.js | Lógica de la gestión de clientes y vehículos. |
| frontend/src/services/api.js | Comunicación entre la interfaz y el servidor. |
| frontend/src/main.js | Inicio de Vue, Quasar, Pinia y el router. |
| frontend/index.html | Entrada que Vite usa para cargar la aplicación. |
| backend/src/app.js | Configuración y arranque del servidor. |
| backend/src/routes/ | Rutas de la API. |
| backend/src/controllers/ | Reglas y operaciones del taller. |
| backend/src/models/ | Estructura de los datos guardados en MongoDB. |

## Cómo funciona una reparación

1. Busca un vehículo por placa o a su propietario por cédula.
2. Registra el cliente y el vehículo si aún no existen.
3. Crea una orden para el vehículo.
4. Actualiza el estado de la orden a medida que avanza el trabajo.
5. Registra los abonos. La orden solo se puede marcar como entregada cuando está pagada.

Los datos se guardan en MongoDB. La interfaz envía las solicitudes al servidor, y el servidor valida los datos antes de guardarlos.

## Rutas principales

- Inicio de sesión: POST /api/auth/login.
- Recuperar contraseña: POST /api/auth/forgot-password y POST /api/auth/reset-password.
- Clientes: /api/clientes.
- Vehículos: /api/vehiculos.
- Órdenes: /api/ordenes.
- Historial: /api/historial.

Las rutas de clientes, vehículos, órdenes e historial requieren iniciar sesión. Solo un administrador puede eliminar clientes o vehículos.

## Preparar el proyecto

Se necesita Node.js y MongoDB. Crea el archivo backend/.env con la configuración del servidor:

- MONGO_URI: dirección de conexión a MongoDB.
- JWT_SECRET: clave secreta de al menos 32 caracteres.
- FRONTEND_URL: dirección permitida para la interfaz, si se limita CORS.
- PORT: puerto del servidor; por defecto es 4000.
- SMTP_HOST, SMTP_PORT, SMTP_USER y SMTP_PASS: datos del correo para recuperar contraseñas.
- APP_URL: dirección pública de la aplicación, necesaria para crear enlaces de recuperación.
- MAIL_FROM y SMTP_SECURE: opcionales; permiten definir el remitente y la conexión segura del correo.

## Iniciar en desarrollo

Abre una terminal para el servidor:

1. Entra a backend.
2. Ejecuta npm install.
3. Ejecuta npm run dev.

Abre otra terminal para la interfaz:

1. Entra a frontend.
2. Ejecuta npm install.
3. Ejecuta npm run dev.

El servidor usa el puerto 4000 por defecto. Vite usa el puerto 5173 y reenvía las solicitudes /api al servidor local.

## Otros comandos útiles

Desde backend:

- npm start: iniciar el servidor sin Nodemon.
- npm run usuario:crear: crear un usuario desde la terminal.
- npm run correo:verificar: comprobar la configuración del correo.
- npm test: ejecutar las pruebas del servidor.

Desde frontend:

- npm run build: crear la versión de producción.
- npm run preview: abrir una vista previa de esa versión.
