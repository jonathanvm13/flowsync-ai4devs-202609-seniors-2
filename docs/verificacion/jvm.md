Scenarios: 3
Cubiertos: 0


| Scenario                                                                                                                                                                    | Test | Veredicto   | Qué faltó |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ----------- | --------- |
| Responsable identificable: al obtener una tarea cuyo responsable se llama «Ada Lovelace», su assignee trae ese nombre y sus iniciales, bastantes para saber quién la lleva. |      | No cubierto |           |
| La tarea no filtra datos de cuenta: al obtener cualquier tarea, suelta o en la lista, su assignee no incluye el email ni ningún otro dato de acceso.                        |      | No cubierto |           |
| Responsable sin nombre: si el responsable se registró sin nombre, el nombre llega nulo y las iniciales siguen llegando, para representarlo sin su email.                    |      | No cubierto |           |


1. Cuántos scenarios creías cubiertos antes de mirar, y cuántos lo estaban: Pensé que al menos 1 o dos estaban cubiertos. Ninguno lo estaba.
2. **El scenario en el que no supiste si faltaba un test o faltaba la regla en la spec: Como ningún escenario  del requisito validado tenía test entonces no se generó este tipo de dudas.**
3. Algo que el scenario no determinaba y tuviste que decidir al escribir el test:  Determinar si es válido que retornara al ID del responsable. El código ya lo retornaba entonces no era claro si debía validarse o no en el test.

