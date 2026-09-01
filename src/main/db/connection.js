import { app } from 'electron'
import { join } from 'path'
import { mkdirSync } from 'fs'
import knexFactory from 'knex'
import { buildKnexConfig } from './knexfile.js'

let knexInstance = null

export function getDb() {
  if (knexInstance) return knexInstance

  const dbDir = join(app.getPath('userData'), 'database')
  mkdirSync(dbDir, { recursive: true })
  const dbPath = join(dbDir, 'afivas.sqlite3')

  knexInstance = knexFactory(buildKnexConfig(dbPath))
  return knexInstance
}
