# Prompts

## Prompt 1

**Modelo:** Sonnet 5.5
**Herramienta:** Claude Code

```
resume los ultimos commits
```

**Qué salió:** Funcionó, resumen de los 4 últimos commits.

## Prompt 2

**Modelo:** Sonnet 5.5
**Herramienta:** Claude Code

```
crea esta rama auditoria-jvm
```

**Qué salió:** Funcionó, rama creada desde `s5/start`.

## Prompt 3

**Modelo:** Sonnet 5.5
**Herramienta:** Claude Code

```
crea este archivo  docs/auditoria/jvm.md
```

**Qué salió:** Funcionó, archivo creado solo con título.

## Prompt 4

**Modelo:** Sonnet 5.5
**Herramienta:** Claude Code

```
agrega este archivo prompts.md
```

**Qué salió:** Funcionó, creado en la raíz solo con título.

## Prompt 5

**Modelo:** Sonnet 5.5
**Herramienta:** Claude Code

```
Contexto:
Actua como un auditor de reglas del proceso que se encuentran en el archivo CLAUDE.md.La meta es encontrar si esas reglas si se han venido cumpliendo o no. 

Tarea:
Contrasta las reglas definidas en el archivo @CLAUDE.md debajo de la sección "Reglas de proceso" con los últimos 15 commits del repositorio y el estado actual de los archivos del proyecto. Guarda el resultado en docs/auditoria/jvm.md

Criterios de exito:
Usa una fila por regla y completa estas cinco columnas:

1. Qué pide la regla. Resúmela en una frase y con tus propias palabras. Si necesitas varias frases, puede que estés mezclando más de una regla.
2. Qué se revisó para comprobarla. Indica el comando ejecutado o el archivo consultado. Sin esta información no hay forma de saber en qué se apoya el veredicto.
3. Veredicto. Solo puede ser se cumple, no se cumple o no se puede comprobar con la información disponible.
4. Evidencia. Escríbela en una línea. Si la regla no se cumple, indica dónde se incumple. Si no se puede comprobar, explica qué información falta.
5. Qué harías con ella. Elige una opción: dejarla, borrarla o convertirla en una comprobación automática

Restricciones:
Esto es una auditoría. No puedes modificar ningún archivo

Clarificacion:
Si no tienes algo claro, pregunta. No asumas nada.
```

**Qué salió:** Funcionó, tabla de 7 reglas; luego hubo correcciones.

## Prompt 6

**Modelo:** Sonnet 5.5
**Herramienta:** Claude Code

```
Porque dejar la regla #1 si es algo que no se puede comprobar? tendria sentiro mejor dejar esa regla en un hook? eso se podria ?
```

**Qué salió:** Admitió la incoherencia y propuso un hook.

## Prompt 7

**Modelo:** Sonnet 5.5
**Herramienta:** Claude Code

```
En la evidencia de la regla #2 sugieres que los commits se hicieron en una rama sN/* ?
```

**Qué salió:** Admitió que la evidencia era engañosa.

## Prompt 8

**Modelo:** Sonnet 5.5
**Herramienta:** Claude Code

```
Si, reescribir para evitar malos entendidos
```

**Qué salió:** Funcionó, reescribió las filas 1 y 2.

## Prompt 9

**Modelo:** Sonnet 5.5
**Herramienta:** Claude Code

```
la regal #3 tambien se puede dejar en un hook ?
```

**Qué salió:** Respuesta explicada, sin cambios en el archivo.

## Prompt 10

**Modelo:** Sonnet 5.5
**Herramienta:** Claude Code

```
No. Dejemosla como  "Dejarla"
```

**Qué salió:** Funcionó, fila 3 sin cambios.

## Prompt 11

**Modelo:** Sonnet 5.5
**Herramienta:** Claude Code

```
No me queda clara la evidencia de la regla #5
```

**Qué salió:** Reconoció evidencia mal sustentada y la verificó.

## Prompt 12

**Modelo:** Sonnet 5.5
**Herramienta:** Claude Code

```
no entiendo que tiene que ver que ningun PR tiene ese origen con verificar si los PRs se abrieron con el comando pr create y que tienen description completa
```

**Qué salió:** Dio la razón y revisó los PRs #94 y #95.

## Prompt 13

**Modelo:** Sonnet 5.5
**Herramienta:** Claude Code

```
Si, reescribir. Tambien indicar que se haria con ella es Borrarla
```

**Qué salió:** Funcionó, fila 5 reescrita y marcada «Borrarla».