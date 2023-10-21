import { randomUUID } from 'crypto'
import { knex } from '../database'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function transactionsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req) => {
    console.log(`[${req.method}, ${req.url}]`)
  })

  app.get('/', {
    preHandler: checkSessionIdExists,
  }, async (req, reply) => {
    const { sessionId } = req.cookies

    await knex('transactions').where('session_id', sessionId).select('*')
      .then((transactions) => reply.status(200).send(JSON.stringify({
        transactions
      })))
      .catch((error) => reply.status(400).send(error))
  })

  app.get('/:id', {
    preHandler: checkSessionIdExists,
  }, async (req) => {
    const { sessionId } = req.cookies
    const getTransactionsParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getTransactionsParamsSchema.parse(req.params)

    const transaction = await knex('transactions').where({
      session_id: sessionId,
      id,
    }).first()

    return { transaction }
  })

  app.get('/summary', {
    preHandler: checkSessionIdExists,
  }, async (req) => {
    const { sessionId } = req.cookies
    const summary = await knex('transactions').where('session_id', sessionId).sum('amount', { as: 'amount' }).first()

    return { summary }
  })

  app.post('/', async (req, reply) => {
    const createTransactionsBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit']),
    })

    const { title, amount, type } = createTransactionsBodySchema.parse(req.body)

    let sessionId = req.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * 1,
      session_id: sessionId,
    })
      .then(() => reply.status(201).send())
      .catch((error) => reply.status(404).send(error))
  })
}
