// 书签 CRUD、批量排序、图标数据读取与 icon_blob 写入

import { type Bookmark, type BookmarkUpsertReq } from '../../../shared/types'
import { BOOKMARK_LIST_SQL } from './sql'
import { withSchemaRetry } from './schema'
import { sortRowsByIds } from './sort'

export async function listBookmarks(db: D1Database): Promise<Bookmark[]> {
  return await withSchemaRetry(db, async () => {
    const { results } = await db
      .prepare(BOOKMARK_LIST_SQL)
      .all<Bookmark>()
    return results ?? []
  })
}

export interface BookmarkIconData {
  title: string
  url: string
  icon: string | null
  icon_source: Bookmark['icon_source']
  icon_blob: string | null
}

export async function getBookmarkIconData(db: D1Database, id: number): Promise<BookmarkIconData | null> {
  return await withSchemaRetry(db, async () => (
    await db
      .prepare('SELECT title, url, icon, icon_source, icon_blob FROM bookmarks WHERE id = ?')
      .bind(id)
      .first<BookmarkIconData>()
  ))
}

export async function createBookmark(db: D1Database, req: BookmarkUpsertReq): Promise<Bookmark | null> {
  const now = Date.now()
  const open_method: 1 | 2 | 3 = req.open_method === 2 ? 2 : req.open_method === 3 ? 3 : 1
  const parentId = req.parent_id ?? null
  return await withSchemaRetry(db, async () => (
    await db
      .prepare(
        `INSERT INTO bookmarks (
           category_id, parent_id, title, url, icon, icon_source, icon_background_color,
           description, description_mode, open_method, sort, created_at
         )
         SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
           COALESCE((SELECT MAX(sort) FROM bookmarks WHERE category_id = ? AND parent_id IS ?), -1) + 1, ?
         WHERE EXISTS (SELECT 1 FROM categories WHERE id = ?)
           AND (? IS NULL OR EXISTS (
             SELECT 1 FROM bookmarks parent WHERE parent.id = ? AND parent.category_id = ?
           ))
         RETURNING id, category_id, parent_id, title, url, icon, icon_source, icon_background_color, icon_blob, description, description_mode, open_method, sort, created_at`,
      )
      .bind(
        req.category_id,
        parentId,
        req.title,
        req.url,
        req.icon ?? null,
        req.icon_source ?? null,
        req.icon_background_color ?? null,
        req.description ?? null,
        req.description_mode ?? null,
        open_method,
        req.category_id,
        parentId,
        now,
        req.category_id,
        parentId,
        parentId,
        req.category_id,
      )
      .first<Bookmark>()
  ))
}

export async function updateBookmark(
  db: D1Database,
  id: number,
  req: BookmarkUpsertReq,
): Promise<Bookmark | null> {
  const nextIcon = req.icon ?? null
  const nextIconSource = req.icon_source ?? null
  const openMethod: 1 | 2 | 3 | null =
    req.open_method === 2 ? 2 : req.open_method === 3 ? 3 : req.open_method === 1 ? 1 : null
  const hasDescriptionMode = Object.prototype.hasOwnProperty.call(req, 'description_mode')
  const hasParentId = Object.prototype.hasOwnProperty.call(req, 'parent_id')
  const parentId = req.parent_id ?? null
  return await withSchemaRetry(db, async () => (
    await db
      .prepare(
        `UPDATE bookmarks
         SET category_id = ?,
             parent_id = CASE WHEN ? = 0 THEN parent_id ELSE ? END,
             title = ?,
             url = ?,
             icon_blob = CASE
               WHEN ((icon IS NULL AND ? IS NULL) OR icon = ?)
                AND ((icon_source IS NULL AND ? IS NULL) OR icon_source = ?)
               THEN icon_blob
               ELSE NULL
             END,
             icon = ?,
             icon_source = ?,
             icon_background_color = ?,
             description = ?,
             description_mode = CASE WHEN ? = 0 THEN description_mode ELSE ? END,
             open_method = COALESCE(?, open_method)
         WHERE id = ? AND EXISTS (SELECT 1 FROM categories WHERE id = ?)
           AND (? = 0 OR ? IS NULL OR EXISTS (
             SELECT 1 FROM bookmarks parent WHERE parent.id = ? AND parent.category_id = ?
           ))
         RETURNING id, category_id, parent_id, title, url, icon, icon_source, icon_background_color, icon_blob, description, description_mode, open_method, sort, created_at`,
      )
      .bind(
        req.category_id,
        hasParentId ? 1 : 0,
        parentId,
        req.title,
        req.url,
        nextIcon,
        nextIcon,
        nextIconSource,
        nextIconSource,
        nextIcon,
        nextIconSource,
        req.icon_background_color ?? null,
        req.description ?? null,
        hasDescriptionMode ? 1 : 0,
        req.description_mode ?? null,
        openMethod,
        id,
        req.category_id,
        hasParentId ? 1 : 0,
        parentId,
        parentId,
        req.category_id,
      )
      .first<Bookmark>()
  ))
}

export async function deleteBookmark(db: D1Database, id: number): Promise<boolean> {
  return await withSchemaRetry(db, async () => {
    const res = await db.prepare(
      `WITH RECURSIVE descendants(id) AS (
         SELECT id FROM bookmarks WHERE id = ?
         UNION ALL
         SELECT bookmark.id FROM bookmarks bookmark
         JOIN descendants parent ON bookmark.parent_id = parent.id
       )
       DELETE FROM bookmarks WHERE id IN (SELECT id FROM descendants)`,
    ).bind(id).run()
    return (res.meta.changes ?? 0) > 0
  })
}

export async function batchDeleteBookmarks(db: D1Database, ids: number[]): Promise<number> {
  if (ids.length === 0) return 0
  const placeholders = ids.map(() => '?').join(', ')
  return await withSchemaRetry(db, async () => {
    const result = await db.prepare(
      `WITH RECURSIVE descendants(id) AS (
         SELECT id FROM bookmarks WHERE id IN (${placeholders})
         UNION
         SELECT bookmark.id FROM bookmarks bookmark
         JOIN descendants parent ON bookmark.parent_id = parent.id
       )
       DELETE FROM bookmarks WHERE id IN (SELECT id FROM descendants)`,
    ).bind(...ids).run()
    return result.meta.changes ?? 0
  })
}

export async function sortBookmarks(db: D1Database, ids: number[]): Promise<void> {
  await sortRowsByIds(db, 'bookmarks', ids)
}

export async function setIconBlob(db: D1Database, id: number, blob: string | null): Promise<void> {
  await db
    .prepare("UPDATE bookmarks SET icon_blob = ? WHERE id = ?")
    .bind(blob, id)
    .run()
}
