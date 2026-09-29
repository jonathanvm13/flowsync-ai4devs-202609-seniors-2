# Cuentas y acceso

## Purpose

Permitir que una persona cree una cuenta en FlowSync, inicie y cierre sesión, y consulte su perfil, de modo que solo quien se ha identificado pueda acceder a la parte privada de la aplicación.

## Requirements

### Requirement: Formato común de las respuestas de la API de cuentas

El sistema SHALL responder en JSON a todas las peticiones de la API de cuentas, independientemente de la cabecera `Accept` que envíe el cliente; SHALL envolver las respuestas correctas de registro, inicio de sesión y perfil en un objeto `{ "data": ... }`; y SHALL devolver los errores como `{ "errors": [ ... ] }`, donde cada error lleva un `message` en inglés y, cuando el error es de validación, también `rule`, `field` y, si aplica, `meta`.

#### Scenario: Respuesta correcta envuelta en `data`

- **WHEN** un cliente hace una petición válida a `POST /api/v1/auth/signup`, `POST /api/v1/auth/login` o `GET /api/v1/account/profile`
- **THEN** el cuerpo de la respuesta es un objeto con una única clave `data` que contiene el resultado

#### Scenario: Error en JSON aunque el cliente no pida JSON

- **WHEN** un cliente envía a `POST /api/v1/auth/login` un cuerpo inválido sin cabecera `Accept: application/json`
- **THEN** la respuesta sigue siendo JSON con la forma `{ "errors": [ ... ] }`

### Requirement: Representación pública de una cuenta

El sistema SHALL representar una cuenta en la API con exactamente los campos `id` (número), `fullName` (texto o `null`), `email`, `initials`, `createdAt` y `updatedAt` (fechas ISO 8601 con desfase horario), y SHALL NOT exponer nunca la contraseña ni su hash.

#### Scenario: Campos de una cuenta

- **WHEN** la API devuelve una cuenta en cualquier respuesta de registro, inicio de sesión o perfil
- **THEN** el objeto contiene `id`, `fullName`, `email`, `initials`, `createdAt` y `updatedAt`, y no contiene ningún campo con la contraseña

#### Scenario: Iniciales a partir de nombre con dos o más palabras

- **WHEN** la cuenta tiene como nombre completo `Ada Lovelace King`
- **THEN** `initials` vale `AL`: la primera letra de las dos primeras palabras, en mayúsculas

#### Scenario: Iniciales a partir de nombre de una sola palabra

- **WHEN** la cuenta tiene como nombre completo `ada`
- **THEN** `initials` vale `AD`: las dos primeras letras de esa palabra, en mayúsculas

#### Scenario: Iniciales sin nombre

- **WHEN** la cuenta no tiene nombre completo y su email es `yolanda@spec.test`
- **THEN** `initials` vale `YS`: la primera letra de lo que va antes de la arroba y la primera de lo que va después, en mayúsculas

### Requirement: Registro de una cuenta por API

El sistema SHALL permitir crear una cuenta sin autenticación mediante `POST /api/v1/auth/signup` con `fullName`, `email`, `password` y `passwordConfirmation`; y, si los datos son válidos, SHALL crear la cuenta, dejarla con la sesión iniciada y responder `200` con `data.user` (la cuenta creada) y `data.token` (un token de acceso nuevo).

#### Scenario: Registro correcto

- **WHEN** un cliente envía `fullName: "Ada Lovelace King"`, un email no registrado, `password` de entre 8 y 32 caracteres y `passwordConfirmation` idéntica
- **THEN** la respuesta es `200` con `data.user` con esos datos y `data.token`, una cadena que empieza por `oat_` y sirve de inmediato para autenticarse

#### Scenario: Registro sin nombre

- **WHEN** un cliente envía `fullName: null` o `fullName: ""` junto con datos válidos
- **THEN** la cuenta se crea y `data.user.fullName` vale `null`

#### Scenario: Espacios alrededor del email

- **WHEN** un cliente envía el email con espacios delante o detrás
- **THEN** la cuenta se crea con el email sin esos espacios

### Requirement: Validación del registro por API

El sistema SHALL rechazar con `422` un registro cuyos datos no cumplan las reglas, sin crear la cuenta, y SHALL devolver un error por cada regla incumplida, indicando el `field` y la `rule`. Las reglas son: los cuatro campos deben venir en el cuerpo (`fullName` puede valer `null`); `email` debe ser una dirección válida de como mucho 254 caracteres y no estar ya registrada; `password` y `passwordConfirmation` deben tener entre 8 y 32 caracteres; y `passwordConfirmation` debe coincidir con `password`.

#### Scenario: Cuerpo vacío

- **WHEN** un cliente envía `{}` a `POST /api/v1/auth/signup`
- **THEN** la respuesta es `422` con un error `required` para cada uno de `fullName`, `email`, `password` y `passwordConfirmation`

#### Scenario: Falta la clave `fullName`

- **WHEN** un cliente envía email y contraseñas válidos pero omite la clave `fullName`
- **THEN** la respuesta es `422` con un error `required` sobre `fullName` y la cuenta no se crea

#### Scenario: Email con formato inválido

- **WHEN** un cliente envía `email: "nope"`
- **THEN** la respuesta incluye un error `email` sobre el campo `email`

#### Scenario: Contraseña demasiado corta

- **WHEN** un cliente envía una `password` de menos de 8 caracteres
- **THEN** la respuesta incluye un error `minLength` sobre `password` con `meta.min` igual a `8`

#### Scenario: Contraseña demasiado larga

- **WHEN** un cliente envía una `password` de más de 32 caracteres
- **THEN** la respuesta incluye un error `maxLength` sobre `password` con `meta.max` igual a `32`

#### Scenario: Confirmación distinta

- **WHEN** un cliente envía `password` y `passwordConfirmation` válidas en longitud pero diferentes
- **THEN** la respuesta es `422` con un error `sameAs` sobre `passwordConfirmation`

#### Scenario: Email ya registrado

- **WHEN** un cliente intenta registrarse con un email idéntico al de una cuenta existente
- **THEN** la respuesta es `422` con un error `database.unique` sobre `email` y mensaje `The email has already been taken`

#### Scenario: Mismo email con distintas mayúsculas

- **WHEN** existe una cuenta con `ana@spec.test` y un cliente se registra con `ANA@SPEC.TEST`
- **THEN** el registro se acepta y se crea una segunda cuenta distinta, porque el email se compara distinguiendo mayúsculas y minúsculas

### Requirement: Inicio de sesión por API

El sistema SHALL permitir iniciar sesión sin autenticación mediante `POST /api/v1/auth/login` con `email` y `password`; si las credenciales corresponden a una cuenta, SHALL responder `200` con `data.user` y un `data.token` nuevo; y cada inicio de sesión SHALL emitir un token distinto que convive con los anteriores de la misma cuenta.

#### Scenario: Credenciales correctas

- **WHEN** un cliente envía el email y la contraseña de una cuenta existente
- **THEN** la respuesta es `200` con `data.user` de esa cuenta y un `data.token` nuevo que empieza por `oat_`

#### Scenario: Varias sesiones a la vez

- **WHEN** la misma cuenta inicia sesión dos veces y obtiene dos tokens
- **THEN** ambos tokens sirven para autenticarse, y cerrar sesión con uno no invalida el otro

#### Scenario: El email distingue mayúsculas

- **WHEN** un cliente inicia sesión con el email de una cuenta existente escrito con otras mayúsculas y no existe otra cuenta con esa grafía exacta
- **THEN** el inicio de sesión se rechaza como credenciales inválidas

### Requirement: Rechazo de inicio de sesión por API

El sistema SHALL responder `422` con errores de validación cuando falten `email` o `password` o el email no tenga formato válido, y SHALL responder `400` con un único error de mensaje `Invalid user credentials`, sin `field`, cuando el email no exista o la contraseña no sea la suya, sin revelar cuál de las dos cosas ha fallado.

#### Scenario: Faltan campos

- **WHEN** un cliente envía `{}` a `POST /api/v1/auth/login`
- **THEN** la respuesta es `422` con un error `required` sobre `email` y otro sobre `password`

#### Scenario: Email con formato inválido

- **WHEN** un cliente envía `email: "nope"`
- **THEN** la respuesta es `422` con un error `email` sobre `email`

#### Scenario: Contraseña incorrecta

- **WHEN** un cliente envía el email de una cuenta existente con una contraseña que no es la suya
- **THEN** la respuesta es `400` con `{ "errors": [{ "message": "Invalid user credentials" }] }`

#### Scenario: Email inexistente

- **WHEN** un cliente envía un email con formato válido que no pertenece a ninguna cuenta
- **THEN** la respuesta es idéntica a la de contraseña incorrecta: `400` con `Invalid user credentials`

### Requirement: Autenticación con token en la API

El sistema SHALL exigir en `GET /api/v1/account/profile` y `POST /api/v1/account/logout` una cabecera `Authorization: Bearer <token>` con un token vigente, y SHALL responder `401` con `{ "errors": [{ "message": "Unauthorized access" }] }` cuando falte o no sea válido. Los tokens SHALL NOT caducar por tiempo: solo dejan de valer al cerrar sesión con ellos.

#### Scenario: Sin token

- **WHEN** un cliente llama a `GET /api/v1/account/profile` o a `POST /api/v1/account/logout` sin cabecera `Authorization`
- **THEN** la respuesta es `401` con `Unauthorized access`

#### Scenario: Token inventado

- **WHEN** un cliente envía `Authorization: Bearer oat_xxx`
- **THEN** la respuesta es `401` con `Unauthorized access`

### Requirement: Consulta del perfil por API

El sistema SHALL devolver en `GET /api/v1/account/profile` la cuenta a la que pertenece el token enviado.

#### Scenario: Perfil con token válido

- **WHEN** un cliente llama a `GET /api/v1/account/profile` con un token vigente
- **THEN** la respuesta es `200` con `data` igual a la representación pública de la cuenta dueña de ese token

### Requirement: Cierre de sesión por API

El sistema SHALL invalidar, en `POST /api/v1/account/logout`, únicamente el token con el que se hace la petición, y SHALL responder `200` con `{ "message": "Logged out successfully" }`, sin envoltorio `data`.

#### Scenario: Cierre de sesión correcto

- **WHEN** un cliente llama a `POST /api/v1/account/logout` con un token vigente
- **THEN** la respuesta es `200` con `{ "message": "Logged out successfully" }`

#### Scenario: El token cerrado deja de valer

- **WHEN** un cliente usa, después de cerrar sesión, el mismo token en `GET /api/v1/account/profile` o en `POST /api/v1/account/logout`
- **THEN** la respuesta es `401` con `Unauthorized access`

### Requirement: Acceso a las pantallas según la sesión

La aplicación web SHALL mostrar las pantallas de inicio de sesión (`/login`) y registro (`/register`) solo a quien no tiene sesión, y la de perfil (`/profile`) solo a quien la tiene; SHALL redirigir cualquier otra dirección a `/profile`; y las redirecciones SHALL reemplazar la entrada del historial en vez de añadir una nueva.

#### Scenario: Visitante sin sesión en una pantalla privada

- **WHEN** una persona sin sesión abre `/profile`
- **THEN** es llevada a `/login`

#### Scenario: Persona con sesión en una pantalla pública

- **WHEN** una persona con sesión abre `/login` o `/register`
- **THEN** es llevada a `/profile`

#### Scenario: Dirección desconocida

- **WHEN** una persona abre una dirección que no es `/login`, `/register` ni `/profile`, por ejemplo `/`
- **THEN** es llevada a `/profile`, y de ahí a `/login` si no tiene sesión

### Requirement: Recordar la sesión entre visitas

La aplicación web SHALL recordar en el navegador la sesión iniciada, de modo que siga activa al recargar o volver más tarde; al arrancar con una sesión recordada, SHALL comprobarla contra el servidor antes de decidir qué mostrar, y mientras tanto SHALL mostrar un indicador de carga a pantalla completa (anunciado como «Cargando…» a lectores de pantalla).

#### Scenario: Sesión recordada y vigente

- **WHEN** una persona con una sesión recordada recarga la página y el servidor reconoce su sesión
- **THEN** ve el indicador de carga y después sigue en la pantalla que había pedido, con sus datos de perfil, sin tener que volver a entrar

#### Scenario: Sesión recordada que el servidor ya no reconoce

- **WHEN** la aplicación arranca con una sesión recordada que el servidor rechaza (por ejemplo, porque se cerró desde otro sitio)
- **THEN** el navegador olvida la sesión, la persona llega a la pantalla de inicio de sesión y ve el aviso «Tu sesión ha caducado. Vuelve a iniciar sesión.»

#### Scenario: Servidor inaccesible al arrancar

- **WHEN** la aplicación arranca con una sesión recordada y no consigue contactar con el servidor
- **THEN** la persona llega a la pantalla de inicio de sesión con el aviso «No se pudo conectar con el servidor. Comprueba que el backend está arrancado.», y el navegador conserva la sesión recordada, de modo que al recargar con el servidor disponible vuelve a entrar sin escribir credenciales

#### Scenario: Error del servidor al arrancar

- **WHEN** la aplicación arranca con una sesión recordada y el servidor responde con un error que no es de autenticación
- **THEN** la persona llega a la pantalla de inicio de sesión con el aviso «Algo ha ido mal en el servidor. Inténtalo de nuevo en un momento.» y la sesión recordada se conserva

### Requirement: Pantalla de inicio de sesión

La aplicación web SHALL ofrecer en `/login`, bajo el título de marca «FlowSync», una tarjeta «Inicia sesión» con el texto «Entra con tu cuenta para volver a tus tareas.», los campos «Email» (con ejemplo «tu@email.com») y «Contraseña», el botón «Entrar» y el enlace «¿Aún no tienes cuenta? Crea una» que lleva a `/register`.

#### Scenario: Inicio de sesión correcto

- **WHEN** una persona sin sesión escribe el email y la contraseña de su cuenta y pulsa «Entrar»
- **THEN** el botón pasa a «Entrando…» y queda deshabilitado mientras dura el envío, y después la persona llega a su perfil con la sesión iniciada y recordada

#### Scenario: Credenciales incorrectas

- **WHEN** una persona envía un email o una contraseña que no corresponden a ninguna cuenta
- **THEN** ve arriba del formulario el aviso de error «El email o la contraseña no son correctos.» y sigue en la misma pantalla con lo que había escrito

#### Scenario: Formulario vacío

- **WHEN** una persona pulsa «Entrar» sin rellenar nada
- **THEN** el navegador no bloquea el envío por su cuenta, y la persona ve «Falta rellenar el email.» bajo el email y «Falta rellenar la contraseña.» bajo la contraseña, con ambos campos marcados como inválidos

#### Scenario: Email con formato inválido

- **WHEN** una persona envía un email sin formato válido
- **THEN** ve «Introduce una dirección de email válida.» bajo el campo email

#### Scenario: Aviso de sesión perdida

- **WHEN** la persona ha llegado a esta pantalla porque su sesión recordada no se pudo restaurar
- **THEN** ve el motivo en el aviso de arriba mientras no haya un error propio del intento actual que mostrar, y el aviso desaparece al iniciar sesión con éxito

### Requirement: Pantalla de registro

La aplicación web SHALL ofrecer en `/register`, bajo el título de marca «FlowSync», una tarjeta «Crea tu cuenta» con el texto «Regístrate para empezar a organizar el trabajo del equipo.», los campos «Nombre completo (opcional)» (con ejemplo «Ada Lovelace»), «Email», «Contraseña» (con la pista «Entre 8 y 32 caracteres.») y «Repite la contraseña», el botón «Crear cuenta» y el enlace «¿Ya tienes cuenta? Inicia sesión» que lleva a `/login`.

#### Scenario: Registro correcto

- **WHEN** una persona sin sesión rellena email, contraseña y confirmación válidas y coincidentes, con o sin nombre, y pulsa «Crear cuenta»
- **THEN** el botón pasa a «Creando cuenta…» y queda deshabilitado mientras dura el envío, y después la persona llega a su perfil con la sesión ya iniciada y recordada, sin pasar por el inicio de sesión

#### Scenario: Nombre en blanco

- **WHEN** una persona deja el nombre vacío o solo con espacios
- **THEN** la cuenta se crea sin nombre; si escribe un nombre con espacios alrededor, se guarda sin ellos

#### Scenario: Contraseñas que no coinciden

- **WHEN** una persona escribe una contraseña y una confirmación distintas y pulsa «Crear cuenta»
- **THEN** ve «Las contraseñas no coinciden.» bajo «Repite la contraseña» sin que se llegue a enviar nada al servidor

#### Scenario: Email ya registrado

- **WHEN** una persona intenta registrarse con un email que ya tiene cuenta
- **THEN** ve bajo el campo email «Ese email ya está registrado. Inicia sesión en su lugar.»

#### Scenario: Contraseña demasiado corta

- **WHEN** una persona envía una contraseña y una confirmación iguales de menos de 8 caracteres
- **THEN** ve «la contraseña debe tener al menos 8 caracteres.» bajo la contraseña, en lugar de la pista, y «la confirmación de la contraseña debe tener al menos 8 caracteres.» bajo la confirmación

#### Scenario: Contraseña demasiado larga

- **WHEN** una persona envía una contraseña de más de 32 caracteres
- **THEN** ve «la contraseña no puede superar los 32 caracteres.» bajo la contraseña

#### Scenario: Formulario vacío

- **WHEN** una persona pulsa «Crear cuenta» sin rellenar nada
- **THEN** ve «Falta rellenar el email.», «Falta rellenar la contraseña.» y «Falta rellenar la confirmación de la contraseña.» bajo sus campos respectivos

### Requirement: Presentación de errores en los formularios de acceso

La aplicación web SHALL mostrar en los formularios de inicio de sesión y registro cada error de validación bajo el campo al que se refiere (uno por campo, el primero), marcando ese campo como inválido y enlazando el mensaje al campo para lectores de pantalla; SHALL mostrar en un aviso destacado arriba del formulario los errores que no son de un campo concreto; SHALL borrar los errores anteriores en cada nuevo envío; y SHALL volver a habilitar el botón al terminar el envío, falle o no.

#### Scenario: Error de un campo concreto

- **WHEN** el servidor rechaza el envío por un problema de validación en campos que el formulario muestra
- **THEN** cada mensaje aparece bajo su campo y no aparece aviso general arriba

#### Scenario: Servidor inaccesible al enviar

- **WHEN** una persona envía cualquiera de los dos formularios y no se consigue contactar con el servidor
- **THEN** ve arriba el aviso «No se pudo conectar con el servidor. Comprueba que el backend está arrancado.» y puede volver a intentarlo

#### Scenario: Error inesperado del servidor

- **WHEN** el servidor responde a un envío con un error que no es de validación, de credenciales ni de autenticación
- **THEN** ve arriba el aviso «Algo ha ido mal en el servidor. Inténtalo de nuevo en un momento.»

### Requirement: Pantalla de perfil

La aplicación web SHALL mostrar en `/profile` una tarjeta con un círculo con las iniciales de la cuenta, el nombre completo (o «Sin nombre» si no tiene), el email, la línea «Miembro desde» con la fecha de alta en formato largo en castellano (por ejemplo, «28 de septiembre de 2026»), y un botón «Cerrar sesión».

#### Scenario: Perfil con nombre

- **WHEN** una persona con sesión cuyo nombre es «Ada Lovelace» abre su perfil
- **THEN** ve «AL» en el círculo, «Ada Lovelace» como título, su email debajo y la fecha en que creó la cuenta junto a «Miembro desde»

#### Scenario: Perfil sin nombre

- **WHEN** una persona con sesión que se registró sin nombre abre su perfil
- **THEN** ve «Sin nombre» como título y en el círculo las iniciales derivadas de su email

### Requirement: Cierre de sesión desde la pantalla

La aplicación web SHALL cerrar la sesión en el navegador en cuanto la persona pulsa «Cerrar sesión», llevarla a `/login` sin ningún aviso de error y pedir al servidor que invalide el token; si esa petición al servidor falla, SHALL dar igualmente la sesión por cerrada en el navegador.

#### Scenario: Cerrar sesión

- **WHEN** una persona con sesión pulsa «Cerrar sesión» en su perfil
- **THEN** llega a la pantalla de inicio de sesión sin avisos, el navegador deja de recordar su sesión y al recargar sigue sin sesión

#### Scenario: Cerrar sesión con el servidor caído

- **WHEN** una persona pulsa «Cerrar sesión» y el servidor no está accesible
- **THEN** llega igualmente a la pantalla de inicio de sesión sin sesión en el navegador y sin ver ningún error
