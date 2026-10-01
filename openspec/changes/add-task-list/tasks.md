# Tasks

## 1. Modelo de datos (backend)

- [ ] 1.1 Crear la migración de la tabla `tasks` (`id`, `title` string(255) no nulo, `status` string no nulo con valor por defecto `pending`, `assignee_id` FK a `users.id` con `ON DELETE CASCADE`, timestamps). Ejecutar `node ace migration:run` y comprobar que `database/schema.ts` incluye `TaskSchema` con esas columnas.
- [ ] 1.2 Crear el modelo `Task`, que extiende `TaskSchema`, con la relación `belongsTo` `assignee` (por `assigneeId`), y exportar la constante `TASK_STATUSES = ['pending', 'in_progress', 'done'] as const` con su tipo. Verificar con `npm run typecheck` en `backend/`.

## 2. Validación y transformers (backend)

- [ ] 2.1 Crear los validadores de tareas con un builder compartido `title()` (`trim`, `minLength(1)`, `maxLength(255)`), `createTaskValidator` (`title`) y `updateTaskValidator` (`status` como `vine.enum(TASK_STATUSES)` opcional, y `assigneeId` como número que debe existir en `users.id`, opcional). Verificar con `npm run typecheck`.
- [ ] 2.2 Crear `AssigneeTransformer` (solo `id` y `fullName`) y `TaskTransformer` (`id`, `title`, `status` y `assignee` mediante `whenLoaded`), sin fechas ni email. Verificar con `npm run typecheck`.

## 3. Controlador y rutas (backend)

- [ ] 3.1 Crear `TasksController` con tres acciones:
  - `index`: precarga `assignee`, sin `orderBy`;
  - `store`: estado `pending`, responsable = usuario autenticado, respuesta 201;
  - `update`: `findOrFail`, solo aplica `status` y `assigneeId`, respuesta 200.

  Todas responden mediante `serialize(TaskTransformer.transform(...))`. Verificar con `npm run typecheck`.
- [ ] 3.2 Registrar en `start/routes.ts` el grupo `/api/v1/tasks` con `GET /`, `POST /` y `PATCH /:id` (con matcher numérico), protegido con `middleware.auth()`. Arrancar `npm run dev` y comprobar:
  - que `node ace list:routes` muestra exactamente esas tres rutas de tareas;
  - que el diff regenerado de `.adonisjs/` queda en el working tree.
- [ ] 3.3 Comprobar la API con curl contra el servidor de desarrollo, usando un token de una cuenta de pruebas:
  - **sin token:** 401 en las tres operaciones;
  - **crear con título válido:** 201 con `pending`, responsable propio y título sin espacios en los extremos; los campos `status` y `assigneeId` que se envíen se ignoran;
  - **título inválido:** 422 en `title` si falta, está vacío, tiene solo espacios o pasa de 255 caracteres; 255 exactos se aceptan;
  - **listar:** 200 con `data` y cada elemento con exactamente `id`, `title`, `status` y `assignee{id,fullName}`;
  - **actualizar estado:** cualquier transición se acepta, incluida volver desde `done`; `status` inválido da 422; `assigneeId` inexistente da 422; un `id` inexistente da 404; enviar `title` no lo modifica;
  - **rutas que no existen:** `GET` y `DELETE` sobre `/tasks/:id` dan 404.
- [ ] 3.4 Ejecutar `npm run lint` en `backend/` y verificar que sale sin errores.

## 4. Cliente de API y tipos (frontend)

- [ ] 4.1 Añadir en `src/lib/types.ts` los tipos `TaskStatus` y `Task` (`assignee: { id, fullName: string | null }`), y en `src/lib/api.ts` las funciones `listTasks`, `createTask` y `updateTaskStatus`, que desenvuelven `data`. Verificar con `npm run build` en `frontend/`.
- [ ] 4.2 Añadir en `src/lib/api.ts` la etiqueta `title` y las traducciones específicas del título: «Escribe un título para la tarea.» para `required` y `minLength`, y «El título no puede superar los 255 caracteres.» para `maxLength`. Comprobarlo forzando cada caso desde la pantalla en la tarea 5.4.

## 5. Pantalla de la lista (frontend)

- [ ] 5.1 Crear `src/pages/tasks-page.tsx`:
  - cabecera «Tareas del equipo» con el enlace «Mi perfil»;
  - carga inicial con indicador de carga, y `Alert` con el mensaje en castellano si falla;
  - estado vacío explicativo que invita a crear la primera tarea;
  - filas con título, `assignee.fullName ?? 'Sin nombre'` y estado mostrado como Pendiente, En curso o Hecho.

  Verificar en el navegador con y sin tareas, y con el backend parado.
- [ ] 5.2 Añadir el formulario de creación con un único campo «Título» y el botón «Crear tarea», usando `useAuthForm(['title'])`:
  - comprobación local de título en blanco con `failWith`;
  - botón deshabilitado durante el envío;
  - la tarea devuelta se añade a la lista local y el campo se vacía solo si la creación sale bien.

  Verificar en el navegador que la tarea aparece sin recargar, en Pendiente y con tu nombre (o «Sin nombre»).
- [ ] 5.3 Añadir en cada fila el grupo de tres botones de estado:
  - el actual marcado con `aria-pressed`;
  - el cambio se aplica de inmediato en local;
  - los botones de esa fila quedan deshabilitados mientras la petición está en curso;
  - si falla, se vuelve al estado anterior y se muestra un aviso.

  Verificar en el navegador que el cambio persiste al recargar, que funciona en una tarea de otra cuenta y que se revierte con el backend parado.
- [ ] 5.4 Verificar en el navegador los errores del título: vacío y solo espacios (sin petición al servidor) y más de 255 caracteres (aviso bajo el campo, texto conservado sin recortar, ninguna fila nueva).

## 6. Rutas y navegación (frontend)

- [ ] 6.1 En `src/routes/app-routes.tsx`, añadir `/tasks` dentro de `ProtectedRoute` y cambiar el comodín a `/tasks`. En `src/routes/public-only-route.tsx`, cambiar el destino a `/tasks`. Verificar en el navegador:
  - login y registro aterrizan en `/tasks`;
  - `/`, cualquier dirección desconocida y `/login` con sesión llevan a `/tasks`;
  - `/tasks` sin sesión lleva a `/login`.
- [ ] 6.2 Añadir en `src/pages/profile-page.tsx` el enlace «Ver tareas» a `/tasks`. Verificar en el navegador la navegación de ida y vuelta entre perfil y lista.
- [ ] 6.3 Ejecutar `npm run lint` y `npm run build` en `frontend/` y verificar que salen sin errores.

## 7. Integración

- [ ] 7.1 Con dos cuentas en dos navegadores, verificar el recorrido completo:
  - las dos ven el mismo conjunto de tareas tras recargar;
  - una tarea creada por una aparece en la otra con su responsable;
  - cualquiera cambia el estado de cualquier tarea;
  - en ninguna fila aparece un correo, un id ni una fecha.
- [ ] 7.2 Ejecutar `openspec validate add-task-list --strict` y verificar que el change es válido.
