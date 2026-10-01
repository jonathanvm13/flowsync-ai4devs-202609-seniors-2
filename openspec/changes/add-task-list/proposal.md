# Proposal

## Why

FlowSync todavía no tiene tareas: solo hay cuentas, acceso y perfil. Hace falta la base que piden las historias del backlog para que el equipo pueda anotar en qué anda cada uno y saber en qué está el resto sin preguntar. Esas historias son E3-1 (lista compartida), E2-1 (crear solo con el título), E2-2 (título obligatorio), E2-3 (nace mía y pendiente) y E2-4 (cambiar el estado desde la lista). E3-1 y E2-1 encabezan el orden priorizado y bloquean el resto de las épicas E2 y E3.

## What Changes

- **API de tareas** con exactamente tres operaciones, todas tras iniciar sesión:
  - listar todas las tareas;
  - crear una tarea solo con el título;
  - actualizar el estado y el responsable de cualquier tarea.
- Los estados forman un conjunto cerrado y viajan como `pending`, `in_progress` y `done`. Cualquier otro valor se rechaza con 422.
- **Una tarea nueva** nace en `pending` y tiene como responsable a quien la crea. El título es obligatorio y se guarda sin espacios al principio ni al final:
  - si solo tiene espacios, se trata como vacío;
  - si tiene más de 255 caracteres, se rechaza con 422 en vez de recortarse.
- **Del responsable** la API expone solo lo que la lista necesita: su identificador y su nombre. Nunca el correo ni el resto de la cuenta.
- **Pantalla de lista** en `/tasks`, una sola y la misma para todas las personas:
  - cada fila muestra el título, el nombre del responsable («Sin nombre» si no tiene) y el estado como Pendiente, En curso o Hecho;
  - el estado se cambia desde la propia fila;
  - si no hay tareas, se explica qué es la lista y se invita a crear la primera;
  - un formulario con un único campo, el título, permite crear tareas, y la nueva aparece en la lista sin recargar.
- **Cambio en auth.** `/tasks` pasa a ser la portada de la aplicación:
  - tras iniciar sesión o registrarse, y desde cualquier dirección desconocida, se aterriza en la lista en vez de en el perfil;
  - el perfil sigue disponible desde un enlace.

## Capabilities

### New Capabilities

- `tasks`: la lista compartida de tareas del equipo. Cubre la API para listar, crear y actualizar, el conjunto cerrado de estados, los valores por defecto al crear, la validación del título y la pantalla de lista con creación y cambio de estado.

### Modified Capabilities

- `auth`: cambian los requisitos «Pantalla de registro», «Pantalla de inicio de sesión», «Pantalla de perfil» y «Protección de rutas». El destino tras entrar o registrarse, y el de cualquier dirección desconocida, pasa de `/profile` a `/tasks`. `/tasks` se añade como pantalla protegida y queda un enlace entre la lista y el perfil.

## Impact

- **Backend:**
  - nueva tabla de tareas con referencia al usuario responsable;
  - nuevo modelo, validadores, transformer y controlador;
  - tres rutas nuevas bajo `/api/v1`, protegidas por el middleware de auth;
  - se regeneran `database/schema.ts` y los ficheros de `.adonisjs/`.
- **Frontend:**
  - nuevas llamadas en el cliente de API;
  - nueva página y ruta protegida;
  - cambian los destinos de redirección de los guards y el comodín de rutas;
  - se añade un enlace desde y hacia el perfil;
  - solo se reutilizan los componentes de `src/components/ui/`.
- Sin dependencias nuevas ni base de pruebas: este change no incluye tests.

## Non-goals

- Fecha de vencimiento: la tarea no la tiene y la lista no muestra fechas ni marcas de vencida (E3-1 CA-7 queda fuera).
- Leer una tarea individual, borrar tareas o tener endpoints de equipo.
- Reasignar desde la pantalla: la API lo admite, pero en la interfaz se hará en su propia historia, que necesitará saber a quién se puede asignar.
- Editar el título.
- Filtrar por estado y ocultar las tareas hechas (RF-20 y RF-21): en este change las tareas hechas siguen en la lista.
- Que la lista se refresque sola con los cambios de otras personas (E3-2).
- Señales de presencia (E3-1 CA-12, [PROPUESTO]): se descartó incluirlo como criterio.

## Open points

- **Orden de la lista (PA-3).** No hay regla de orden decidida. La API no ordena de forma explícita y la interfaz no reordena. El orden en que salen las tareas no forma parte del contrato y no debe darse por estable.
- **Transiciones de estado (PA-7).** Se puede pasar de cualquier estado a cualquier otro, incluso volver desde Hecho, porque ningún requisito restringe el grafo. Si PA-7 se decide, cambiará.
- **Umbral del título (PA-9).** Se fija en 255 caracteres para poder cumplir E2-2 CA-3. Es una decisión provisional, a la espera de que producto la confirme.
- **Límite de tareas «En curso» por persona (PA-4)** y **colisiones entre personas (PA-8)**: siguen sin decidir y este change no los trata.
