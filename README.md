# Sistema de gestión para taller mecánico

## Función principal

Registrar los vehículos que ingresan al taller, identificar a su propietario,
consultar su historial de reparaciones y hacer seguimiento al estado de cada
orden de reparación.

## Modelos y relaciones

- Cliente: propietario de uno o varios vehículos.
- Vehículo: pertenece a un único cliente.
- Orden de reparación: pertenece a un único vehículo.

Relaciones:

Cliente 1:N Vehículo  
Vehículo 1:N Orden de reparación

## Flujo principal

1. El empleado busca un vehículo por su placa.
2. Si existe, ve el propietario, el historial y puede crear una nueva orden.
3. Si no existe, registra primero el cliente, después el vehículo y finalmente la orden.
4. La orden avanza por estos estados:

   Recibido → En Diagnóstico → En Reparación → Listo → Entregado

## Datos por definir

### Cliente

- nombre
- apellido
- teléfono
- email
- dirección

### Vehículo

- placa
- marca
- modelo
- año
- color
- cliente

### Orden de reparación

- vehículo
- fecha de ingreso
- fecha de entrega
- descripción del problema
- diagnóstico
- trabajos realizados
- monto
- estado

## Arquitectura implementada

### Backend

API REST con Express y MongoDB/Mongoose, organizada en MVC:

- `backend/src/models`: esquemas y persistencia de datos.
- `backend/src/controllers`: lógica de cada operación HTTP.
- `backend/src/routes`: definición de endpoints y asociación con controladores.
- `backend/src/config/database.js`: conexión a MongoDB.
- `backend/src/app.js`: configuración de Express y arranque después de conectar la base de datos.

### Frontend

Aplicación Vue 3 con Vite y Quasar:

- Vue Router define las rutas de búsqueda, ficha, creación de órdenes y seguimiento.
- Pinia concentra el estado y las acciones de gestión del taller.
- `pinia-plugin-persistedstate` conserva únicamente la preferencia de búsqueda; no guarda cédulas ni otros datos personales en el navegador.
- Axios centraliza las llamadas HTTP, el tiempo de espera y el manejo de errores de la API.
- Quasar se registra como plugin de Vue y sus estilos e iconos se importan desde `frontend/src/main.js`.
- La compilación de producción deja el JavaScript sin minificar para facilitar su lectura en `frontend/dist/assets` (el archivo resultante es más grande que uno optimizado para producción).

## Configuración y ejecución

1. En MongoDB Atlas, crea un usuario de base de datos y permite la IP de tu aplicación en **Network Access**. En el clúster, selecciona **Connect → Drivers → Node.js** y copia la URI `mongodb+srv`.
2. Copia `backend/.env.example` a `backend/.env` y reemplaza en `MONGO_URI` `<usuario>`, `<password>` y `<cluster-url>` con los valores de Atlas. Conserva `/taller_mecanico` como nombre de base de datos y los parámetros de conexión. Si la contraseña contiene caracteres especiales, codifícala para URL. No subas `backend/.env` al repositorio ni compartas la contraseña. Opcionalmente, ajusta `PORT` y `FRONTEND_URL`.
3. Desde `backend`, instala dependencias y arranca la API:

   ```powershell
   npm install
   npm run dev
   ```

4. En otra terminal, desde `frontend`, instala dependencias y arranca la aplicación:

   ```powershell
   npm install
   npm run dev
   ```

Vite redirige `/api` a `http://localhost:4000` durante el desarrollo. Para otra URL de API, configura `VITE_API_URL` según `frontend/.env.example`.

## Rutas de la aplicación

- `/` — búsqueda por placa o cédula y registro.
- `/vehiculos/:placa` — ficha del vehículo e historial.
- `/ordenes/nueva/:placa` — formulario de nueva orden.
- `/seguimiento` — tablero de órdenes activas.

## Endpoints principales

- `GET /api/clientes/cedula/:cedula`
- `GET /api/clientes/cedula/:cedula/estado` — consulta vehículos y estado actual sin devolver datos personales del propietario.
- `POST /api/clientes`
- `GET /api/vehiculos/placa/:placa`
- `POST /api/vehiculos`
- `GET /api/ordenes/activas`
- `POST /api/ordenes`
- `PUT /api/ordenes/:id/estado`