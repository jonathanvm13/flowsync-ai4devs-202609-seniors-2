# Design

## Context

Hoy el sistema solo tiene la capability `auth`: usuarios, tokens de acceso opacos y tres pantallas, `/login`, `/register` y `/profile`. El motivo del change está en `proposal.md` y el comportamiento exigido, en `specs/tasks/spec.md` y `specs/auth/spec.md`. Lo que condiciona el diseño:

- **Backend.**
  - El esquema de los modelos se genera desde las migraciones (`database/schema.ts`). Los modelos solo añaden relaciones y lógica.
  - Las respuestas pasan por `serialize()`, que las envuelve en `{ data }`, y siempre a través de un transformer.
  - La validación usa VineJS 4 con `vine.create`. Lucid aporta las reglas `unique` y `exists`, y VineJS tiene `vine.enum` y el modificador `.trim()`.
  - El bodyparser convierte las cadenas vacías en `null` (`convertEmptyStringsToNull`).
- **Frontend.**
  - Todo acceso a la API pasa por `src/lib/api.ts`, que traduce los errores de VineJS a castellano según `rule` y `field`.
  - Las pantallas usan `AuthLayout` o `Card`, junto con `useAuthForm` para el estado de envío y los errores.
  - Las rutas protegidas cuelgan de `ProtectedRoute`.
  - Los únicos componentes de UI disponibles son `alert`, `button`, `card`, `input` y `label`. No se pueden añadir dependencias.

## Goals / Non-Goals

**Goals:**

- Cumplir los dos deltas sin añadir dependencias ni componentes generados nuevos.
- Que la respuesta de la API exponga del responsable lo justo, `id` y `fullName`, desde el primer día. Ampliarla después rompería menos que recortarla.
- Encajar en las convenciones existentes: rutas bajo `/api/v1`, controlador registrado en `#generated/controllers`, transformers, validadores con builders compartidos y traducción de errores en `api.ts`.

**Non-Goals:**

- Refresco en vivo, ordenación, filtrado, paginación y edición del título.
- Cualquier base de pruebas: este change no incluye tests.

## Decisions

### Modelo de datos

Se crea una migración nueva para la tabla `tasks`:

| Columna | Tipo |
|---|---|
| `id` | entero, autoincremental |
| `title` | `string(255)`, no nulo |
| `status` | `string`, no nulo, por defecto `pending` |
| `assignee_id` | entero, no nulo, FK a `users.id` con `ON DELETE CASCADE` |
| `created_at`, `updated_at` | timestamps |

Al modelo `Task` se le añade `belongsTo(() => User, { foreignKey: 'assigneeId' })` como `assignee`.

- **`status` como string en vez de un enum nativo de SQLite.** SQLite no tiene enums. Un `CHECK` añadiría una segunda fuente de verdad, cuando el conjunto cerrado ya lo garantiza el validador, que es lo que da el 422 que pide la spec. Los valores viven en una sola constante exportada, `TASK_STATUSES = ['pending', 'in_progress', 'done'] as const`, que comparten el validador y el tipo.
- **Sin columna de creador.** La spec no distingue al creador del responsable, y añadirla sería preparar trabajo futuro sin requisito. El responsable inicial es quien crea la tarea.
- **`created_at` y `updated_at`** existen por convención de Lucid, pero el transformer no los expone: la spec prohíbe que la lista tenga fechas.
- **`ON DELETE CASCADE`.** Hoy no hay borrado de usuarios, y es la misma política que ya usan los tokens. La alternativa, `SET NULL`, obligaría a dejar el responsable como nullable y a pintar una tarea sin responsable, algo que la spec no contempla.

### API

Tres rutas en un grupo `tasks` bajo `/api/v1`, con `.use(middleware.auth())` en el grupo:

| Método y ruta | Acción |
|---|---|
| `GET /tasks` | `TasksController.index` |
| `POST /tasks` | `TasksController.store` |
| `PATCH /tasks/:id` | `TasksController.update` |

El parámetro `:id` de `PATCH` se restringe con `router.matchers.number()`.

- **`index`** ejecuta `Task.query().preload('assignee')`, sin `orderBy`. No hay regla de orden decidida (PA-3), así que no se ordena explícitamente.
- **`store`** valida `{ title }`, crea la tarea con `status: 'pending'` y `assigneeId: auth.user.id`, precarga `assignee` y responde 201 con `response.status(201)` más `serialize(...)`.
  - Se responde 201 en lugar del 200 que usa el registro de usuario porque aquí se crea un recurso de la colección que se lista.
- **`update`** hace `Task.findOrFail(params.id)`, que devuelve 404 si la tarea no existe. Después valida `{ status?, assigneeId? }`, aplica solo lo recibido, guarda, precarga `assignee` y responde 200.
- **`PATCH` y no `PUT`.** La actualización es parcial: estado, responsable o ambos.
- **Cuerpo de `PATCH` sin `status` ni `assigneeId`.** Se responde 200 con la tarea tal cual. La spec no lo prohíbe, y exigir al menos un campo obligaría a una regla a medida sin un criterio que la pida.
- **Campos desconocidos** en la creación (`status`, `assigneeId`, etc.) y en la actualización (`title`). Se ignoran porque VineJS solo devuelve los campos declarados en el schema. Ese es justo el comportamiento que piden los escenarios de «se ignora».
- **Lectura y borrado individuales.** Al no declarar sus rutas, `GET` y `DELETE /tasks/:id` responden 404.

### Validación

Se añade un fichero nuevo de validadores para tareas. En él se define un builder compartido `title()` como `vine.string().trim().minLength(1).maxLength(255)`.

- **`trim()` antes de `minLength(1)`.** Así un título hecho solo de espacios llega vacío a la comprobación de longitud y se rechaza (rule `minLength`). El título vacío (`""`) ya lo convierte en `null` el bodyparser, y lo rechaza `required`.
- **`createTaskValidator`** valida `{ title: title() }`.
- **`updateTaskValidator`** valida:
  - `status`: `vine.enum(TASK_STATUSES).optional()`;
  - `assigneeId`: `vine.number().exists({ table: 'users', column: 'id' }).optional()`, que devuelve 422 con la rule `database.exists` si el usuario no existe.
- **Límite de 255.** Coincide con la longitud de la columna, así que la base de datos nunca recibe un valor mayor del que puede guardar.

### Transformers

- **`TaskTransformer`** devuelve `id`, `title`, `status` y `assignee`. Para `assignee` usa `AssigneeTransformer.transform(this.whenLoaded(this.resource.assignee))`.
- **`AssigneeTransformer`** es un transformer nuevo que solo hace `pick` de `id` y `fullName`.
- **No se reutiliza `UserTransformer`.** Expone `email`, `initials` y fechas, que es justo lo que E3-1 advierte de no filtrar. Un transformer específico deja el contrato cerrado y explícito.

### Frontend: cliente de API y tipos

- **En `lib/types.ts`** se añaden:
  - `TaskStatus = 'pending' | 'in_progress' | 'done'`;
  - `Task = { id; title; status; assignee: { id; fullName: string | null } }`.
- **En `lib/api.ts`** se amplía el tipo `method` de `RequestOptions`, de `'GET' | 'POST'` a `'GET' | 'POST' | 'PATCH'`, y se añaden `listTasks(token)`, `createTask(token, { title })` y `updateTaskStatus(token, id, status)`. No se expone una función para reasignar, porque la interfaz no lo hace.
- **También en `lib/api.ts`** se añade `title: 'el título'` a `FIELD_LABELS`, junto con dos casos específicos en `translate`:
  - `field === 'title'` con `required` o `minLength`: «Escribe un título para la tarea.»;
  - `field === 'title'` con `maxLength`: «El título no puede superar los 255 caracteres.».

  El texto genérico, «el título debe tener al menos 1 caracteres.», sería incorrecto y confuso.
- **Etiquetas de estado.** Un mapa `STATUS_LABELS: Record<TaskStatus, string>` con «Pendiente», «En curso» y «Hecho» vive junto a la página, no en `api.ts`, porque es presentación. El identificador en inglés nunca se pinta.

### Frontend: página `/tasks`

`pages/tasks-page.tsx` es una `Card` centrada como la de perfil, pero más ancha. Lleva una cabecera con el título «Tareas del equipo» y un enlace «Mi perfil». El cuerpo tiene dos bloques.

**Formulario de creación**

- Lleva un único `Input`, etiquetado «Título», y un `Button` «Crear tarea».
- **Envío.** Reutiliza `useAuthForm(['title'])`: le sirve tal cual el estado de envío, el reparto de errores por campo y el aviso general.
  - Antes de enviar, si el título recortado está vacío, se llama a `failWith('title', 'Escribe un título para la tarea.')` y no se envía nada, igual que el registro con las contraseñas.
  - `useAuthForm` resetea su estado en cada envío pero no conoce el valor del campo, y su `submit` nunca rechaza, porque captura el error. Por eso el vaciado del `Input` va **dentro** de la closure `action`, justo después de `await createTask(...)`, y no tras `await submit(...)`: así el texto se conserva cuando hay error.
  - Los campos se pasan como una constante de módulo `const FIELDS = ['title'] as const`, igual que en `login-page.tsx`, y no como un literal inline que se recrearía en cada render.
- **Al crear.** La tarea devuelta se añade al estado local, sin volver a pedir la lista: así cumple «sin recargar» con una sola petición.
  - Se añade al final del array local porque es lo más simple, no un criterio de orden. Tras recargar puede salir en otra posición, y nada en la spec promete lo contrario (PA-3).

**Lista**

- **Estados de la pantalla.**
  - Mientras carga, se muestra el mismo icono de carga que `FullScreenLoader`, pero dentro de la tarjeta.
  - Si falla la carga, aparece un `Alert` destructivo con el mensaje de `ApiError`.
  - Si no hay tareas, se muestra un bloque explicativo, por ejemplo: «Todavía no hay tareas. Esta es la lista compartida del equipo: aquí verás todo lo que hay en marcha, quién lo lleva y en qué estado está. Crea la primera escribiendo su título.».
- **Filas.** Cada fila es un `<li>` con el título, el responsable (`assignee.fullName?.trim() || 'Sin nombre'`) y el control de estado.
  - Se usa `trim() ||` en vez de `??` porque la API de registro no recorta `fullName`: una cuenta creada fuera de la web con un nombre de solo espacios tiene que pintarse también como «Sin nombre».

**Control de estado**

- Es un grupo de tres `Button` de tamaño pequeño con `role="group"`. El estado actual usa `variant="default"` y `aria-pressed="true"`; los otros dos, `variant="outline"`.
- **Botones y no un `<select>`.** El repositorio no tiene un componente Select (añadirlo traería Radix como dependencia), y un `<select>` nativo desentona con el resto de la interfaz. Además, tres botones dan un solo gesto y dejan los tres destinos a la vista, que es lo que pide E2-4.
- **Actualización optimista.** Al pulsar, el nuevo estado se aplica de inmediato en local y la fila queda en un conjunto `pendingIds` que deshabilita sus botones.
  - Si la petición falla, se restaura el estado anterior y se muestra un `Alert` con el mensaje en un aviso general de la página.
  - En cualquier caso, la fila sale de `pendingIds` al terminar la petición.

### Frontend: rutas y redirecciones

- **En `app-routes.tsx`:**
  - se añade `<Route path="/tasks" element={<TasksPage />} />` dentro de `ProtectedRoute`;
  - el comodín `*` pasa a `<Navigate to="/tasks" replace />`.
- **En `public-only-route.tsx`**, el destino pasa de `/profile` a `/tasks`.
  - Como login y registro no redirigen a mano tras el éxito, sino que es `PublicOnlyRoute` quien rebota al cambiar el estado, con este cambio ya quedan cubiertos los escenarios MODIFIED de login y registro.
- **En `profile-page.tsx`** se añade un enlace «Ver tareas» a `/tasks`, con `Link` de react-router y estilo de botón `outline` o `link`.

## Risks / Trade-offs

- **[El orden es el que devuelva SQLite, sin `ORDER BY`]** → En la práctica suele ser el de inserción, pero no está garantizado y podría cambiar. Se deja explícito en la spec («sin orden garantizado») y en el proposal (PA-3), para que nadie dependa de él.
- **[La actualización optimista puede mostrar brevemente un estado que el servidor rechaza]** → Se revierte la fila y se avisa. Se acepta porque E2-4 CA-1 pide que el cambio se vea de inmediato.
- **[Sin refresco en vivo, la lista puede quedar desfasada respecto a lo que hacen otros]** → Está fuera del alcance (E3-2). Recargar la página trae el estado real.
- **[La API admite reasignar pero la interfaz no]** → Esa parte del contrato se queda sin consumidor por ahora. Se acepta por la restricción 5 y por la decisión del usuario. La historia de reasignación solo añadirá la interfaz y la fuente de personas.
- **[El umbral de 255 es provisional (PA-9)]** → Cambiarlo exige una migración, y no solo tocar el validador, si sube por encima de la columna. Se documenta como punto abierto.
- **[Un 401 en una operación de tareas solo muestra «Tu sesión ha caducado…» y no cierra la sesión]** → Es el mismo comportamiento que tiene hoy el resto de llamadas. Unificarlo es otro change.
- **[`useAuthForm` lleva «auth» en el nombre y se reutiliza para tareas]** → Se acepta en lugar de duplicarlo. Renombrarlo sería un refactor fuera de alcance.

## Migration Plan

1. `node ace migration:run`, que crea `tasks` y regenera `database/schema.ts`.
2. Arrancar el servidor de desarrollo para regenerar `.adonisjs/` y commitear el diff.
3. Rollback: `node ace migration:rollback` elimina la tabla. Revertir el commit del frontend restaura `/profile` como portada.
