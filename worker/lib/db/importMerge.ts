import type { AdminData, Bookmark, Category, ImportReq } from '../../../shared/types'

export interface MergeResult {
  payload: Pick<ImportReq, 'categories' | 'bookmarks' | 'settings'>
  createdCategories: number
  reusedCategories: number
  skippedBookmarks: number
}

export function mergeImportData(current: AdminData, incoming: Pick<ImportReq, 'categories' | 'bookmarks' | 'settings'>): MergeResult {
  const categories = current.categories.map((category) => ({ ...category }))
  const bookmarks = current.bookmarks.map((bookmark) => ({ ...bookmark }))
  let nextCategoryId = Math.max(0, ...categories.map((category) => category.id)) + 1
  let nextBookmarkId = Math.max(0, ...bookmarks.map((bookmark) => bookmark.id)) + 1
  let createdCategories = 0
  let reusedCategories = 0
  let skippedBookmarks = 0
  const categoryMap = new Map<number, Category>()
  const now = Date.now()
  const currentById = new Map(categories.map((category) => [category.id, category]))
  const incomingById = new Map(incoming.categories.map((category) => [category.id, category]))

  function categoryPathKey(category: Category, byId: Map<number, Category>): string {
    const parts: string[] = []
    const visited = new Set<number>()
    let current: Category | undefined = category
    while (current && !visited.has(current.id)) {
      visited.add(current.id)
      parts.unshift(current.title.trim().toLowerCase())
      current = current.parent_id == null ? undefined : byId.get(current.parent_id)
    }
    return parts.join('\u0000')
  }

  const byPath = new Map(categories.map((category) => [categoryPathKey(category, currentById), category]))
  const resolving = new Set<number>()

  function resolveCategory(incomingCategory: Category, index: number): Category {
    const mapped = categoryMap.get(incomingCategory.id)
    if (mapped) return mapped
    if (resolving.has(incomingCategory.id)) throw new Error('category cycle in import data')
    resolving.add(incomingCategory.id)

    const incomingParent = incomingCategory.parent_id == null
      ? null
      : incomingById.get(incomingCategory.parent_id) ?? null
    const parent = incomingParent ? resolveCategory(incomingParent, incoming.categories.indexOf(incomingParent)) : null
    const parentPath = parent ? categoryPathKey(parent, currentById) : ''
    const key = [parentPath, incomingCategory.title.trim().toLowerCase()].filter(Boolean).join('\u0000')
    const existing = byPath.get(key)
    if (existing) {
      categoryMap.set(incomingCategory.id, existing)
      reusedCategories += 1
      resolving.delete(incomingCategory.id)
      return existing
    }

    const category: Category = {
      ...incomingCategory,
      id: nextCategoryId++,
      parent_id: parent?.id ?? null,
      sort: categories.length + index,
      created_at: incomingCategory.created_at || now,
    }
    categories.push(category)
    currentById.set(category.id, category)
    byPath.set(key, category)
    categoryMap.set(incomingCategory.id, category)
    createdCategories += 1
    resolving.delete(incomingCategory.id)
    return category
  }

  incoming.categories.forEach((category, index) => resolveCategory(category, index))

  const nextSortByCategory = new Map<number, number>()
  categories.forEach((category) => nextSortByCategory.set(category.id, Math.max(-1, ...bookmarks.filter((bookmark) => bookmark.category_id === category.id).map((bookmark) => bookmark.sort))))
  incoming.bookmarks.forEach((incomingBookmark) => {
    const category = categoryMap.get(incomingBookmark.category_id)
    if (!category) { skippedBookmarks += 1; return }
    const sort = (nextSortByCategory.get(category.id) ?? -1) + 1
    nextSortByCategory.set(category.id, sort)
    const bookmark: Bookmark = { ...incomingBookmark, id: nextBookmarkId++, category_id: category.id, sort, created_at: incomingBookmark.created_at || now }
    bookmarks.push(bookmark)
  })
  return { payload: { categories, bookmarks }, createdCategories, reusedCategories, skippedBookmarks }
}
