# Documentación completa del proyecto Taller Mecánico

## 1. Visión general

Este proyecto está compuesto por dos capas:

- Frontend: Vue 3 + Vite + Pinia + Vue Router
- Backend: Node.js + Express + MongoDB + Mongoose

La aplicación permite:

- iniciar sesión con JWT
- registrar clientes y vehículos
- crear órdenes de trabajo
- actualizar estados de reparación
- visualizar seguimiento por columnas
- consultar historial y entregados
- recuperar contraseña por correo electrónico

## 1.1 Requisitos previos para correrlo desde cero

Antes de instalar dependencias necesitas tener lo siguiente:

- Node.js LTS instalado
- npm o pnpm disponible desde la terminal
- MongoDB local corriendo o un Mongo Atlas con una URI válida
- acceso a un servicio SMTP real para la recuperación de contraseñas
- una cuenta Gmail con contraseña de aplicación si se usa Gmail

### 1.1.1 MongoDB local

Si se trabaja en local, el servicio MongoDB debe arrancarse antes que el backend. En Windows con MongoDB local, lo más común es:

```powershell
mongod
```

Si MongoDB está instalado como servicio, normalmente ya queda activo al iniciar el sistema. En ese caso, basta con verificar que el puerto 27017 responda.

### 1.1.2 Gmail y contraseña de aplicación

Para que la recuperación de contraseña funcione, el proyecto usa Nodemailer con SMTP. Si se usa Gmail, no se debe usar la contraseña normal de la cuenta, sino una contraseña de aplicación de Google.

Esto es necesario porque Gmail bloquea las conexiones inseguras o las credenciales normales para aplicaciones no oficiales.

---

## 1.2 Instalación real y reproducible del proyecto

La decisión de usar esta stack no fue al azar. La idea fue separar bien la app en dos partes claras:

- frontend: solo interfaz, navegación y consumo de API
- backend: autenticación, lógica de negocio, seguridad, validación y base de datos

Esto permite mantener el proyecto limpio, ordenado y escalable.

### 1.2.1 Backend

Se creó la parte de API en Node.js con Express y MongoDB. Los comandos de instalación reales que se ejecutan para dejarlo listo son estos:

```powershell
cd D:\TallerMecanico.1.4\TallerMecanico\TallerMecanico\backend
npm init -y
npm install express cors dotenv mongoose nodemailer
npm install --save-dev nodemon
```

#### ¿Por qué estas librerías?

- `express`: para levantar la API REST y manejar rutas, middleware y controladores
- `cors`: porque el frontend se ejecuta en un puerto diferente y necesita acceso a la API
- `dotenv`: para leer variables de entorno como `MONGO_URI`, `JWT_SECRET` y SMTP
- `mongoose`: para conectar y modelar datos en MongoDB de forma ordenada
- `nodemailer`: para enviar correos de recuperación de contraseña
- `nodemon`: para acelerar el desarrollo sin reiniciar el servidor manualmente cada vez

### 1.2.2 Frontend

Se creó la parte visual con Vue 3 y Vite. Los comandos reales para dejarlo listo son:

```powershell
cd D:\TallerMecanico.1.4\TallerMecanico\TallerMecanico\frontend
npm create vite@latest . -- --template vue
npm install vue-router pinia pinia-plugin-persistedstate axios quasar @quasar/extras
npm install -D vite @vitejs/plugin-vue @quasar/vite-plugin sass-embedded
```

#### ¿Por qué estas librerías?

- `vue`: framework para construir la UI y el flujo de componentes
- `vite`: servidor de desarrollo rápido y build de producción eficiente
- `vue-router`: para manejar rutas privadas y públicas
- `pinia`: para guardar el estado de autenticación y la sesión actual
- `pinia-plugin-persistedstate`: para conservar los datos del usuario en el navegador
- `axios`: para comunicar el frontend con el backend sin complicaciones
- `quasar`: para un sistema visual más profesional, consistente y modular
- `@quasar/extras`: para iconos y recursos visuales del diseño
- `sass-embedded`: para estilos más ordenados y mantenibles

### 1.2.3 Variables de entorno necesarias

Después de instalar dependencias, el proyecto necesita un archivo `.env` dentro del backend. La configuración mínima es:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/taller
JWT_SECRET=tu_clave_muy_segura
FRONTEND_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_usuario@gmail.com
SMTP_PASS=tu_contraseña_de_aplicacion
MAIL_FROM=tu_usuario@gmail.com
APP_URL=http://localhost:5173
```

Esto se hace así porque la API necesita conectarse a MongoDB, firmar tokens JWT y enviar correos para recuperación de contraseña. Sin esos valores, el sistema no puede autenticar a usuarios ni restablecer contraseñas.

### 1.2.4 Comandos reales para arrancar el proyecto

#### 1. Iniciar MongoDB local

```powershell
mongod
```

#### 2. Iniciar backend

```powershell
cd D:\TallerMecanico.1.4\TallerMecanico\TallerMecanico\backend
npm run dev
```

#### 3. Iniciar frontend

```powershell
cd D:\TallerMecanico.1.4\TallerMecanico\TallerMecanico\frontend
npm run dev -- --host 0.0.0.0
```

La razón de usar `--host 0.0.0.0` es que permite que el proyecto sea accesible desde la red local o desde un entorno de prueba más externo, no solo desde localhost del equipo.

### 1.2.5 Puertos y detalle de arranque

En desarrollo, normalmente quedan así:

- backend: http://localhost:4000
- frontend: http://localhost:5173

Sin embargo, si el puerto 5173 está ocupado, Vite automáticamente puede subir en 5174 o 5175. Por eso en algún momento se observó que la app estaba en un puerto alternativo. Eso no fue un error del código, sino un conflicto de puertos del entorno local.

### 1.2.6 Por qué esta estructura fue la correcta

Se eligió esta arquitectura porque:

- el frontend no debería manejar lógica de negocio ni acceso directo a la base de datos
- el backend debe centralizar seguridad y validaciones
- Vue + Vite permite una interfaz muy ágil y moderna
- Express + Mongoose es una combinación ligera y muy potente para una API REST de taller
- separar rutas, modelos, middleware y servicios hace más fácil mantener y ampliar la app
- la separación frontend/backend permite que el sistema sea más seguro y más limpio a nivel de mantenimiento

En resumen, se eligió una arquitectura moderna y limpia para que el proyecto pueda crecer sin volver todo un caos.

---

## 2. Estructura del proyecto

### Frontend

```text
frontend/
├─ index.html
├─ package.json
├─ vite.config.js
├─ public/
├─ src/
│  ├─ App.vue
│  ├─ main.js
│  ├─ style.css
│  ├─ components/
│  │  ├─ ActualizarEstadoOrden.vue
│  │  ├─ RegistroClienteForm.vue
│  │  ├─ RegistroOrdenForm.vue
│  │  └─ RegistroVehiculoForm.vue
│  ├─ router/
│  │  └─ index.js
│  ├─ services/
│  │  └─ api.js
│  ├─ stores/
│  │  ├─ auth.js
│  │  └─ workshop.js
│  ├─ utils/
│  │  └─ validation.js
│  └─ views/
│     ├─ BusquedaPlacaView.vue
│     ├─ LoginView.vue
│     └─ RecuperarContrasenaView.vue
```

### Backend

```text
backend/
├─ package.json
├─ src/
│  ├─ app.js
│  ├─ seedDemo.js
│  ├─ seedMasivo.js
│  ├─ config/
│  │  └─ database.js
│  ├─ controllers/
│  │  ├─ auth.controller.js
│  │  ├─ cliente.controller.js
│  │  ├─ historial.controller.js
│  │  ├─ orden.controller.js
│  │  ├─ recuperacion.controller.js
│  │  └─ vehiculo.controller.js
│  ├─ domain/
│  │  └─ ordenRules.js
│  ├─ middleware/
│  │  ├─ autenticar.js
│  │  └─ limitarIntentos.js
│  ├─ models/
│  │  ├─ Cliente.js
│  │  ├─ Historial.js
│  │  ├─ OrdenReparacion.js
│  │  ├─ Usuario.js
│  │  └─ Vehiculo.js
│  ├─ routes/
│  │  ├─ auth.routes.js
│  │  ├─ cliente.routes.js
│  │  ├─ historial.routes.js
│  │  ├─ orden.routes.js
│  │  └─ vehiculo.routes.js
│  ├─ scripts/
│  │  ├─ crearUsuario.js
│  │  └─ verificarCorreo.js
│  ├─ security/
│  │  ├─ passwords.js
│  │  └─ tokens.js
│  ├─ services/
│  │  └─ correo.js
│  ├─ validations/
│  │  ├─ email.js
│  │  └─ validations/
│  │     ├─ clienteValidation.js
│  │     ├─ idValidation.js
│  │     ├─ index.js
│  │     ├─ ordenValidation.js
│  │     └─ vehiculoValidation.js
│  └─ tests/
│     ├─ auth-middleware.test.js
│     ├─ auth-routes.test.js
│     ├─ auth-security.test.js
│     ├─ auth-version.test.js
│     └─ validations.test.js
```

---

## 3. Librerías y dependencias utilizadas

### Backend

#### Producción

- `express` v5.2.1
  - servidor HTTP y routing de la API
- `mongoose` v9.10.3
  - ODM para MongoDB
- `dotenv` v18.0.3
  - carga variables de entorno desde `.env`
- `cors` v2.8.6
  - habilita acceso cruzado desde el frontend
- `nodemailer` v7.0.13
  - envío de correos para recuperación de contraseña

#### Desarrollo

- `nodemon` v3.1.14
  - reinicio automático del servidor al detectar cambios

#### Scripts del backend

- `npm run dev` → inicia el backend con nodemon
- `npm run start` → inicia directamente con Node
- `npm run seed:demo` → carga datos de demostración
- `npm run seed:masivo` → carga datos masivos
- `npm run usuario:crear` → crea un usuario inicial manualmente
- `npm run correo:verificar` → verifica la configuración SMTP/Gmail
- `npm test` → corre la suite de pruebas

### Frontend

#### Producción

- `vue` v3.5.42
  - framework principal para UI
- `vue-router` v5.3.1
  - gestión de rutas internas
- `pinia` v4.0.3
  - estado global de autenticación
- `pinia-plugin-persistedstate` v4.7.1
  - persistencia del estado en navegador
- `axios` v1.20.0
  - cliente HTTP para conectar con la API
- `quasar` v2.34.0
  - componente y utilidades visuales; también se usa `@quasar/extras`

#### Desarrollo

- `vite` v8.3.0
  - servidor de desarrollo y build
- `@vitejs/plugin-vue` v6.0.8
  - integración de Vue con Vite
- `@quasar/vite-plugin` v2.0.2
  - integración de Quasar con Vite
- `sass-embedded` v1.93.2
  - soporte de estilos SCSS/Sass

#### Scripts del frontend

- `npm run dev` → levanta Vite en modo desarrollo
- `npm run build` → genera build de producción
- `npm run preview` → vista previa del build

---

## 4. Cómo está organizada la arquitectura

### Frontend

#### `src/main.js`

Es el punto de entrada principal:

- crea la instancia de Vue
- conecta Pinia
- conecta Vue Router
- monta la app
- inicializa Quasar

#### `src/stores/auth.js`

Store central para autenticación:

- guarda token en `sessionStorage`
- guarda usuario autenticado
- expone `isAuthenticated`
- acción `login()` para iniciar sesión
- acción `logout()` para cerrar sesión

#### `src/services/api.js`

Es el adaptador de la API frontend:

- crea un cliente Axios con base URL configurable
- agrega el header `Authorization: Bearer ...`
- maneja errores HTTP
- redirige a `/login` si llega un 401 no autorizado
- expone funciones como:
  - `iniciarSesionApi`
  - `crearCliente`
  - `crearVehiculo`
  - `crearOrden`
  - `cambiarEstadoOrden`
  - `solicitarRestablecimiento`
  - `restablecerContrasena`

#### `src/router/index.js`

Define rutas públicas y protegidas:

- `/login`
- `/recuperar-contrasena`
- `/restablecer-contrasena`
- `/`
- `/vehiculos/:placa`
- `/ordenes/nueva/:placa`
- `/seguimiento`
- `/historial`

La guardia `beforeEach()` evita entrar a páginas privadas sin token válido.

#### `src/views/BusquedaPlacaView.vue`

Es la vista principal del taller:

- búsqueda por placa/cliente
- registro de cliente/vehículo
- creación de orden
- seguimiento en columnas por estado
- historial de trabajo
- entregados

La vista usa `workshop.js` para la lógica funcional del taller.

#### `src/views/LoginView.vue`

Pantalla de autenticación:

- correo y contraseña
- "recordarme"
- enlace para recuperación
- errores de validación
- redirección después de login

#### `src/views/RecuperarContrasenaView.vue`

Pantalla para dos flujos:

- solicitud de enlace
- creación de nueva contraseña con token

---

### Backend

#### `src/app.js`

Este es el punto de entrada de la API.

- inicializa Express
- activa CORS
- parsea JSON
- conecta a MongoDB
- carga rutas de auth, clientes, vehículos, órdenes e historial
- arranca el servidor

#### `src/config/database.js`

Se encarga de conectarse a MongoDB:

- valida que exista `MONGO_URI`
- opcionalmente setea `dns.setServers()` para resolver DNS externos
- usa `mongoose.connect()`

#### `src/models`

Modelos de Mongoose:

- `Usuario.js`
- `Cliente.js`
- `Vehiculo.js`
- `OrdenReparacion.js`
- `Historial.js`

El modelo `Usuario` incluye:

- email
- passwordHash
- rol
- activo
- tokenVersion
- resetTokenHash
- resetTokenExpiresAt

#### `src/security/passwords.js`

Implementa el hash seguro con scrypt:

- genera sal aleatoria
- hashea la contraseña con scrypt
- evita usos inseguros de MD5 o SHA1
- `verifyPassword()` compara por tiempo constante

#### `src/security/tokens.js`

Implementa JWT propio en formato HS256.

- `emitirToken(usuario)` crea un token JWT con payload
- `verificarToken(token)` valida firma, expiración y emisor
- usa `JWT_SECRET` o una clave temporal en desarrollo

Payload típico:

```json
{
  "sub": "usuario_id",
  "email": "correo@taller.com",
  "rol": "admin",
  "ver": 0,
  "iss": "taller-mecanico",
  "iat": 1710000000,
  "exp": 1710000000 + 28800
}
```

#### `src/middleware/autenticar.js`

Valida la sesión por token Bearer.

- extrae el header `Authorization: Bearer <token>`
- valida firma y expiración
- busca el usuario en MongoDB
- rechaza la sesión si `tokenVersion` cambió

#### `src/middleware/limitarIntentos.js`

Previene ataques por fuerza bruta en login y recuperación.

- guarda cuenta por IP
- bloquea si se excede el límite
- aplica ventanas temporales de 15 minutos

#### `src/routes/auth.routes.js`

Define endpoints públicos:

- `POST /api/auth/login`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

---

## 5. Cómo funciona la autenticación

### Flujo de login

1. Frontend hace POST a `/api/auth/login`
2. Backend valida correo y contraseña
3. Busca usuario activo y compara passwordHash con la contraseña introducida
4. Si es válido, backend genera JWT con `emitirToken()`
5. Frontend guarda el token en `sessionStorage`
6. Cada request usa el token en el interceptor de Axios
7. El backend valida el token en `autenticar.js`

### Protección por ruta

- El router del frontend redirige a `/login` si no hay token
- El backend usa `autenticar` para proteger endpoints sensibles
- En rutas de administración, además se valida `soloAdmin`

### TokenVersion

Se usa para invalidar sesiones antiguas:

- cuando un usuario cambia la contraseña se hace `tokenVersion += 1`
- si el token viejo sigue viajando, el backend lo rechaza

Esto evita que un JWT antiguo siga funcionando tras reset de contraseña.

---

## 6. Cómo funciona la recuperación de contraseña

### Parte frontend

Archivo: `frontend/src/views/RecuperarContrasenaView.vue`

El flujo tiene dos estados:

1. Solicitud de recuperación
   - usuario introduce correo
   - se valida con `esCorreoValido()`
   - se llama a `solicitarRestablecimiento(email)`

2. Restablecimiento con token
   - la URL llega con `?token=...`
   - se valida que exista un token
   - se exige contraseña mínima de 12 caracteres
   - confirma la contraseña
   - se llama a `restablecerContrasena(token, password)`

### Parte backend

Archivo: `backend/src/controllers/recuperacion.controller.js`

#### Solicitud de restablecimiento

- valida el correo
- comprueba que la aplicación tenga SMTP configurado
- busca el usuario activo
- genera un token aleatorio seguro con `crypto.randomBytes(32).toString('base64url')`
- guarda un hash del token en `resetTokenHash`
- guarda la expiración en `resetTokenExpiresAt = Date.now() + 30 min`
- genera el enlace:

```text
APP_URL/restablecer-contrasena?token=<token>
```

- envía correo con `enviarCorreoRestablecimiento()`

#### Restablecimiento

- recibe token y nueva contraseña
- valida formato del token y longitud de la contraseña
- calcula el hash del token
- busca un usuario activo con:
  - `resetTokenHash === hash(token)`
  - `resetTokenExpiresAt > Date.now()`
- actualiza `passwordHash`
- incrementa `tokenVersion`
- limpia `resetTokenHash` y `resetTokenExpiresAt`
- responde mensaje de éxito

### Envío de correo

Archivo: `backend/src/services/correo.js`

- usa `nodemailer.createTransport()`
- configura `host`, `port`, `secure`, `auth`
- envía correo con texto HTML y texto plano
- requiere configuración SMTP

### Variables necesarias para el correo

Se esperan estas variables de entorno:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE`
- `MAIL_FROM`
- `APP_URL`

La configuración se valida en `obtenerConfiguracionCorreo()`.

> Importante: si el host es Gmail, conviene usar contraseña de aplicación y no la contraseña normal.

---

## 7. Seguridad aplicada al proyecto

- contraseñas con scrypt
- token JWT firmado con HMAC SHA256
- expiración de token (8 horas para login)
- expiración de reset token (30 minutos)
- `tokenVersion` para invalidar sesiones
- rate limiting para login y recuperación
- validación de email y placas
- protección de rutas privadas
- menor exposición de datos sensible con `select: false` en `passwordHash`

---

## 8. Qué se revisó y qué quedó limpio

Se revisó el proyecto para comprobar si había cosas redundantes o sin uso real.

### Conclusión

No encontré módulos muertos obvios ni imports no utilizados en el flujo activo del proyecto. Las piezas que sí existen están integradas a rutas o scripts concretos del sistema:

- `seedDemo.js` y `seedMasivo.js` se mantienen porque tienen uso real desde `package.json`
- `scripts/crearUsuario.js` y `scripts/verificarCorreo.js` también son herramientas del sistema
- las validaciones y middleware están siendo consumidas por rutas reales

La estructura está ordenada por capas:

- `controllers`
- `models`
- `routes`
- `middleware`
- `security`
- `services`
- `validations`

Eso mantiene el proyecto fácil de mantener y escalable.

---

## 9. Verificación ejecutada

Se validó el proyecto con evidencia real:

- Frontend build: `npm run build` en el frontend
- Backend tests: `npm test` en el backend

Resultado: frontend compiló bien y backend pasó 17 pruebas sin fallos.

---

## 10. Resumen rápido del flujo real del sistema

### Login

- usuario escribe correo y contraseña
- frontend lo envía a `POST /api/auth/login`
- backend valida y devuelve JWT
- frontend guarda token
- cada llamada posterior lo usa en `Authorization` Bearer

### Recuperación

- usuario entra a `/recuperar-contrasena`
- envía correo a backend
- backend genera token seguro y guarda hash temporal
- envía enlace a Gmail o SMTP configurado
- usuario abre enlace
- backend verifica token y cambia contraseña
- se invalida sesión anterior por `tokenVersion`

### Taller

- el usuario navega por módulos de búsqueda, historial y seguimiento
- cada estado del taller se organiza por columnas
- se actualiza el estado de la orden mediante API
- los cambios quedan persistidos en MongoDB

---

## 11. Recomendación final

El proyecto está bien estructurado y ordenado por responsabilidades. Lo más importante es mantener esta división para que cada capa tenga una sola función:

- frontend = interfaz + UX + consumo de API
- backend = autenticación + lógica + validaciones + DB
- security = tokens, hash, evidencia de seguridad
- services = interacción con correo y proveedores externos

Esto facilitan futuras mejoras, como:

- roles más complejos
- recuperación por OTP SMS
- auditoría de cambios
- notificaciones por WhatsApp o email
- dashboard analítico

---

## 12. Variables recomendadas en `.env`

Aunque los valores reales no deben compartirse en el repositorio, estas son las variables que normalmente se usan:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/taller
JWT_SECRET=clave_segura_de_32_plus_caracteres
FRONTEND_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu_usuario@gmail.com
SMTP_PASS=tu_contraseña_de_aplicacion
MAIL_FROM=tu_usuario@gmail.com
APP_URL=http://localhost:5173
```

---

## 13. Conclusión

La app está bien construida, con una arquitectura clara, una lógica de autenticación sólida, una recuperación de contraseña completa y una separación razonable entre frontend y backend. No hay código muerto evidente. La parte de seguridad y recuperación está bien conectada y cumple con un flujo real de producción, con validaciones, limitación de intentos y control de sesiones.
