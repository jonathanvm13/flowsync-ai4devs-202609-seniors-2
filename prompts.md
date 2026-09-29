

## Prompt 1

**Modelo:** Claude Opus 5.5
**Herramienta:** Claude Code

```
 Estoy usando Spec Driven Development. Tu tarea es escribir la spec de un código que ya está escrito y ya funciona de este proyecto. No propones nada, no cambias una línea: lees lo que hay y escribes lo que hace hoy. déjala en este archivo @docs/spec-viva/jv.md, no en el chat.

  Sobre qué se hace: sobre el vertical de cuentas y acceso del proyecto (registro, inicio de sesión, sesión y perfil), que es lo que ya está construido de punta a punta. Entero, en sus dos capas (Frontend & Backend). Lo que pasa por la API y lo que se ve en pantalla, y nada que no sea cuentas y acceso.

  Sigue el siguiente formato:

  Arriba, un ## Purpose de una o dos frases: para qué existe esta capability.

  Debajo, ## Requirements, y colgando de él ### Requirement: en los que el sistema SHALL hacer algo.

  Bajo cada requisito, al menos un #### Scenario: de cuatro almohadillas, con dos viñetas: WHEN y THEN. No hay casilla para el GIVEN: la precondición se mete dentro del WHEN.

  En castellano, salvo las mayúsculas de la RFC.

  Y tres reglas duras:

  1. Nada de ADDED, MODIFIED ni REMOVED. Eso es el vocabulario de un delta, y esto no es un delta: es la verdad actual del sistema. Si tu archivo tiene una de esas secciones, has escrito otra cosa.
  2. Solo comportamiento observable desde fuera. Ni un nombre de clase, ni un nombre de archivo, ni una ruta de código. En la API, observable es la petición y la respuesta. En la pantalla, observable es lo que una persona ve y puede hacer.
  3. No toques el código. Ni siquiera para arreglar lo que encuentres.
```

**Qué salió:** Leyó el código y escribiô el espec y lanzó un sub-agente para revisarlo



## Prompt 2

**Modelo:** Claude Opus 5.5
**Herramienta:** Claude Code

```
 How many requirements this spec has ?
```

**Qué salió:** Me arrojó el número y la cantidad de scenarios




## Prompt 3

**Modelo:** Claude Opus 5.5
**Herramienta:** Claude Code

```
 Vamos requirement por requirement, debes demostrar en que parte del codigo se hace eso. Comencemos: Requirement: Formato común de las respuestas de la API de cuentas
```

**Qué salió:** Analizó el primer requirement y lo defendió , compartiendo el código. Encontró una mejora y propuso un cambio


## Prompt 4

**Modelo:** Claude Opus 5.5
**Herramienta:** Claude Code

```
 No apliques ningun cambo
```

**Qué salió:** Efectivamente dejó de proponer cambios de código


## Prompt 5

**Modelo:** Claude Opus 5.5
**Herramienta:** Claude Code

```
 No apliques ningun cambo
```

**Qué salió:** Efectivamente dejó de proponer cambios de código y continuó automáticamente con el siguiente requisito


## Prompt 6

**Modelo:** Claude Opus 5.5
**Herramienta:** Claude Code

```
 Si, siguiente
```

**Qué salió:** Me preguntó previamente si seguíamos para demostrar el siguiente requisito y así lo hizo.


## Prompt 7

**Modelo:** Claude Opus 5.5
**Herramienta:** Claude Code

```
 dame esta ruta exacta donde se encuentra este codigo " Con null: el validador declara fullName: vine.string().nullable() y la columna es .nullable() (create_users_table.ts:9)."
```

**Qué salió:** Me muestra la ruta del archivo y el número de la línea exacta


## Prompt 8

**Modelo:** Claude Opus 5.5
**Herramienta:** Claude Code

```
 sigamos
```

**Qué salió:** Demostró el siguiente requisito


## Prompt 9

**Modelo:** Claude Opus 5.5
**Herramienta:** Claude Code

```
 esto donde esta ? la linea 63 ? debes agregar las rutas donde se encuetra siempre el codigo para yo poderlo verificar "- node_modules/@adonisjs/lucid/build/src/bindings/vinejs.js:15 define el texto 'The {{ field }} has already been taken', y la línea 63 lo emite con la regla database.unique."
```

**Qué salió:** Me mostró el código exacto



## Prompt 10

**Modelo:** Claude Opus 5.5
**Herramienta:** Claude Code

```
 Siguiente
```

**Qué salió:** Demostró el siguiente requisito


## Prompt 11

**Modelo:** Claude Opus 5.5
**Herramienta:** Claude Code

```
 Siguiente
```

**Qué salió:** Demostró el siguiente requisito




## Prompt 11

**Modelo:** Claude Opus 5.5
**Herramienta:** Claude Code

```
 Siguiente
```

**Qué salió:** Demostró el siguiente requisito






