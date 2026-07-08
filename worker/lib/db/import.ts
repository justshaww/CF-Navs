// 数据导入（覆盖式：清空后重建，保留原始 id 以维持关联）

import { type Bookmark, type Category, type Settings } from '../../../shared/types'
import { ensureSchema } from './schema'
import { settingsPatchStatement } from './settings'
import { normalizeImportCategory, normalizeImportBookmark } from './importHelpers'

export async function importData(
  db: D1Database,
  data: { categories: Category[]; bookmarks: Bookmark[]; settings?: Partial<Settings> },
): Promise<{ categories: number; bookmarks: number; importedCategories: Category[]; importedBookmarks: Bookmark[] }> {
  await ensureSchema(db)
  const now = Date.now()
  const stmts: D1PreparedStatement[] = []
  const importedCategories: Category[] = []
  const importedBookmarks: Bookmark[] = []

  // 先清空（顺序：先书签后分类）
  stmts.push(db.prepare('DELETE FROM bookmarks'))
  stmts.push(db.prepare('DELETE FROM categories'))

  for (const c of data.categories) {
    const category = normalizeImportCategory(c, now)
    importedCategories.push(category)
    stmts.push(
      db
        .prepare('INSERT INTO categories (id, title, icon, sort, created_at) VALUES (?, ?, ?, ?, ?)')
        .bind(category.id, category.title, category.icon, category.sort, category.created_at),
    )
  }

  for (const b of data.bookmarks) {
    const bookmark = normalizeImportBookmark(b, now)
    importedBookmarks.push(bookmark)
    stmts.push(
      db
        .prepare(
          'INSERT INTO bookmarks (id, category_id, title, url, icon, icon_source, icon_background_color, icon_blob, description, open_method, sort, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        )
        .bind(
          bookmark.id,
          bookmark.category_id,
          bookmark.title,
          bookmark.url,
          bookmark.icon,
          bookmark.icon_source,
          bookmark.icon_background_color,
          bookmark.icon_blob,
          bookmark.description,
          bookmark.open_method,
          bookmark.sort,
          bookmark.created_at,
        ),
    )
  }

  // 设置（仅写入受支持的 key，绝不触碰 admin_* 等内部 key）
  if (data.settings) {
    const settingsStmt = settingsPatchStatement(db, data.settings)
    if (settingsStmt) stmts.push(settingsStmt)
  }

  await db.batch(stmts)
  importedCategories.sort((a, b) => a.sort - b.sort || a.id - b.id)
  importedBookmarks.sort((a, b) => a.sort - b.sort || a.id - b.id)
  return {
    categories: importedCategories.length,
    bookmarks: importedBookmarks.length,
    importedCategories,
    importedBookmarks,
  }
}
