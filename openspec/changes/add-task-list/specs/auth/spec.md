# Spec Delta

## MODIFIED Requirements

### Requirement: Pantalla de registro

La aplicación web SHALL ofrecer en `/register` un formulario con los campos «Nombre completo (opcional)», «Email», «Contraseña» (con la pista «Entre 8 y 32 caracteres.») y «Repite la contraseña», un botón «Crear cuenta» y un enlace «Inicia sesión» que lleva a `/login`. Al registrarse con éxito, SHALL dejar a la persona con la sesión iniciada en la lista de tareas.

#### Scenario: Registro correcto desde la web

- **WHEN** la persona rellena el formulario con datos válidos y pulsa «Crear cuenta»
- **THEN** aterriza en `/tasks` con la sesión ya iniciada, sin pasar por el login

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

La aplicación web SHALL ofrecer en `/login` un formulario con «Email» y «Contraseña», un botón «Entrar» y un enlace «Crea una» que lleva a `/register`. Al iniciar sesión con éxito, SHALL llevar a la persona a la lista de tareas.

#### Scenario: Login correcto desde la web

- **WHEN** la persona introduce credenciales válidas y pulsa «Entrar»
- **THEN** aterriza en `/tasks` con la sesión iniciada

#### Scenario: Credenciales incorrectas en la web

- **WHEN** la persona introduce un email o una contraseña que no son correctos
- **THEN** sobre el formulario aparece el aviso «El email o la contraseña no son correctos.» y sigue en `/login`

#### Scenario: Envío en curso

- **WHEN** la persona pulsa «Entrar» y el servidor aún no ha respondido
- **THEN** el botón muestra «Entrando…» y queda deshabilitado hasta la respuesta

### Requirement: Pantalla de perfil

La aplicación web SHALL mostrar en `/profile`:

- un círculo con las iniciales de la persona;
- su nombre completo, o «Sin nombre» si no tiene;
- su email;
- la fecha «Miembro desde», en formato largo y en castellano;
- un botón «Cerrar sesión»;
- un enlace que lleva a la lista de tareas.

#### Scenario: Perfil con nombre

- **WHEN** una persona con nombre completo abre su perfil
- **THEN** ve sus iniciales, su nombre, su email y la fecha de alta, por ejemplo «Miembro desde 1 de octubre de 2026»

#### Scenario: Perfil sin nombre

- **WHEN** una persona registrada sin nombre abre su perfil
- **THEN** en el lugar del nombre ve «Sin nombre» y las iniciales derivadas de su email

#### Scenario: Volver a la lista

- **WHEN** la persona pulsa el enlace a la lista de tareas desde su perfil
- **THEN** llega a `/tasks`

### Requirement: Protección de rutas

La aplicación web SHALL permitir el acceso a `/tasks` y `/profile` solo con sesión iniciada. SHALL impedir el acceso a `/login` y `/register` con sesión iniciada, y SHALL redirigir cualquier otra dirección a `/tasks`. Desde `/tasks` SHALL haber un enlace al perfil.

#### Scenario: Pantalla privada sin sesión

- **WHEN** una persona sin sesión abre `/tasks` o `/profile`
- **THEN** es redirigida a `/login`

#### Scenario: Pantallas públicas con sesión

- **WHEN** una persona con sesión iniciada abre `/login` o `/register`
- **THEN** es redirigida a `/tasks`

#### Scenario: Dirección desconocida

- **WHEN** se abre `/` o cualquier dirección que no sea `/login`, `/register`, `/tasks` ni `/profile`
- **THEN** se redirige a `/tasks`, y de ahí a `/login` si no hay sesión

#### Scenario: Ir al perfil desde la lista

- **WHEN** una persona con sesión pulsa el enlace al perfil desde `/tasks`
- **THEN** llega a `/profile`

#### Scenario: Las redirecciones no ensucian el historial

- **WHEN** una redirección de protección lleva a la persona de una pantalla a otra
- **THEN** el botón «atrás» del navegador no vuelve a la dirección de la que fue redirigida
