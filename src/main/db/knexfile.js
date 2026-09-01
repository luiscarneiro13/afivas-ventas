import { migrationSource } from './migrations/index.js'

export function buildKnexConfig(dbPath) {
  return {
    client: 'better-sqlite3',
    connection: { filename: dbPath },
    useNullAsDefault: true,
    migrations: { migrationSource },
    pool: {
      afterCreate: (conn, done) => {
        conn.pragma('foreign_keys = ON')
        done(null, conn)
      }
    }
  }
}
