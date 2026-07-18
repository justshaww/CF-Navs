// 分类 CRUD 与批量排序

import { type Category, type CategoryUpsertReq } from '../../../shared/types'
import { flattenCategoryTree, getCategoryDescendantIds } from '../../../shared/categoryTree'
import { CATEGORY_LIST_SQL } from './sql'
import { withSchemaRetry } from './schema'
import { sortRowsByIds } from './sort'

export async function listCategories(db: D1Database): Promise<Category[]> {
  return await withSchemaRetry(db, async () => {
    const { results } = await db.prepare(CATEGORY_LIST_SQL).all<Category>()
    return results ?? []
  })
}

export async function getCategory(db: D1Database, id: number): Promise<Category | null> {
  return await withSchemaRetry(db, () => db
    .prepare('SELECT id, title, icon, parent_id, sort, created_at FROM categories WHERE id = ?')
    .bind(id)
    .first<Category>())
}

export async function createCategory(db: D1Database, req: CategoryUpsertReq): Promise<Category> {
  const now = Date.now()
  const parentId = req.parent_id ?? null
  const category = await withSchemaRetry(db, () => db
    .prepare(
      `INSERT INTO categories (title, icon, parent_id, sort, created_at)
       SELECT ?, ?, ?, COALESCE(MAX(sort), -1) + 1, ? FROM categories WHERE parent_id IS ?
       RETURNING id, title, icon, parent_id, sort, created_at`,
    )
    .bind(req.title, req.icon ?? null, parentId, now, parentId)
    .first<Category>())

  if (!category) {
    throw new Error('failed to create category')
  }

  return category
}

export async function updateCategory(
  db: D1Database,
  id: number,
  req: CategoryUpsertReq,
): Promise<Category | null> {
  const current = await getCategory(db, id)
  if (!current) return null
  const parentId = req.parent_id ?? null

  if ((current.parent_id ?? null) === parentId) {
    return await db
      .prepare('UPDATE categories SET title = ?, icon = ? WHERE id = ? RETURNING id, title, icon, parent_id, sort, created_at')
      .bind(req.title, req.icon ?? null, id)
      .first<Category>()
  }

  return await db
    .prepare(
      `UPDATE categories SET title = ?, icon = ?, parent_id = ?, sort = (
         SELECT COALESCE(MAX(sort), -1) + 1 FROM categories WHERE parent_id IS ? AND id != ?
       ) WHERE id = ? RETURNING id, title, icon, parent_id, sort, created_at`,
    )
    .bind(req.title, req.icon ?? null, parentId, parentId, id, id)
    .first<Category>()
}

function expandCategoryIds(categories: Category[], ids: number[]): { ids: number[]; depthById: Map<number, number> } {
  const expanded = new Set(ids)
  for (const id of ids) {
    for (const descendantId of getCategoryDescendantIds(categories, id)) expanded.add(descendantId)
  }
  const depthById = new Map(flattenCategoryTree(categories).map((entry) => [entry.category.id, entry.depth]))
  return {
    ids: [...expanded].sort((a, b) => (depthById.get(b) ?? 0) - (depthById.get(a) ?? 0)),
    depthById,
  }
}

function deleteStatementsByIds(
  db: D1Database,
  table: 'bookmarks' | 'categories',
  column: 'category_id' | 'id',
  ids: number[],
): D1PreparedStatement[] {
  const statements: D1PreparedStatement[] = []
  for (let index = 0; index < ids.length; index += 90) {
    const chunk = ids.slice(index, index + 90)
    statements.push(db
      .prepare(`DELETE FROM ${table} WHERE ${column} IN (${chunk.map(() => '?').join(', ')})`)
      .bind(...chunk))
  }
  return statements
}

export async function deleteCategory(db: D1Database, id: number): Promise<boolean> {
  const result = await batchDeleteCategories(db, [id])
  return result.deleted > 0
}

export async function batchDeleteCategories(db: D1Database, ids: number[]): Promise<{ deleted: number; deleted_bookmarks: number }> {
  if (ids.length === 0) return { deleted: 0, deleted_bookmarks: 0 }
  const expanded = expandCategoryIds(await listCategories(db), ids)
  const bookmarkStatements = deleteStatementsByIds(db, 'bookmarks', 'category_id', expanded.ids)
  const idsByDepth = new Map<number, number[]>()
  for (const id of expanded.ids) {
    const depth = expanded.depthById.get(id) ?? 0
    idsByDepth.set(depth, [...(idsByDepth.get(depth) ?? []), id])
  }
  const categoryStatements = [...idsByDepth.entries()]
    .sort(([a], [b]) => b - a)
    .flatMap(([, categoryIds]) => deleteStatementsByIds(db, 'categories', 'id', categoryIds))
  const statements = [...bookmarkStatements, ...categoryStatements]
  const results = await db.batch(statements)
  const bookmarkResults = results.slice(0, bookmarkStatements.length)
  const categoryResults = results.slice(bookmarkStatements.length)
  const deleted_bookmarks = bookmarkResults.reduce((sum, result) => sum + (result.meta.changes ?? 0), 0)
  const deleted = categoryResults.reduce((sum, result) => sum + (result.meta.changes ?? 0), 0)
  return { deleted, deleted_bookmarks }
}

// 批量排序：按 ids 下标写 sort，单次 batch 提交
export async function sortCategories(db: D1Database, ids: number[]): Promise<void> {
  await sortRowsByIds(db, 'categories', ids)
}
