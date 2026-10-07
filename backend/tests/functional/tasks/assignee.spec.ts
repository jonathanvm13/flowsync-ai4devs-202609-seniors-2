import User from '#models/user'
import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

/**
 * Lo que cada tarea muestra de su responsable. Cubre los tres scenarios del
 * requisito homónimo de `openspec/specs/tasks/spec.md`: responsable
 * identificable, la tarea no filtra datos de cuenta, y responsable sin nombre.
 *
 * El aislamiento es una transacción global y no un truncate a propósito: la
 * suite functional pega contra el mismo fichero SQLite que el servidor de
 * desarrollo (`config/database.ts` no tiene override por entorno), y vaciarlo
 * se llevaría por delante los datos con los que se está trabajando.
 */
test.group('Tasks | responsable', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function sesion(client: any, fullName: string | null, email: string) {
    await User.create({ fullName, email, password: 'secreto123' })

    const response = await client.post('/api/v1/auth/login').json({ email, password: 'secreto123' })

    return response.body().data.token as string
  }

  async function crearTarea(client: any, token: string) {
    const response = await client
      .post('/api/v1/tasks')
      .header('Authorization', `Bearer ${token}`)
      .json({ title: 'Revisar el informe' })

    response.assertStatus(201)
    return response.body().data.id as number
  }

  async function tareaSuelta(client: any, token: string, id: number) {
    return client
      .get(`/api/v1/tasks/${id}`)
      .qs({ today: '2026-10-06' })
      .header('Authorization', `Bearer ${token}`)
  }

  async function lista(client: any, token: string) {
    return client.get('/api/v1/tasks').header('Authorization', `Bearer ${token}`)
  }

  test('un responsable llamado Ada Lovelace se identifica por su nombre y sus iniciales', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client, 'Ada Lovelace', 'ada@example.com')
    const id = await crearTarea(client, token)

    const suelta = await tareaSuelta(client, token, id)
    suelta.assertStatus(200)

    const assignee = suelta.body().data.assignee
    assert.equal(assignee.fullName, 'Ada Lovelace')
    assert.equal(assignee.initials, 'AL')
  })

  test('el responsable, suelto o en la lista, no trae el email ni otros datos de acceso', async ({
    client,
    assert,
  }) => {
    const email = 'ada@example.com'
    const token = await sesion(client, 'Ada Lovelace', email)
    const id = await crearTarea(client, token)

    const suelta = await tareaSuelta(client, token, id)
    const listado = await lista(client, token)

    suelta.assertStatus(200)
    listado.assertStatus(200)

    const tareas = listado.body().data
    assert.isArray(tareas)

    const enLista = tareas.find((tarea: { id: number }) => tarea.id === id)
    assert.exists(enLista)

    const assignees = [
      suelta.body().data.assignee,
      ...tareas.map((tarea: { assignee: unknown }) => tarea.assignee),
    ]

    for (const assignee of assignees) {
      assert.isObject(assignee)
      assert.notProperty(assignee, 'email')
      assert.notProperty(assignee, 'password')

      const serialized = JSON.stringify(assignee)
      assert.notInclude(serialized, email)
      assert.notInclude(serialized, 'secreto123')
      assert.notInclude(serialized, 'password')
    }
  })

  test('un responsable sin nombre llega con el nombre nulo y con iniciales', async ({
    client,
    assert,
  }) => {
    const token = await sesion(client, null, 'ada@example.com')
    const id = await crearTarea(client, token)

    const suelta = await tareaSuelta(client, token, id)
    suelta.assertStatus(200)

    const assignee = suelta.body().data.assignee
    assert.isNull(assignee.fullName)
    // Sin nombre, las iniciales salen del email: ada@example.com → AE.
    assert.equal(assignee.initials, 'AE')
  })
})
