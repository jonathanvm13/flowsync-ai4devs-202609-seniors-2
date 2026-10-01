# Spec Delta

## Purpose

Dar al equipo una única lista compartida de tareas en la que cualquiera ve el título, el responsable y el estado de cada una. En esa misma lista se anota trabajo nuevo con solo un título y se mantiene al día en qué punto está cada tarea.

## ADDED Requirements

### Requirement: Estados de una tarea

Toda tarea SHALL estar en exactamente uno de tres estados, que la API representa como `pending`, `in_progress` y `done` y la aplicación web muestra como «Pendiente», «En curso» y «Hecho». El conjunto SHALL ser cerrado: no existe ninguna forma de añadir, renombrar ni eliminar estados, y la API SHALL rechazar con 422 cualquier otro valor.

#### Scenario: Estado fuera del conjunto

- **WHEN** se intenta poner a una tarea un estado distinto de `pending`, `in_progress` o `done` (por ejemplo `pendiente`, `blocked` o `DONE`)
- **THEN** la respuesta es 422 con un error en el campo `status` y la tarea conserva su estado anterior

#### Scenario: Nombres en pantalla

- **WHEN** la lista muestra tareas en `pending`, `in_progress` y `done`
- **THEN** sus estados se leen «Pendiente», «En curso» y «Hecho», respectivamente, y en ningún sitio aparece el identificador en inglés

### Requirement: Acceso a las tareas solo con sesión

La API SHALL exigir un token de acceso válido en las tres operaciones de tareas (listar, crear y actualizar) y SHALL responder 401 sin revelar ninguna tarea cuando falte o no sea válido.

#### Scenario: Petición sin token

- **WHEN** se lista, se crea o se actualiza una tarea sin cabecera `Authorization` o con un token revocado
- **THEN** la respuesta es 401, no incluye ninguna tarea y no se crea ni se modifica nada

### Requirement: Listado de todas las tareas

La API SHALL devolver en `GET /api/v1/tasks` todas las tareas existentes dentro de `data`, sin filtrar por quién pregunta. De cada tarea SHALL devolver solo su `id`, su `title`, su `status` y su `assignee`, este último con solo `id` y `fullName`. La API SHALL NOT exponer el correo ni ningún otro dato de la cuenta del responsable, ni ninguna fecha.

#### Scenario: Misma respuesta para todos

- **WHEN** dos personas distintas con sesión piden el listado sin que nadie haya cambiado nada entre medias
- **THEN** reciben exactamente el mismo conjunto de tareas

#### Scenario: Tareas creadas por otros

- **WHEN** otra persona crea una tarea y luego yo pido el listado
- **THEN** esa tarea aparece en mi respuesta, con ella misma como responsable

#### Scenario: Forma de cada tarea

- **WHEN** se pide el listado y hay tareas
- **THEN** cada elemento de `data` tiene exactamente `id`, `title`, `status` y `assignee: { id, fullName }`, sin `email` ni campos de fecha

#### Scenario: Responsable sin nombre

- **WHEN** el responsable de una tarea no tiene nombre puesto
- **THEN** su `assignee.fullName` es `null`, y no se rellena con su correo

#### Scenario: Sin tareas

- **WHEN** se pide el listado y no existe ninguna tarea
- **THEN** la respuesta es 200 con `data` como lista vacía

#### Scenario: Listar no modifica nada

- **WHEN** se pide el listado una o varias veces
- **THEN** ninguna tarea cambia de estado ni de responsable

#### Scenario: Sin orden garantizado

- **WHEN** se pide el listado
- **THEN** la respuesta no promete ningún orden concreto de las tareas

### Requirement: Creación de una tarea con solo el título

La API SHALL crear una tarea en `POST /api/v1/tasks` a partir únicamente de `title`. La tarea SHALL nacer en estado `pending` y con quien la crea como responsable, y la API SHALL responder 201 con la tarea creada dentro de `data`, con la misma forma que en el listado.

#### Scenario: Creación correcta

- **WHEN** una persona con sesión envía un `title` válido
- **THEN** la respuesta es 201 con la tarea nueva, con `status` igual a `pending` y `assignee` igual a esa persona, y la tarea aparece desde ese momento en el listado de cualquiera

#### Scenario: Se ignora lo que no es el título

- **WHEN** la petición de creación incluye además `status`, `assigneeId` o cualquier otro campo
- **THEN** la tarea se crea igualmente en `pending` y con quien la crea como responsable, sin tener en cuenta esos campos

#### Scenario: Espacios alrededor del título

- **WHEN** el `title` enviado tiene espacios al principio o al final
- **THEN** la tarea se guarda con el título sin esos espacios

### Requirement: Título obligatorio y acotado

La API SHALL rechazar con 422, con un error en el campo `title`, la creación de una tarea cuyo título falte, esté vacío, contenga solo espacios o supere los 255 caracteres una vez quitados los espacios de los extremos. En ese caso SHALL NOT crear ninguna tarea ni guardar una versión recortada.

#### Scenario: Sin título

- **WHEN** se intenta crear una tarea sin `title`, o con `title` vacío
- **THEN** la respuesta es 422 con un error en `title` y no se crea ninguna tarea

#### Scenario: Título en blanco

- **WHEN** se intenta crear una tarea cuyo `title` contiene solo espacios
- **THEN** la respuesta es 422 con un error en `title`, igual que si estuviera vacío, y no se crea ninguna tarea

#### Scenario: Título demasiado largo

- **WHEN** se intenta crear una tarea con un `title` de más de 255 caracteres
- **THEN** la respuesta es 422 con un error de longitud máxima en `title` y no se guarda ninguna tarea, ni completa ni recortada

#### Scenario: Título en el límite

- **WHEN** se crea una tarea con un `title` de exactamente 255 caracteres
- **THEN** la tarea se crea con el título completo

### Requirement: Actualización del estado y del responsable

La API SHALL permitir, en `PATCH /api/v1/tasks/:id`, cambiar el `status` y el responsable (`assigneeId`) de cualquier tarea a cualquier persona con sesión, sea o no su responsable, y SHALL responder 200 con la tarea actualizada dentro de `data`. No hay restricción de transiciones: se SHALL poder pasar de cualquier estado a cualquier otro.

#### Scenario: Cambiar el estado de una tarea propia

- **WHEN** el responsable de una tarea envía un `status` válido
- **THEN** la respuesta es 200 con la tarea en el nuevo estado, y el listado lo refleja

#### Scenario: Cambiar el estado de una tarea ajena

- **WHEN** una persona cambia el estado de una tarea cuyo responsable es otra
- **THEN** el cambio se aplica igual que si fuera suya, sin requerir ningún permiso adicional

#### Scenario: Volver atrás desde Hecho

- **WHEN** una tarea en `done` se actualiza a `pending` o `in_progress`
- **THEN** el cambio se acepta

#### Scenario: Reasignar

- **WHEN** se envía un `assigneeId` que corresponde a una cuenta existente
- **THEN** la tarea pasa a tener a esa persona como responsable, y la respuesta muestra su `id` y su `fullName`

#### Scenario: Responsable inexistente

- **WHEN** se envía un `assigneeId` que no corresponde a ninguna cuenta
- **THEN** la respuesta es 422 con un error en el campo `assigneeId` y la tarea no cambia

#### Scenario: Tarea inexistente

- **WHEN** se intenta actualizar una tarea con un `id` que no existe
- **THEN** la respuesta es 404

#### Scenario: El título no se edita

- **WHEN** la petición de actualización incluye `title` u otros campos que no son `status` ni `assigneeId`
- **THEN** esos campos se ignoran y el título de la tarea no cambia

### Requirement: Solo tres operaciones de tareas

La API SHALL ofrecer exactamente tres operaciones sobre tareas: listarlas todas, crear una y actualizarla. SHALL NOT existir lectura individual de una tarea, borrado ni operaciones de equipo.

#### Scenario: Leer o borrar una tarea concreta

- **WHEN** se hace `GET` o `DELETE` sobre `/api/v1/tasks/:id`
- **THEN** la petición no es atendida por ninguna operación de tareas (respuesta 404) y no se devuelve ni se borra nada

### Requirement: Pantalla de la lista del equipo

La aplicación web SHALL mostrar en `/tasks`, solo con sesión iniciada, una única lista con todas las tareas, igual para cualquier persona. Cada fila SHALL mostrar el título, el nombre del responsable y el estado de la tarea, sin necesidad de abrirla. No SHALL existir ninguna otra vista de tareas, como «mis tareas».

#### Scenario: Cada fila responde quién está en qué

- **WHEN** una persona abre `/tasks` y hay tareas
- **THEN** cada fila muestra el título, el nombre del responsable y su estado como «Pendiente», «En curso» o «Hecho», sin hacer clic en nada

#### Scenario: El responsable se identifica por su nombre

- **WHEN** el responsable de una tarea tiene nombre
- **THEN** la fila muestra ese nombre, y nunca su correo ni su identificador

#### Scenario: Responsable sin nombre en pantalla

- **WHEN** el responsable de una tarea no tiene nombre puesto
- **THEN** la fila muestra «Sin nombre» en su lugar

#### Scenario: Sin fechas en la lista

- **WHEN** una persona recorre la lista
- **THEN** no ve ninguna fecha ni ninguna marca de vencimiento

#### Scenario: Lista vacía

- **WHEN** una persona abre `/tasks` y no existe ninguna tarea
- **THEN** en lugar de una lista vacía ve un mensaje que explica que es la lista compartida del equipo y la invita a crear la primera tarea

#### Scenario: Sin sesión no se ven tareas

- **WHEN** alguien sin sesión intenta abrir `/tasks`
- **THEN** es redirigido a `/login` sin ver ninguna tarea

#### Scenario: Cargando

- **WHEN** la lista todavía se está pidiendo al servidor
- **THEN** se muestra un indicador de carga en lugar de la lista

#### Scenario: Error al cargar la lista

- **WHEN** el servidor no responde o devuelve un error al pedir la lista
- **THEN** se muestra un aviso con el motivo en castellano, en lugar de una lista vacía

### Requirement: Crear una tarea desde la lista

La aplicación web SHALL ofrecer en `/tasks` un formulario con un único campo, «Título», y un botón para crear la tarea. El formulario SHALL NOT ofrecer ni sugerir responsable, estado ni fecha. La tarea creada SHALL aparecer en la lista sin recargar ni navegar, y el campo SHALL quedar vacío para anotar la siguiente.

#### Scenario: Crear con solo el título

- **WHEN** una persona escribe un título y pulsa el botón de crear
- **THEN** la tarea aparece en la lista sin recargar la página, con su nombre (o «Sin nombre») como responsable y en «Pendiente», y el campo «Título» queda vacío

#### Scenario: El formulario no pide nada más

- **WHEN** una persona recorre el formulario de creación
- **THEN** el único dato que puede introducir es el título

#### Scenario: Título vacío o en blanco

- **WHEN** una persona intenta crear una tarea con el título vacío o solo con espacios
- **THEN** bajo el campo aparece «Escribe un título para la tarea.», no se crea ninguna tarea y no aparece ninguna fila sin texto

#### Scenario: Título demasiado largo en pantalla

- **WHEN** una persona intenta crear una tarea con un título de más de 255 caracteres
- **THEN** bajo el campo aparece «El título no puede superar los 255 caracteres.», no se crea ninguna tarea y el texto escrito se conserva en el campo sin recortar

#### Scenario: Creación en curso

- **WHEN** la persona ha pulsado el botón de crear y el servidor aún no ha respondido
- **THEN** el botón queda deshabilitado hasta la respuesta, de modo que un doble clic no crea dos tareas

#### Scenario: Fallo al crear

- **WHEN** el servidor no responde o devuelve un error que no es de validación al crear
- **THEN** se muestra un aviso con el motivo en castellano, no aparece ninguna fila nueva y el título escrito se conserva

### Requirement: Cambiar el estado desde la lista

La aplicación web SHALL permitir cambiar el estado de cualquier tarea desde su propia fila, con un solo gesto, sin abrir la tarea, sin diálogos de confirmación y sin rellenar campos. Los únicos destinos ofrecidos SHALL ser «Pendiente», «En curso» y «Hecho». La pantalla SHALL NOT ofrecer cambiar el responsable.

#### Scenario: Cambio desde la fila

- **WHEN** una persona elige otro estado en la fila de una tarea
- **THEN** la fila muestra el nuevo estado de inmediato, sin abrir nada ni pedir confirmación, y el cambio queda guardado al recargar

#### Scenario: Tarea de otra persona

- **WHEN** una persona cambia el estado de una tarea cuyo responsable es otra
- **THEN** el cambio se aplica igual, sin ningún aviso ni petición de permiso

#### Scenario: Solo tres destinos

- **WHEN** una persona mira a qué estados puede llevar una tarea
- **THEN** se le ofrecen exactamente «Pendiente», «En curso» y «Hecho», con el actual marcado como tal

#### Scenario: El cambio falla

- **WHEN** el servidor rechaza el cambio de estado o no responde
- **THEN** la fila vuelve al estado que tenía y se muestra un aviso con el motivo en castellano

#### Scenario: Una tarea con un cambio pendiente

- **WHEN** el cambio de estado de una fila aún no ha sido confirmado por el servidor
- **THEN** los controles de estado de esa fila quedan deshabilitados hasta la respuesta, y el resto de filas siguen utilizables
