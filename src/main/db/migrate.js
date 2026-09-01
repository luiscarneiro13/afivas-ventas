import { runSeeds } from './seeds/index.js'

export async function migrateAndSeed(knex) {
  await knex.migrate.latest()
  await runSeeds(knex)
}
