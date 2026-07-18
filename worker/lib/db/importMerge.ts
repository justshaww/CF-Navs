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
  const byName = new Map(categories.map((category) => [category.title.trim().toLowerCase(), category]))
  let nextCategoryId = Math.max(0, ...categories.map((category) => category.id)) + 1
  let nextBookmarkId = Math.max(0, ...bookmarks.map((bookmark) => bookmark.id)) + 1
  let createdCategories = 0
  let reusedCategories = 0
  let skippedBookmarks = 0
  const categoryMap = new Map<number, Category>()
  const bookmarkIdMap = new Map<number, number>()
  const now = Date.now()

  incoming.categories.forEach((incomingCategory, index) => {
    const key = incomingCategory.title.trim().toLowerCase()
    const existing = byName.get(key)
    if (existing) { categoryMap.set(incomingCategory.id, existing); reusedCategories += 1; return }
    const category: Category = { ...incomingCategory, id: nextCategoryId++, sort: categories.length + index, created_at: incomingCategory.created_at || now }
    categories.push(category)
    byName.set(key, category)
    categoryMap.set(incomingCategory.id, category)
    createdCategories += 1
  })

  for (const incomingBookmark of incoming.bookmarks) {
    if (categoryMap.has(incomingBookmark.category_id)) {
      bookmarkIdMap.set(incomingBookmark.id, nextBookmarkId++)
    }
  }

  const nextSortByParent = new Map<string, number>()
  const siblingKey = (categoryId: number, parentId: number | null) => `${categoryId}:${parentId ?? 'root'}`
  categories.forEach((category) => {
    const categoryBookmarks = bookmarks.filter((bookmark) => bookmark.category_id === category.id)
    const parentIds = new Set<number | null>(categoryBookmarks.map((bookmark) => bookmark.parent_id ?? null))
    parentIds.add(null)
    parentIds.forEach((parentId) => {
      nextSortByParent.set(
        siblingKey(category.id, parentId),
        Math.max(-1, ...categoryBookmarks.filter((bookmark) => (bookmark.parent_id ?? null) === parentId).map((bookmark) => bookmark.sort)),
      )
    })
  })
  incoming.bookmarks.forEach((incomingBookmark) => {
    const category = categoryMap.get(incomingBookmark.category_id)
    if (!category) { skippedBookmarks += 1; return }
    const parentId = incomingBookmark.parent_id == null ? null : bookmarkIdMap.get(incomingBookmark.parent_id) ?? null
    const key = siblingKey(category.id, parentId)
    const sort = (nextSortByParent.get(key) ?? -1) + 1
    nextSortByParent.set(key, sort)
    const bookmark: Bookmark = { ...incomingBookmark, id: bookmarkIdMap.get(incomingBookmark.id)!, category_id: category.id, parent_id: parentId, sort, created_at: incomingBookmark.created_at || now }
    bookmarks.push(bookmark)
  })
  return { payload: { categories, bookmarks }, createdCategories, reusedCategories, skippedBookmarks }
}
