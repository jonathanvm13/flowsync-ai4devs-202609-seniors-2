# auth Specification

## Purpose

Permitir que una persona cree una cuenta en FlowSync, inicie y cierre sesión, y consulte su perfil; la API identifica a quien llama mediante un token de acceso, y la aplicación web mantiene esa sesión entre recargas y protege las pantallas privadas.

## Requirements

### Requirement: Registro de cuenta

La API SHALL permitir crear una cuenta con `POST /api/v1/auth/signup` enviando `fullName`, `email`, `password` y `passwordConfirmation`, y SHALL responder con los datos públicos del usuario creado y un token de acceso ya válido, dentro de un objeto `data`.

#### Scenario: Registro correcto

- **WHEN** se envía un email válido no registrado, una contraseña de entre 8 y 32 caracteres, su confirmación idéntica y un `fullName` de texto
- **THEN** la respuesta es 200 con `data.user` (con `id`, `fullName`, `email`, `initials`, `createdAt`, `updatedAt`) y `data.token`, y ese token autentica peticiones posteriores

#### Scenario: Registro sin nombre

- **WHEN** se envía `fullName` con valor `null` y el resto de campos válidos
- **THEN** la cuenta se crea igualmente y `data.user.fullName` es `null`

### Requirement: Validación de los datos de registro

La API SHALL rechazar el registro con un 422 cuando algún campo no cumpla sus reglas, devolviendo `{ errors: [...] }` con una entrada por cada fallo, cada una con `message`, `rule`, `field` y, cuando aplique, `meta`; en ese caso SHALL NOT crear la cuenta.

#### Scenario: Falta la clave del nombre

- **WHEN** la petición no incluye la clave `fullName` (ni siquiera con `null`)
- **THEN** la respuesta es 422 con un error de regla `required` en el campo `fullName`

#### Scenario: Email con formato inválido

- **WHEN** `email` no es una dirección de email válida
- **THEN** la respuesta es 422 con un error de regla `email` en el campo `email`

#### Scenario: Email demasiado largo

- **WHEN** `email` supera los 254 caracteres
- **THEN** la respuesta es 422 con un error de regla `maxLength` en el campo `email`

#### Scenario: Email ya registrado

- **WHEN** `email` coincide exactamente con el de una cuenta existente
- **THEN** la respuesta es 422 con un error de regla `database.unique` en el campo `email`

#### Scenario: Contraseña fuera de longitud

- **WHEN** `password` tiene menos de 8 o más de 32 caracteres
- **THEN** la respuesta es 422 con un error de regla `minLength` (con `meta.min` = 8) o `maxLength` (con `meta.max` = 32) en el campo `password`, y la misma regla se aplica de forma independiente a `passwordConfirmation`

#### Scenario: Confirmación que no coincide

- **WHEN** `passwordConfirmation` tiene una longitud válida pero es distinta de `password`
- **THEN** la respuesta es 422 con un error de regla `sameAs` en el campo `passwordConfirmation`

#### Scenario: Varios campos inválidos a la vez

- **WHEN** varios campos incumplen sus reglas en la misma petición
- **THEN** la respuesta 422 incluye un error por cada campo que falla, no solo el primero

### Requirement: Inicio de sesión

La API SHALL permitir iniciar sesión con `POST /api/v1/auth/login` enviando `email` y `password`, y SHALL responder con los datos públicos del usuario y un token de acceso nuevo, dentro de un objeto `data`.

#### Scenario: Credenciales correctas

- **WHEN** se envían el email y la contraseña de una cuenta existente
- **THEN** la respuesta es 200 con `data.user` y un `data.token` nuevo, distinto de los emitidos antes para esa cuenta

#### Scenario: Varias sesiones simultáneas

- **WHEN** la misma cuenta inicia sesión más de una vez
- **THEN** cada token emitido sigue siendo válido de forma independiente hasta que se cierre su propia sesión

### Requirement: Rechazo de credenciales incorrectas

La API SHALL responder 400 con `{ errors: [{ message: "Invalid user credentials" }] }` cuando el email no pertenezca a ninguna cuenta o la contraseña no sea la suya, sin indicar cuál de los dos ha fallado; y SHALL responder 422 con errores por campo cuando el formato de la petición sea inválido.

#### Scenario: Email desconocido

- **WHEN** se intenta iniciar sesión con un email que no está registrado
- **THEN** la respuesta es 400 con el mensaje `Invalid user credentials` y sin campo `field`

#### Scenario: Contraseña incorrecta

- **WHEN** se intenta iniciar sesión con un email registrado y una contraseña errónea
- **THEN** la respuesta es 400 con el mismo mensaje que para un email desconocido

#### Scenario: Petición de login mal formada

- **WHEN** falta `email` o `password`, o `email` no tiene formato de email
- **THEN** la respuesta es 422 con un error por cada campo afectado

### Requirement: Autenticación de peticiones por token

La API SHALL tratar como autenticada una petición que lleve la cabecera `Authorization: Bearer <token>` con un token vigente, y SHALL responder 401 con `{ errors: [{ message: "Unauthorized access" }] }` a cualquier petición a un endpoint de cuenta que no lo lleve o lleve uno no válido.

#### Scenario: Sin token

- **WHEN** se llama a `GET /api/v1/account/profile` o `POST /api/v1/account/logout` sin cabecera `Authorization`
- **THEN** la respuesta es 401 con el mensaje `Unauthorized access`

#### Scenario: Token inválido o revocado

- **WHEN** se llama a un endpoint de cuenta con un token inventado o con uno cuya sesión ya se cerró
- **THEN** la respuesta es 401 con el mensaje `Unauthorized access`

#### Scenario: El token no caduca por tiempo

- **WHEN** se usa un token emitido hace tiempo y nunca revocado
- **THEN** la petición se sigue aceptando como autenticada

### Requirement: Consulta del perfil propio

La API SHALL devolver en `GET /api/v1/account/profile` los datos públicos de la persona dueña del token, dentro de un objeto `data`, y SHALL NOT incluir nunca la contraseña.

#### Scenario: Perfil con token válido

- **WHEN** se llama al endpoint con un token vigente
- **THEN** la respuesta es 200 con `data` conteniendo `id`, `fullName`, `email`, `initials`, `createdAt` y `updatedAt` de esa cuenta, y ningún campo de contraseña

#### Scenario: Iniciales a partir del nombre

- **WHEN** la cuenta tiene un `fullName` cuyas dos primeras palabras están separadas por un único espacio
- **THEN** `initials` es la primera letra de la primera palabra más la primera letra de la segunda, en mayúsculas

#### Scenario: Iniciales sin nombre

- **WHEN** la cuenta no tiene `fullName`
- **THEN** `initials` se calcula igual a partir del email, tomando como palabras la parte anterior y posterior a la `@` (por ejemplo, `ana@flowsync.dev` da `AF`)

#### Scenario: Iniciales con una sola palabra

- **WHEN** `fullName` tiene una sola palabra
- **THEN** `initials` son sus dos primeras letras en mayúsculas

### Requirement: Cierre de sesión en la API

La API SHALL revocar, en `POST /api/v1/account/logout`, únicamente el token con el que se hace la petición, y SHALL responder 200 con `{ message: "Logged out successfully" }` sin envoltorio `data`.

#### Scenario: Logout correcto

- **WHEN** se llama al endpoint con un token vigente
- **THEN** la respuesta es 200 con `{ "message": "Logged out successfully" }` y ese token deja de ser aceptado (las siguientes peticiones con él reciben 401)

#### Scenario: Otras sesiones no se ven afectadas

- **WHEN** la cuenta tenía otros tokens vigentes y se cierra la sesión de uno de ellos
- **THEN** los demás tokens siguen siendo válidos

### Requirement: Respuestas siempre en JSON

La API SHALL responder en JSON a todas las peticiones de autenticación, incluidos los errores, con independencia de la cabecera `Accept` que envíe el cliente.

#### Scenario: Cliente que no pide JSON

- **WHEN** se envía una petición de login o de perfil sin cabecera `Accept` o pidiendo HTML
- **THEN** la respuesta, sea de éxito o de error, tiene cuerpo JSON

### Requirement: Pantalla de registro

La aplicación web SHALL ofrecer en `/register` un formulario con los campos «Nombre completo (opcional)», «Email», «Contraseña» (con la pista «Entre 8 y 32 caracteres.») y «Repite la contraseña», un botón «Crear cuenta» y un enlace «Inicia sesión» que lleva a `/login`; al registrarse con éxito SHALL dejar a la persona con la sesión iniciada en su perfil.

#### Scenario: Registro correcto desde la web

- **WHEN** la persona rellena el formulario con datos válidos y pulsa «Crear cuenta»
- **THEN** aterriza en `/profile` con la sesión ya iniciada, sin pasar por el login

#### Scenario: Nombre en blanco

- **WHEN** la persona deja «Nombre completo» vacío o solo con espacios
- **THEN** la cuenta se crea sin nombre

#### Scenario: Contraseñas distintas

- **WHEN** «Contraseña» y «Repite la contraseña» no coinciden al pulsar «Crear cuenta»
- **THEN** bajo «Repite la contraseña» aparece «Las contraseñas no coinciden.» y no se envía nada al servidor

#### Scenario: Envío en curso

- **WHEN** la persona pulsa «Crear cuenta» y el servidor aún no ha respondido
- **THEN** el botón muestra «Creando cuenta…» y queda deshabilitado hasta la respuesta

### Requirement: Pantalla de inicio de sesión

La aplicación web SHALL ofrecer en `/login` un formulario con «Email» y «Contraseña», un botón «Entrar» y un enlace «Crea una» que lleva a `/register`; al iniciar sesión con éxito SHALL llevar a la persona a su perfil.

#### Scenario: Login correcto desde la web

- **WHEN** la persona introduce credenciales válidas y pulsa «Entrar»
- **THEN** aterriza en `/profile` con la sesión iniciada

#### Scenario: Credenciales incorrectas en la web

- **WHEN** la persona introduce un email o una contraseña que no son correctos
- **THEN** sobre el formulario aparece el aviso «El email o la contraseña no son correctos.» y sigue en `/login`

#### Scenario: Envío en curso

- **WHEN** la persona pulsa «Entrar» y el servidor aún no ha respondido
- **THEN** el botón muestra «Entrando…» y queda deshabilitado hasta la respuesta

### Requirement: Mensajes de error en castellano

La aplicación web SHALL mostrar los errores de los formularios de acceso en castellano: los de validación, bajo el campo al que se refieren; y los que no corresponden a ningún campo visible, en un aviso destacado sobre el formulario.

#### Scenario: Email ya registrado

- **WHEN** la persona intenta registrarse con un email que ya tiene cuenta
- **THEN** bajo «Email» aparece «Ese email ya está registrado. Inicia sesión en su lugar.»

#### Scenario: Email con formato inválido

- **WHEN** el servidor rechaza el email por formato
- **THEN** bajo «Email» aparece «Introduce una dirección de email válida.»

#### Scenario: Longitud de contraseña

- **WHEN** el servidor rechaza la contraseña por corta o por larga
- **THEN** bajo «Contraseña» aparece «la contraseña debe tener al menos 8 caracteres.» o «la contraseña no puede superar los 32 caracteres.», sustituyendo a la pista de longitud

#### Scenario: Campo obligatorio vacío

- **WHEN** el servidor indica que falta un campo obligatorio
- **THEN** bajo ese campo aparece «Falta rellenar» seguido del nombre del campo (por ejemplo, «Falta rellenar el email.»)

#### Scenario: Servidor inalcanzable

- **WHEN** la persona envía un formulario de acceso y el servidor no responde
- **THEN** aparece el aviso «No se pudo conectar con el servidor. Comprueba que el backend está arrancado.»

#### Scenario: Error inesperado del servidor

- **WHEN** el servidor responde con un error que no es de validación, de credenciales ni de autenticación
- **THEN** aparece el aviso «Algo ha ido mal en el servidor. Inténtalo de nuevo en un momento.»

#### Scenario: Nuevo intento

- **WHEN** la persona vuelve a enviar el formulario tras un error
- **THEN** los errores de campo y el aviso general del intento anterior desaparecen al iniciarse el nuevo envío

#### Scenario: Campos vacíos en el login

- **WHEN** la persona pulsa «Entrar» con «Email» o «Contraseña» vacíos
- **THEN** el formulario se envía igualmente y bajo cada campo vacío aparece «Falta rellenar el email.» o «Falta rellenar la contraseña.»

### Requirement: Pantalla de perfil

La aplicación web SHALL mostrar en `/profile` un círculo con las iniciales de la persona, su nombre completo (o «Sin nombre» si no tiene), su email, la fecha «Miembro desde» en formato largo en castellano y un botón «Cerrar sesión».

#### Scenario: Perfil con nombre

- **WHEN** una persona con nombre completo abre su perfil
- **THEN** ve sus iniciales, su nombre, su email y la fecha de alta, por ejemplo «Miembro desde 1 de octubre de 2026»

#### Scenario: Perfil sin nombre

- **WHEN** una persona registrada sin nombre abre su perfil
- **THEN** en el lugar del nombre ve «Sin nombre» y las iniciales derivadas de su email

### Requirement: Cierre de sesión en la web

La aplicación web SHALL cerrar la sesión al pulsar «Cerrar sesión» y llevar a la persona a `/login`, aunque el servidor no confirme el cierre.

#### Scenario: Logout desde el perfil

- **WHEN** la persona pulsa «Cerrar sesión»
- **THEN** termina en `/login` sin ningún aviso de error, y al recargar la página sigue sin sesión

#### Scenario: Logout sin conexión con el servidor

- **WHEN** la persona pulsa «Cerrar sesión» y el servidor no está disponible o rechaza la petición
- **THEN** la sesión se cierra igualmente en el navegador y termina en `/login` sin aviso de error

### Requirement: Persistencia de la sesión entre recargas

La aplicación web SHALL conservar la sesión al recargar la página o volver a abrirla en el mismo navegador, comprobando contra el servidor que sigue siendo válida antes de mostrar contenido; mientras lo comprueba SHALL mostrar un indicador de carga en lugar de cualquier pantalla.

#### Scenario: Recarga con sesión válida

- **WHEN** una persona con sesión iniciada recarga la página
- **THEN** ve brevemente un indicador de carga y después la pantalla en la que estaba, sin volver a pedirle credenciales

#### Scenario: Sesión que el servidor ya no reconoce

- **WHEN** se abre la aplicación con una sesión guardada que el servidor rechaza (por ejemplo, revocada desde otro sitio)
- **THEN** la persona acaba en `/login` con el aviso «Tu sesión ha caducado. Vuelve a iniciar sesión.» y la sesión guardada se descarta

#### Scenario: Servidor caído al restaurar la sesión

- **WHEN** se abre la aplicación con una sesión guardada y el servidor no responde
- **THEN** la persona acaba en `/login` con el aviso «No se pudo conectar con el servidor. Comprueba que el backend está arrancado.», y la sesión guardada se conserva, de modo que al recargar con el servidor ya disponible vuelve a entrar sin credenciales

#### Scenario: Error del servidor al restaurar la sesión

- **WHEN** se abre la aplicación con una sesión guardada y el servidor responde con un error que no es de autenticación
- **THEN** la persona acaba en `/login` con el aviso «Algo ha ido mal en el servidor. Inténtalo de nuevo en un momento.» y la sesión guardada se conserva; solo un rechazo de autenticación la descarta

#### Scenario: El aviso de sesión perdida persiste hasta entrar

- **WHEN** en `/login` se muestra el aviso de sesión perdida y la persona intenta entrar
- **THEN** el aviso sigue visible mientras se envía el formulario; si el intento falla, lo sustituye el error de ese intento («El email o la contraseña no son correctos.»), y solo desaparece del todo al iniciar sesión con éxito

### Requirement: Protección de rutas

La aplicación web SHALL permitir el acceso a `/profile` solo con sesión iniciada, SHALL impedir el acceso a `/login` y `/register` con sesión iniciada, y SHALL redirigir cualquier otra dirección a `/profile`.

#### Scenario: Pantalla privada sin sesión

- **WHEN** una persona sin sesión abre `/profile`
- **THEN** es redirigida a `/login`

#### Scenario: Pantallas públicas con sesión

- **WHEN** una persona con sesión iniciada abre `/login` o `/register`
- **THEN** es redirigida a `/profile`

#### Scenario: Dirección desconocida

- **WHEN** se abre `/` o cualquier dirección que no sea `/login`, `/register` ni `/profile`
- **THEN** se redirige a `/profile`, y de ahí a `/login` si no hay sesión

#### Scenario: Las redirecciones no ensucian el historial

- **WHEN** una redirección de protección lleva a la persona de una pantalla a otra
- **THEN** el botón «atrás» del navegador no vuelve a la dirección de la que fue redirigida
