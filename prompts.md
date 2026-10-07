## Prompt 1

**Modelo:** Grok 4.7
**Herramienta:** Cursor

```
 CONTEXTO/ROLE 
Actua como un revisor adversarial que detecta scenarios que no tiene tests existentes

OBJETIVO
Lee los scenarios de la spec viva de esta requisito "Lo que cada tarea muestra de su responsable" y los tests existentes.
Genera una tabla de trazabilidad: cada criterio de aceptación → qué prueba lo cubre → cubierto / NO cubierto.


CRITERIOS DE ÉXITO EXPLÍCITOS
- Ha una matriz en la ruta /docs/verificacion/jvm.md que mapea, scenario a scenario, si el requisito está cubierto por los tests
- Solo se verifica el requisito  "Lo que cada tarea muestra de su responsable"
- Cada fila de la matrix debe tener 4 columnas que contienen lo siguiente:
1. El scenario, en una línea. Qué se espera y en qué situación. Si no cabe en una línea, es que estás juntando dos.
2. Qué test lo cubre, con el nombre exacto que aparece en la suite. Sin el nombre concreto, la columna debe ir vacía.
3. Cubierto · No cubierto · No lo sé
4. Si pusiste "no lo sé", qué te faltó para decidirlo.  Suele ser una de dos: no encontraste dónde se comprueba, o encontraste algo que se le parece y no dice exactamente lo mismo.
- Encima de la matriz dos números: cuántos scenarios tiene el requisito y cuántos resultaron cubiertos — el primero se anota al empezar, el segundo al terminar.

Restricciones:
- No cambies nada.
- No verificas otros requisitos diferente a "Lo que cada tarea muestra de su responsable"

CLARIFICACIÓN
- El nombre de un test no es prueba de cobertura. Un test puede llamarse igual que el scenario y comprobar otra cosa, o solo la mitad. Para marcar cubierto hay que abrir el test y leer lo que afirma
```

**Qué salió:** Leyó el código, los specs, y generó la matriz de trazabilidad


## Prompt 2

**Modelo:** Grok 4.7
**Herramienta:** Cursor

```
Has verificado  las pruebas tanto del backend como del frontend para confirmar que ningún escenario está cubierto ?
```

**Qué salió:** Revisó y confirmó que el frontend no tenía ficheros de tests y que el backend solo contiene tests de auth.


## Prompt 3

**Modelo:** Grok 4.7
**Herramienta:** Cursor

```
CONTEXTO/ROLE 
Actual como  un experto en implementar test para cubrir escenarios de pruebas que se no encuentran cubiertos

OBJETIVO
Lee la matríz de trazabilidad creada en el documento docs/verificacion/jvm.md la cual mape escenario a escenario y si se ecuentra cubierto por los tests existentes o no.
Implementa los tests donde en la tercera columna se definen como  "No cubiertos"


CRITERIOS DE ÉXITO 
- Cada fila de la matriz de trazabilidad que se encuentra en "No cubierto" tiene un test implementando 
- Se siguen el estilo de los tets que ya existen en el proyecto
- Una vez implementandos se deben ejecutar y mostrar los resultados en pantalla.


Restricciones:
- No se  toca nada fuera de la carpeta de tests
- Pase lo que pase, no arregles el código ni ajustes el test para que pase. Si algo se pone en rojo, se queda en rojo y se entrega en rojo: el objetivo es saber qué está mal, no ocultarlo.

```

**Qué salió:** Generó las pruebas y las ejecutó y reportó que una estaba fallando


## Prompt 4

**Modelo:** Grok 4.7
**Herramienta:** Cursor

```
Dame un ejemplo de lo que retorna el endpoint
```

**Qué salió:** Se pidió que diera un ejemplo de lo que retornaba el endpoint de la prueba que estaba fallando y se compartieron los ejemplos correctamente


## Prompt 5

**Modelo:** Grok 4.7
**Herramienta:** Cursor

```
En este test "Responsable sin nombre" que se retorna en las iniciales? si el nombre es nulo, las iniciales son nulas? que se espera basado en el escenario escrito ?
```

**Qué salió:** Se  confirmó que se espera que las iniciales siguen llegando así el nombre es nulo

## Prompt 6

**Modelo:** Grok 4.7
**Herramienta:** Cursor

```
Verifica en los specs si existe la posibilidad que las iniciales sean nulas también ? o si se define como un posible escenario?
```

**Qué salió:** Se aclaró en los specs que las iniciales no pueden ser nulas