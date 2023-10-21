import fastify from 'fastify'
import { knex } from './database'
import { randomUUID } from 'node:crypto'
import { env } from './env'

const app = fastify()

app.get('/hello', async (req, res) => {
  const addtransaction = await knex('transactions')
    .insert({
      id: randomUUID(),
      title: 'test transation',
      amount: 1000,
    })
    .returning('*')
  const showtransaction = await knex('transactions')
    .where('amount', 1000)
    .select('*')

  return showtransaction
})

app
  .listen({
    port: env.PORT,
  })
  .then(() => {
    console.log('HTTP server running!')
  })
