# Guía Completa del Proyecto — Taller Mecánico «Torque»

Este documento explica de forma sencilla y paso a paso **cómo está organizado el proyecto**, **qué hace cada archivo** y **cómo funcionan los cambios implementados**, pensado para que puedas entender y exponer el código fácilmente.

---

## 1. Estructura de Carpetas del Frontend (`frontend/src/`)

Se simplificó la arquitectura eliminando carpetas anidadas innecesarias para dejar una estructura limpia de **Vue 3 (Composition API con `<script setup>`) + Pinia + Quasar**:

```text
frontend/src/
├── components/                  # Componentes reutilizables (escritos con componentes Quasar)
│   ├── BotonAccion.vue          # Botón reutilizable para todo el sistema
│   ├── EstadoVacio.vue          # Tarjeta reutilizable para cuando una lista/tabla no tiene datos
│   ├── ModalDialogo.vue         # Ventana emergente base (para confirmaciones y edición)
│   ├── GestorClientesModal.vue  # Sección integrada de Clientes y Vehículos registrados
│   ├── EditorClienteVehiculo.vue# Formulario para editar propietario (y vehículo si aplica)
│   ├── ActualizarEstadoOrden.vue# Selector para cambiar estado de una orden
│   ├── RegistroClienteForm.vue  # Formulario de creación de cliente
│   ├── RegistroVehiculoForm.vue # Formulario de creación de vehículo
│   ├── RegistroOrdenForm.vue    # Formulario de creación de orden de servicio
│   ├── TablaOrdenesEstado.vue   # 🆕 Tabla de órdenes por estado del resumen
│   ├── TablaHistorialReparaciones.vue # 🆕 Tabla de reparaciones de un vehículo
│   ├── TablaHistorialEntregas.vue     # 🆕 Tabla de entregas de un vehículo
│   ├── TablaHistorialGeneral.vue      # 🆕 Tabla del historial completo del taller
│   └── TablaOrdenesEntregadas.vue     # 🆕 Tabla de vehículos entregados
├── views/                       # Pantallas principales de la aplicación
│   ├── BusquedaPlacaView.vue    # Panel principal del taller (Sidebar, Buscador, Estados, Tablero, Historial)
│   ├── LoginView.vue            # Pantalla de inicio de sesión
│   └── RecuperarContrasenaView.vue # Pantalla de recuperación de clave
├── stores/                      # Estado global con Pinia (reemplaza localStorage manual)
│   ├── auth.js                  # Guarda la sesión del usuario autenticado
│   └── workshop.js              # Guarda órdenes, vehículos, clientes y conecta con el backend
├── services/
│   └── api.js                   # Funciones que hacen peticiones HTTP (GET, POST, PUT, DELETE) al backend
├── utils/
│   ├── useGestionClientes.js    # Lógica (composable) para buscar, validar, editar y borrar clientes/vehículos
│   ├── texto.js                 # Función para dar formato limpio a nombres y textos
│   ├── formato.js               # 🆕 Formato compartido de fechas (formatoFecha) y dinero (formatoDinero) usado por todas las tablas
│   └── validation.js            # Validaciones de correo electrónico
├── router/
│   └── index.js                 # Rutas de navegación (/login, /, /seguimiento, /historial, etc.)
├── style.css                    # Estilos globales con el tema visual "Torque"
└── main.js                      # Punto de entrada que inicia Vue 3, Pinia, Vue Router y Quasar
```

---

## 1.b. Componentización de Tablas (Refactorización 🆕)

Todas las tablas HTML que estaban escritas directamente dentro de [`BusquedaPlacaView.vue`](./frontend/src/views/BusquedaPlacaView.vue) se extrajeron a **5 componentes reutilizables** en `frontend/src/components/`. Cada tabla recibe sus datos por la prop `ordenes` y emite eventos cuando el usuario interactúa, manteniendo la vista principal más limpia y legible.

| Componente | Tabla que reemplaza | Columnas | Eventos |
|---|---|---|---|
| `TablaOrdenesEstado.vue` | Tabla del detalle de un estado del resumen (placa, cliente, servicio, mecánico…) | 8 | `@ver-ficha` (abre la ficha del vehículo) |
| `TablaHistorialReparaciones.vue` | Historial de reparaciones en la ficha del vehículo | 5 (orden, fecha, estado, costo, acciones) | — |
| `TablaHistorialEntregas.vue` | Historial de entregas en la ficha del vehículo | 4 | — |
| `TablaHistorialGeneral.vue` | Historial completo del taller (con filtros de búsqueda) | 6 | — |
| `TablaOrdenesEntregadas.vue` | Órdenes ya entregadas al cliente | 5 | — |

### Ejemplo de uso

```vue
<TablaOrdenesEstado
  v-else-if="ordenesEstadoSeleccionado.length"
  :ordenes="ordenesEstadoSeleccionado"
  @ver-ficha="seleccionarVehiculo"
/>
<TablaHistorialReparaciones v-if="historial.length" :ordenes="historial" />
```

Además se creó el util compartido [`frontend/src/utils/formato.js`](./frontend/src/utils/formato.js) con las funciones `formatoFecha()` y `formatoDinero()`, que antes estaban duplicadas en la vista y ahora todos los componentes de tabla importan desde un solo lugar.

### Beneficios

- **Menos código repetido:** la vista redujo ~200 líneas de HTML de tablas.
- **Mantenimiento centralizado:** cambiar una columna o formato solo se hace en un archivo.
- **Consistencia visual:** todas las tablas comparten las mismas clases CSS (`history-table`, `status-pill`, `cost-cell`) y los mismos formatos de fecha/dinero.

--- Explicación Paso a Paso de `BotonAccion.vue` (Componente Reciclado #1)

Ubicación: [`frontend/src/components/BotonAccion.vue`](./frontend/src/components/BotonAccion.vue)

### ¿Por qué se creó este componente?

En la aplicación había muchos botones repetidos (_Guardar_, _Cancelar_, _Editar_, _Eliminar_, _Ficha_, _Regresar al resumen_). En vez de escribir 10 líneas de código cada vez que necesitamos un botón, creamos un **molde único** llamado `BotonAccion.vue`.

### ¿Cómo funciona su código por dentro?

#### Bloque 1: `defineProps` (Los datos que recibe el botón)

```js
const props = defineProps({
  etiqueta: { type: String, default: "" }, // Texto visible del botón
  variante: { type: String, default: "primario" }, // Qué diseño visual tendrá
  icono: { type: String, default: "" }, // Nombre del icono izquierdo
  iconoDerecha: { type: String, default: "" }, // Nombre del icono derecho
  tipo: { type: String, default: "button" }, // "button" normal o "submit"
  cargando: { type: Boolean, default: false }, // Muestra ruedita de carga si es true
  deshabilitado: { type: Boolean, default: false }, // Bloquea el botón si es true
  denso: { type: Boolean, default: false }, // Hace el botón más compacto
});
```

- **Explicación sencilla:** Las `props` son como las opciones que le pasas al molde. Si en otra pantalla escribes `<BotonAccion etiqueta="Guardar" variante="primario" />`, el componente recibe `etiqueta = "Guardar"` y `variante = "primario"`.

#### Bloque 2: `defineEmits` (Avisar cuando el usuario hace clic)

```js
const emit = defineEmits(["click"]);
```

- **Explicación sencilla:** El botón por sí solo no sabe si debe guardar un cliente, borrar un vehículo o abrir una ficha. Lo único que hace cuando le dan clic es **avisar al componente padre** diciendo: _"¡Me hicieron clic!"_ (`emit('click')`), y el padre ejecuta la acción correspondiente.

#### Bloque 3: `mapaClases` y `computed` (Cambiar de diseño automáticamente)

```js
const mapaClases = {
  primario: "primary-button", // Botón principal destacado
  secundario: "secondary-button", // Botón blanco con borde suave
  peligro: "primary-button danger-button", // Botón rojo para confirmar borrado
  accion: "icon-action", // Botón pequeño "Editar" en tablas
  "accion-peligro": "icon-action is-danger", // Botón pequeño "Eliminar" en tablas
  "accion-suave": "summary-action-btn is-primary-soft", // Botón "Ficha" en tono suave
};

const clasesBoton = computed(
  () => mapaClases[props.variante] || "primary-button",
);
const esPlano = computed(
  () => props.variante !== "primario" && props.variante !== "peligro",
);
```

- **Explicación sencilla:**
  - `mapaClases` es un diccionario que traduce nombres fáciles en español (`primario`, `secundario`, `peligro`, `accion`, `accion-peligro`, `accion-suave`) a las clases de diseño de [`style.css`](./frontend/src/style.css).
  - `computed` significa **"propiedad calculada"**: Vue calcula automáticamente qué clase CSS ponerle al botón según la `variante` que le enviaste.

#### Bloque 4: `<template>` con `<q-btn>` (El botón visual de Quasar)

```vue
<template>
  <q-btn
    :flat="esPlano"
    :unelevated="!esPlano"
    no-caps
    :dense="
      props.denso ||
      props.variante === 'accion' ||
      props.variante === 'accion-peligro'
    "
    :type="props.tipo"
    :class="clasesBoton"
    :label="props.etiqueta"
    :icon="props.icono || undefined"
    :icon-right="props.iconoDerecha || undefined"
    :loading="props.cargando"
    :disable="props.deshabilitado || props.cargando"
    @click="emit('click', $event)"
  />
</template>
```

- **Explicación de cada atributo:**
  - `<q-btn>`: Es el componente oficial de botón de la librería **Quasar**.
  - `no-caps`: Evita que Quasar convierta el texto a MAYÚSCULAS.
  - `:class="clasesBoton"`: Aplica el color y estilo calculado en el Bloque 3.
  - `:label="props.etiqueta"`: Pone el texto dentro del botón.
  - `:loading="props.cargando"`: Si se está guardando en el servidor, muestra un indicador girando.
  - `:disable="props.deshabilitado || props.cargando"`: Bloquea el botón mientras carga para evitar que el usuario presione dos veces y duplique registros.

### ¿Dónde se está reciclando `BotonAccion.vue`?

1. **[`EditorClienteVehiculo.vue`](./frontend/src/components/EditorClienteVehiculo.vue):** Para los botones **Cancelar** y **Guardar cambios**.
2. **[`GestorClientesModal.vue`](./frontend/src/components/GestorClientesModal.vue):** Para los botones **Editar** y **Eliminar** en las tablas de clientes y de vehículos.
3. **[`EstadoVacio.vue`](./frontend/src/components/EstadoVacio.vue):** Para el botón opcional que aparece cuando una tabla está vacía.
4. **[`BusquedaPlacaView.vue`](./frontend/src/views/BusquedaPlacaView.vue):** Para el botón **Ficha**, el botón **Regresar al resumen** y los botones de los diálogos de confirmación.

---

## 3. Explicación Paso a Paso de `EstadoVacio.vue` (Componente Reciclado #2)

Ubicación: [`frontend/src/components/EstadoVacio.vue`](./frontend/src/components/EstadoVacio.vue)

### ¿Por qué se creó este componente?

En 7 lugares distintos del sistema (tabla de clientes vacía, tabla de vehículos vacía, estado de órdenes sin vehículos, historial del vehículo vacío, entregas vacías, historial general sin resultados y vehículos entregados vacíos) se repetía el mismo bloque visual: **un ícono circular + un título en negrita + una descripción + un botón opcional**.
Con `EstadoVacio.vue` reemplazamos esos 7 bloques repetidos por un único componente limpio y reutilizable.

### ¿Cómo funciona su código por dentro?

#### Bloque 1: `defineProps` y `defineEmits`

```js
import BotonAccion from "./BotonAccion.vue";

// 1. PROPS: Datos que recibe el componente para personalizar el mensaje vacío
const props = defineProps({
  icono: { type: String, default: "inbox" }, // Ícono de Material Icons
  titulo: { type: String, required: true }, // Título principal en negrita
  descripcion: { type: String, default: "" }, // Explicación debajo del título
  textoBoton: { type: String, default: "" }, // Si tiene texto, muestra un botón
  iconoBoton: { type: String, default: "" }, // Ícono opcional del botón
  varianteBoton: { type: String, default: "secundario" }, // Estilo del botón
});

// 2. EMITS: Avisa al padre cuando el usuario presiona el botón de acción
const emit = defineEmits(["accion"]);
```

- **Explicación sencilla:**
  - Solo necesitas enviarle `icono`, `titulo` y `descripcion`.
  - Si además quieres que aparezca un botón debajo (por ejemplo, _"Crear primera orden"_, _"Regresar al resumen"_ o _"Limpiar filtros"_), le pasas `texto-boton="..."` y escuchas el evento `@accion`.
  - Nota cómo **`EstadoVacio.vue` reutiliza a su vez `BotonAccion.vue`**: un componente reciclado trabajando dentro de otro componente reciclado.

#### Bloque 2: `<template>` con componentes de Quasar

```vue
<template>
  <q-card-section class="empty-state column items-center text-center">
    <q-avatar class="empty-icon" size="48px">
      <q-icon :name="props.icono" size="24px" />
    </q-avatar>

    <q-item-label class="empty-state-title text-weight-bold q-mt-xs">
      {{ props.titulo }}
    </q-item-label>

    <q-item-label
      v-if="props.descripcion"
      caption
      class="empty-state-desc q-mt-xs q-mb-md"
    >
      {{ props.descripcion }}
    </q-item-label>

    <BotonAccion
      v-if="props.textoBoton"
      :variante="props.varianteBoton"
      :icono="props.iconoBoton"
      :etiqueta="props.textoBoton"
      @click="emit('accion')"
    />

    <slot />
  </q-card-section>
</template>
```

- **Explicación de cada etiqueta Quasar:**
  - `<q-card-section>`: Crea el contenedor centrado del mensaje vacío.
  - `<q-avatar>` + `<q-icon>`: Dibuja el círculo suave con el ícono adentro (`groups`, `directions_car`, `history`, `task_alt`, `check_circle`, `search_off`).
  - `<q-item-label>`: Muestra el título principal y, si existe `props.descripcion` (`v-if="props.descripcion"`), muestra el subtítulo explicativo.
  - `<BotonAccion v-if="props.textoBoton" />`: Solo dibuja el botón si le enviamos algún texto en `textoBoton`. Cuando le hacen clic, dispara `emit('accion')`.
  - `<slot />`: Deja un espacio abierto por si alguna pantalla necesita meter contenido extra personalizado adentro.

### ¿En qué 7 lugares se está reciclando `EstadoVacio.vue`?

1. **[`GestorClientesModal.vue`](./frontend/src/components/GestorClientesModal.vue) (Pestaña Clientes):** Cuando no hay clientes registrados o la búsqueda no arroja resultados.
2. **[`GestorClientesModal.vue`](./frontend/src/components/GestorClientesModal.vue) (Pestaña Vehículos):** Cuando no hay vehículos para mostrar.
3. **[`BusquedaPlacaView.vue`](./frontend/src/views/BusquedaPlacaView.vue) (Tarjetas de Estado de las órdenes):** Cuando seleccionas un estado (por ejemplo _Listos_) y no hay vehículos en ese estado, incluyendo el botón **Regresar al resumen**.
4. **[`BusquedaPlacaView.vue`](./frontend/src/views/BusquedaPlacaView.vue) (Ficha del vehículo - Reparaciones):** Cuando el vehículo aún no tiene reparaciones, incluyendo el botón **Crear primera orden**.
5. **[`BusquedaPlacaView.vue`](./frontend/src/views/BusquedaPlacaView.vue) (Ficha del vehículo - Entregas):** Cuando el vehículo aún no tiene órdenes entregadas.
6. **[`BusquedaPlacaView.vue`](./frontend/src/views/BusquedaPlacaView.vue) (Historial del taller):** Cuando un filtro de búsqueda no encuentra órdenes, incluyendo el botón **Limpiar filtros**.
7. **[`BusquedaPlacaView.vue`](./frontend/src/views/BusquedaPlacaView.vue) (Vehículos entregados):** Cuando aún no hay vehículos entregados en el taller.

---

## 4. Cómo Funciona la Sección Interactiva «Estado de las órdenes»

Ubicación: [`frontend/src/views/BusquedaPlacaView.vue`](./frontend/src/views/BusquedaPlacaView.vue)

### Las 5 Tarjetas en Orden

Las tarjetas se muestran en el orden solicitado:

1. **En proceso:** Suma todas las órdenes que tienen trabajos activos en el taller (`Recibido`, `En Diagnóstico` o `En Reparación`).
2. **Recibidos:** Vehículos cuya orden está en estado `Recibido`.
3. **En diagnóstico:** Vehículos cuya orden está en estado `En Diagnóstico`.
4. **En reparación:** Vehículos cuya orden está en estado `En Reparación`.
5. **Listos:** Vehículos cuya reparación terminó y su orden está en estado `Listo`.

### ¿Cómo se filtran los datos reales?

1. **Consulta al backend:** Al entrar a la vista o hacer clic en una tarjeta, se ejecuta `workshop.cargarOrdenesActivas()`, que llama a `GET /api/ordenes/activas` en el backend y trae las órdenes reales de MongoDB junto con los datos del vehículo y del cliente.
2. **Sin duplicados (`ordenesActivasUnicas`):** Se verifica mediante un `Set` de `_id` que ninguna orden se cuente dos veces.
3. **Al hacer clic en una tarjeta (`seleccionarEstadoResumen`):**
   - Se guarda cuál tarjeta seleccionó el usuario en la variable reactiva `estadoResumenSeleccionado` (`'proceso'`, `'recibidos'`, `'diagnostico'`, `'reparacion'` o `'listos'`).
   - Si el usuario vuelve a hacer clic en la misma tarjeta o presiona **Regresar al resumen**, se oculta la tabla (`estadoResumenSeleccionado = ''`).
   - Mientras hay una tarjeta seleccionada, se despliega debajo una tabla amplia con: **Placa**, **Marca y modelo**, **Cliente**, **Servicio / Reparación**, **Fecha de ingreso**, **Estado**, **Mecánico** y el botón **Ficha** (que abre el historial y detalle completo de ese vehículo).

---

## 5. Cómo Funciona «Clientes registrados» y la Edición

Ubicación:

- Presentación visual: [`frontend/src/components/GestorClientesModal.vue`](./frontend/src/components/GestorClientesModal.vue) y [`frontend/src/components/EditorClienteVehiculo.vue`](./frontend/src/components/EditorClienteVehiculo.vue)
- Lógica y validaciones: [`frontend/src/utils/useGestionClientes.js`](./frontend/src/utils/useGestionClientes.js)

1. **Integrado en la página (sin ventana flotante):**
   - Al presionar **Clientes registrados** en el menú lateral izquierdo, `gestionAbierta` pasa a `true` y [`BusquedaPlacaView.vue`](./frontend/src/views/BusquedaPlacaView.vue) muestra la tabla directamente dentro del contenido principal de la página.
2. **Pestaña Clientes vs. Pestaña Vehículos:**
   - Si presionas **Editar** dentro de la lista de **Clientes**, se abre `EditorClienteVehiculo.vue` mostrando **únicamente los datos del propietario** (Nombre, Cédula, Teléfono y Correo), sin pedir ni validar placa de vehículo.
   - Si cambias a la pestaña **Vehículos** y presionas **Editar**, el formulario muestra tanto los datos del propietario como los **Datos del Vehículo** (Placa, Marca, Modelo, Año, Kilometraje y Color).

---

## 6. Cómo Ejecutar el Proyecto

En dos terminales separadas:

### Terminal 1 — Backend (Puerto 4000)

```powershell
cd backend
npm run dev
```

### Terminal 2 — Frontend (Puerto 5173)

```powershell
cd frontend
npm run dev
```
