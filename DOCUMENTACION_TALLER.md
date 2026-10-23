# Documentación completa del proyecto Taller Mecánico

> **Cómo leer esta documentación:** la guía ordenada que empieza aquí describe la estructura y el comportamiento del código actual. Las secciones que ya estaban en este documento se conservan completas más abajo; se mantienen para no perder instrucciones, contexto ni decisiones previas.

## Guía ordenada del proyecto

### Índice de lectura

1. Qué hace el sistema y cómo se comunican sus partes.
2. Cómo está organizado el frontend y qué hace cada archivo.
3. Cómo está organizado el backend y qué hace cada archivo.
4. Cómo se guardan y relacionan los datos.
5. Qué pasa en los flujos principales: autenticación, registro, reparación, abonos y entrega.
6. Cómo se valida y protege la API.
7. Cómo se instala, configura, inicia y verifica el proyecto.

### 1. Qué hace el sistema

El sistema del taller se divide en dos aplicaciones que se comunican mediante HTTP y JSON:

- **Frontend:** la aplicación que ve y usa el personal del taller. Está hecha con Vue 3 y Vite. Presenta formularios, búsquedas, el tablero de órdenes y el historial.
- **Backend:** una API hecha con Node.js y Express. Valida quién puede hacer una operación y qué datos se aceptan; aplica reglas del taller y se comunica con MongoDB mediante Mongoose.
- **Base de datos:** MongoDB conserva usuarios, clientes, vehículos, órdenes e historial.

El frontend no se conecta directamente a MongoDB. Envía una solicitud a la API; el backend valida la solicitud, cambia o lee la base de datos y devuelve una respuesta JSON. Esta separación concentra las reglas y la seguridad en el servidor y permite que la interfaz se enfoque en la experiencia de uso.

```text
Persona del taller
  → vista de Vue
  → store o servicio Axios
  → ruta Express
  → autenticación y validación
  → controlador y modelo Mongoose
  → MongoDB
  ← respuesta JSON
  ← actualización de la pantalla
```

### 2. Frontend: estructura y responsabilidades

El código de la interfaz está en `frontend/src`.

| Archivo o carpeta | Responsabilidad |
|---|---|
| `main.js` | Crea Vue, Pinia y el router, registra el plugin de estado persistido y Quasar, importa iconos y estilos y monta la aplicación en `#app`. |
| `App.vue` | Contenedor raíz. Muestra la vista que corresponde a la URL mediante `<router-view />`. |
| `router/index.js` | Declara las direcciones de la aplicación y una guardia de navegación que manda a iniciar sesión si no hay una sesión guardada. |
| `views/LoginView.vue` | Pantalla para iniciar sesión. |
| `views/RecuperarContrasenaView.vue` | Pantallas para pedir el enlace de recuperación y establecer una contraseña nueva desde el enlace. |
| `views/BusquedaPlacaView.vue` | Vista principal del taller. Reúne búsqueda, fichas, registros, seguimiento, abonos e historial. Varias direcciones del router presentan esta misma vista en distintos modos. |
| `services/api.js` | Cliente Axios y funciones que traducen acciones de interfaz en solicitudes HTTP. Añade el token de sesión y convierte errores de API en mensajes manejables por la interfaz. |
| `stores/auth.js` | Estado de autenticación: inicia y cierra sesión y conserva token y usuario en `sessionStorage`. |
| `stores/workshop.js` | Estado y acciones del taller: búsquedas, ficha seleccionada, órdenes activas, historial, transiciones y abonos. |
| `utils/validation.js` | Validación compartida en el navegador, actualmente incluye la validación de correo. El backend valida de nuevo los datos; la validación visual no sustituye esa comprobación. |
| `style.css` | Estilos globales y de la interfaz. |

El router incluye `/login`, recuperación y restablecimiento de contraseña, búsqueda (`/`), ficha de vehículo, nueva orden, seguimiento e historial. Las rutas privadas se protegen en el navegador para mejorar el flujo de uso. Esa protección no reemplaza la autenticación de la API: el servidor valida también cada solicitud privada.

`services/api.js` decide la URL base: en producción apunta a la API publicada; en desarrollo usa `VITE_API_URL` o `/api`. `vite.config.js` reenvía `/api` a `http://localhost:4000` durante el desarrollo local.

Los archivos de `components/` contienen formularios Quasar independientes para cliente, vehículo, orden y avance de estado. En el código actual no aparecen importados por las vistas: el flujo principal implementa sus formularios y controles dentro de `BusquedaPlacaView.vue`. Se conservan como componentes disponibles, pero no conviene asumir que son el flujo activo sin comprobar sus usos.

Pinia conserva el estado de trabajo, pero su persistencia está limitada a `role` y `searchMode`. El plugin `pinia-plugin-persistedstate` usa `localStorage` por defecto porque el store no configura otro almacenamiento; por eso esos dos campos sobreviven al cierre del navegador. El resto del store de taller permanece en memoria y vuelve a sus valores iniciales al recargar.

El store de autenticación guarda `taller-token` y `taller-usuario` directamente en `sessionStorage`. Se conservan al recargar la página en esa pestaña y normalmente desaparecen al cerrar la sesión de navegación de la pestaña. La casilla de recordar correo guarda únicamente `taller-correo-recordado` en `localStorage`; no guarda la contraseña. El token de autenticación se envía como encabezado `Authorization: Bearer ...`, no como cookie. En el código actual no se crean ni se leen cookies.

La sesión del backend usa roles `admin` y `operario`; el campo `role` del store de taller es estado de interfaz y no es el permiso de seguridad del servidor. **Pinia** es la biblioteca de estado compartido de Vue: un **store** es un módulo con datos y acciones que varios componentes pueden consultar o actualizar. Pinia por sí sola mantiene esos datos en memoria; el plugin de persistencia es el que copia campos seleccionados a almacenamiento del navegador.

### Paleta visual

La paleta está definida principalmente al inicio de `frontend/src/style.css`: azul-violeta como color principal, tonos claros para fondos y paneles, naranja como acento, verde para éxito y naranja para advertencias. La intención aparente es dar una identidad moderna al taller, separar acciones principales de estados y mantener los paneles legibles. Esa explicación es una interpretación de los nombres y usos de los estilos: el código no contiene una nota de diseño que registre quién eligió esos colores o una razón oficial. El archivo Markdown no establece colores; si se ve coloreado en un editor, esos tonos los decide el editor o visor.

### 3. Backend: estructura y responsabilidades

El backend está en `backend/src` y sigue una separación por funciones:

| Archivo o carpeta | Responsabilidad |
|---|---|
| `app.js` | Configura Express, CORS y JSON, monta los routers, conecta MongoDB e inicia el servidor. |
| `config/database.js` | Revisa `MONGO_URI`, configura servidores DNS y abre la conexión de Mongoose. |
| `routes/` | Relaciona métodos y URLs con middleware y controladores. |
| `controllers/` | Ejecuta los casos de uso: busca documentos, aplica reglas, guarda cambios y responde con JSON. |
| `models/` | Define los esquemas Mongoose, tipos, valores predeterminados, validaciones e índices de MongoDB. |
| `validations/` | Valida y normaliza el cuerpo de las solicitudes antes de llamar al controlador. |
| `middleware/` | Funciones intermedias, en particular autenticación, permisos de administrador y límites de intentos. |
| `domain/ordenRules.js` | Define los estados y las transiciones permitidas para las órdenes. |
| `security/` | Cifrado de contraseñas y emisión/verificación de tokens. |
| `services/correo.js` | Configura Nodemailer y envía enlaces de recuperación de contraseña. |
| `scripts/` | Herramientas de terminal para crear usuarios y comprobar SMTP. |
| `seedDemo.js`, `seedMasivo.js` | Generan datos de demostración o lotes de prueba. |

El flujo de una ruta privada normalmente es: Express encuentra la ruta, `autenticar` valida el Bearer token, el validador filtra y comprueba campos, el controlador aplica la regla de negocio, Mongoose valida el documento y MongoDB lo guarda. Si algo falla, el controlador devuelve el código HTTP y un mensaje JSON.

La ruta raíz `GET /` del backend devuelve un mensaje JSON de disponibilidad. No comprueba la base de datos ni la sesión, por lo que funciona como respuesta básica del servidor y no como una verificación completa de salud.

### 4. Datos y relaciones

Los modelos principales son:

- **Usuario:** correo, hash de contraseña, rol, cuenta activa, versión de token y campos temporales de restablecimiento.
- **Cliente:** nombre, apellido, cédula única, teléfono y datos de contacto opcionales.
- **Vehículo:** placa única, marca, modelo, año, kilometraje, color y referencia a su cliente.
- **OrdenReparacion:** referencia al vehículo, fechas, descripción, diagnóstico, trabajos, mecánico, costos, estado y valores de pago.
- **Historial:** copia de los datos relevantes de cada orden con referencias al vehículo y cliente. `ordenId` es único, por lo que se mantiene un registro de historial por orden.

Las relaciones se representan con `ObjectId`: un cliente puede relacionarse con varios vehículos y cada vehículo puede tener varias órdenes. `populate()` permite que las consultas devuelvan también datos relacionados, por ejemplo el cliente dentro de un vehículo.

El costo total de una orden es repuestos + mano de obra. `montoPagado` acumula el dinero abonado y `pagado` indica que el total quedó cubierto. El abono actualiza el acumulado, no crea un recibo individual con fecha, método o responsable por cada pago. El saldo se obtiene como `max(0, monto - montoPagado)`; las órdenes antiguas con `pagado: true` se interpretan como totalmente pagadas para mantener compatibilidad.

El historial se sincroniza desde la orden al crearla, editarla, cambiar su estado o registrar un abono. Al arrancar, `sincronizarHistorialBase()` intenta sincronizar órdenes existentes para recuperar o completar registros históricos. La función informa si falla, aunque actualmente `app.js` no detiene el arranque al recibir `false`.

### 5. Flujos principales, paso a paso

#### Inicio de sesión

1. `LoginView.vue` envía correo y contraseña mediante `services/api.js` a `POST /api/auth/login`.
2. El backend normaliza el correo, valida los límites de entrada y busca una cuenta activa.
3. `security/passwords.js` compara la contraseña con el hash scrypt guardado.
4. Si coincide, `security/tokens.js` firma un JWT con vencimiento de ocho horas.
5. El frontend guarda token y usuario en `sessionStorage`.
6. Axios añade `Authorization: Bearer <token>` a las solicitudes siguientes.
7. `autenticar.js` valida firma, vencimiento, cuenta activa y versión de token en cada ruta privada.

#### Registrar cliente, vehículo y orden

1. El cliente se valida y crea con `POST /api/clientes`.
2. El vehículo se crea con `POST /api/vehiculos`; el backend comprueba que exista el cliente y que la placa no esté duplicada.
3. La orden se crea con `POST /api/ordenes`; el backend comprueba que el vehículo tenga un propietario y fuerza el estado inicial `Recibido`.
4. La orden se guarda y se crea o actualiza su entrada en el historial.

#### Reparar y avanzar de estado

La secuencia es `Recibido → En Diagnóstico → En Reparación → Listo → Entregado`. El store del frontend ayuda a mostrar y validar el siguiente paso. El backend aplica la misma regla para impedir saltos incluso si alguien llama la API directamente.

#### Registrar abono y entregar

1. Desde la tarjeta de la orden se manda un entero positivo a `PUT /api/ordenes/:id/pago`.
2. El backend comprueba que la orden exista, que no esté entregada y que el abono no sea mayor al saldo.
3. Suma el abono a `montoPagado`, recalcula `pagado` y sincroniza el historial.
4. La interfaz muestra el monto pagado y el saldo; solo ofrece `Entregado` cuando el total está cubierto.
5. Si se intenta saltar la interfaz, el servidor vuelve a revisar el saldo en `PUT /api/ordenes/:id/estado` y rechaza la entrega si falta dinero.

La opción visual y la regla del backend tienen propósitos distintos: la primera evita ofrecer una acción imposible; la segunda impide que se ejecute por una petición manual o una interfaz desactualizada.

#### Recuperar contraseña

1. El usuario solicita un enlace en la vista de recuperación.
2. El backend responde con un mensaje genérico, busca una cuenta activa y, si la encuentra, crea un token aleatorio de un solo uso.
3. Guarda el hash del token por 30 minutos y envía el enlace por SMTP.
4. La persona abre el enlace y envía token más nueva contraseña.
5. El servidor comprueba el hash y vencimiento, guarda el nuevo hash scrypt, elimina el token y sube `tokenVersion` para invalidar sesiones anteriores.

### 6. Rutas de API

Todas las rutas de clientes, vehículos, órdenes e historial requieren autenticación en el código actual. Las rutas de login y recuperación son públicas.

| Método y ruta | Acción | Reglas destacadas |
|---|---|---|
| `POST /api/auth/login` | Iniciar sesión | Valida correo y contraseña; tiene límite de intentos por IP. |
| `POST /api/auth/forgot-password` | Pedir enlace | Respuesta genérica para no revelar si existe el correo. |
| `POST /api/auth/reset-password` | Cambiar contraseña | Token de un solo uso y contraseña de al menos 12 caracteres. |
| `GET /api/clientes` | Listar clientes | Requiere sesión. |
| `GET /api/clientes/:id` | Consultar un cliente | Requiere sesión; valida el formato del identificador. |
| `GET /api/clientes/cedula/:cedula` | Buscar cliente y vehículos | Requiere sesión. |
| `GET /api/clientes/cedula/:cedula/estado` | Consultar vehículos e historial de órdenes | Respuesta reducida; también requiere sesión. |
| `POST`, `PUT /api/clientes/:id` | Crear o actualizar cliente | Cuerpo validado; cédula única. |
| `DELETE /api/clientes/:id` | Eliminar cliente | Solo admin y sin vehículos relacionados. |
| `GET /api/vehiculos` | Listar vehículos | Devuelve cliente poblado. |
| `GET /api/vehiculos/:id` | Consultar vehículo por identificador | Requiere sesión; incluye datos del propietario. |
| `GET /api/vehiculos/placa/:placa` | Buscar ficha por placa | Normaliza placa; incluye historial y propietario. |
| `GET /api/vehiculos/placa/:placa/estado` | Consulta de estado reducido | En el código actual también requiere sesión. |
| `POST`, `PUT /api/vehiculos/:id` | Crear o actualizar vehículo | Cliente existente; placa única; no permite cambiar dueño si ya hay órdenes. |
| `DELETE /api/vehiculos/:id` | Eliminar vehículo | Solo admin y sin órdenes ni historial. |
| `GET /api/ordenes` | Listar todas las órdenes | Incluye vehículo y propietario. |
| `GET /api/ordenes/activas` | Listar órdenes no entregadas | Incluye vehículo y propietario. |
| `GET /api/ordenes/:id` | Consultar orden individual | Incluye datos relacionados. |
| `POST /api/ordenes` | Crear orden | Estado inicial `Recibido`; requiere vehículo con propietario. |
| `PUT /api/ordenes/:id` | Editar detalles | No permite editar orden entregada; recalcula total y estado de pago. |
| `PUT /api/ordenes/:id/pago` | Registrar abono | No permite abono cero, negativo, fraccionario ni superior al saldo. |
| `PUT /api/ordenes/:id/estado` | Avanzar estado | Solo siguiente etapa; requiere saldo cero para entregar. |
| `DELETE /api/ordenes/:id` | Eliminar orden activa | No elimina entregadas; elimina su historial asociado si procede. |
| `GET /api/historial` | Consultar historial | Incluye vehículo y propietario. |

### 7. Validación, seguridad y errores

- Los validadores de `validations/validations/` usan listas de campos permitidos; esto evita que el cliente agregue propiedades internas como rol, estado o pagos en una ruta que no las admite.
- Los modelos Mongoose aplican límites adicionales al guardar: tipos, campos obligatorios, rangos, enums e índices únicos.
- `autenticar.js` exige token Bearer y consulta al usuario activo. `soloAdmin` protege ciertas eliminaciones.
- `passwords.js` usa scrypt, sal aleatoria y comparación de hashes con `timingSafeEqual`.
- `tokens.js` valida firma HMAC, emisor, algoritmo y vencimiento. En producción se requiere `JWT_SECRET` de al menos 32 bytes. En desarrollo sin secreto se usa una clave temporal que cambia al reiniciar.
- La limitación de intentos se mantiene en memoria del proceso; por ello no se comparte entre varias instancias y se reinicia con el servidor.
- El login tiene su propio contador por IP dentro de `auth.routes.js` (10 intentos por cada ventana de 15 minutos). `limitarIntentos.js` se usa en recuperación (5 solicitudes de enlace y 10 intentos de restablecimiento). No hay un manejador central de errores Express; los controladores capturan y traducen sus errores.
- `app.js` importa `validarConfiguracionTokens`, pero no la llama durante el arranque. El secreto se revisa cuando se emite o verifica un token.
- Los controladores suelen responder `400` por solicitud inválida, `401` por sesión inválida, `403` por rol insuficiente, `404` si no existe el registro, `409` por conflicto de negocio, `429` por exceso de intentos, `503` cuando recuperación no está configurada y `500` ante otros errores.

### 8. Configuración, instalación y comandos

El backend lee `backend/.env`; el frontend usa variables `VITE_*` en su proceso de build o desarrollo. No se deben guardar secretos reales en el repositorio. Las variables descritas en la sección original de entorno siguen siendo la referencia, junto con `MONGO_DNS_SERVERS` opcional.

Comandos del backend definidos en `backend/package.json`:

- `npm run dev`: servidor con Nodemon.
- `npm start`: servidor con Node.
- `npm run seed:demo`: carga datos demo.
- `npm run seed:masivo`: carga lote de datos.
- `npm run usuario:crear`: crea usuario inicial mediante preguntas en terminal.
- `npm run correo:verificar`: comprueba SMTP sin enviar mensaje.
- `npm test`: ejecuta las pruebas Node Test.

Comandos del frontend definidos en `frontend/package.json`:

- `npm run dev`: inicia Vite.
- `npm run build`: genera build de producción.
- `npm run preview`: sirve localmente el build.

El desarrollo local normalmente usa backend en el puerto 4000 y frontend en el 5173. El proxy de Vite conecta `/api` con el backend local. En producción, el frontend usa la URL de API fijada en `services/api.js`.

### 9. Pruebas y mantenimiento

Las pruebas están en `backend/test`: validaciones y modelos, CORS, firma de tokens, hash de contraseñas, middleware Bearer y rutas de autenticación. El documento original más abajo conserva el resultado de una ejecución anterior de build y pruebas. Ese resultado describe esa ejecución histórica, no una ejecución hecha al editar esta guía.

Al cambiar una regla del taller, conviene revisarla en tres lugares: la presentación del frontend, el store que evita transiciones inválidas y el controlador del backend que debe hacer cumplir la regla definitivamente. Si se modifica la forma de guardar datos, también se revisan el esquema Mongoose, la sincronización del historial y las validaciones de entrada.

---

## Documentación previa conservada

Las secciones originales que siguen a este encabezado se mantienen para conservar la información anterior del proyecto. La guía ordenada de arriba explica cómo leerla y añade el comportamiento actual de los módulos.

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

### 12.1 Configuración del despliegue

En producción, el frontend se publica en Vercel y consume la API de Render:

- Frontend: `https://taller-mecanico-blue.vercel.app`
- Backend: `https://tallermecanico-1.onrender.com`

El frontend de producción usa la URL de Render definida en `frontend/src/services/api.js`; en Render, `FRONTEND_URL` debe ser `https://taller-mecanico-blue.vercel.app` (sin barra final). Después de desplegar cambios de código, confirma que Vercel y Render terminaron sus respectivos despliegues antes de probar el inicio de sesión.
---

## 13. Conclusión

La app está bien construida, con una arquitectura clara, una lógica de autenticación sólida, una recuperación de contraseña completa y una separación razonable entre frontend y backend. No hay código muerto evidente. La parte de seguridad y recuperación está bien conectada y cumple con un flujo real de producción, con validaciones, limitación de intentos y control de sesiones.
