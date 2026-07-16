import schemaSql from '../../schema.sql'

export async function initializeSchema(db: D1Database): Promise<void> {
  await db.exec(schemaSql)
}
