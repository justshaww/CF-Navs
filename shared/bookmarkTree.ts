export type BookmarkTreeItem = {
  id: number
  category_id: number
  parent_id?: number | null
}

export function getBookmarkParentId(item: BookmarkTreeItem): number | null {
  return Number.isInteger(item.parent_id) && Number(item.parent_id) > 0
    ? Number(item.parent_id)
    : null
}

export function getBookmarkChildrenMap<T extends BookmarkTreeItem>(items: T[]): Map<number, T[]> {
  const children = new Map<number, T[]>()
  const itemIds = new Set(items.map((item) => item.id))

  for (const item of items) {
    const parentId = getBookmarkParentId(item)
    if (parentId == null || !itemIds.has(parentId)) continue
    const siblings = children.get(parentId) ?? []
    siblings.push(item)
    children.set(parentId, siblings)
  }

  return children
}

export function getTopLevelBookmarks<T extends BookmarkTreeItem>(items: T[]): T[] {
  const itemIds = new Set(items.map((item) => item.id))
  return items.filter((item) => {
    const parentId = getBookmarkParentId(item)
    return parentId == null || !itemIds.has(parentId)
  })
}

export function getBookmarkDescendantIds<T extends BookmarkTreeItem>(items: T[], rootIds: number[]): Set<number> {
  const children = getBookmarkChildrenMap(items)
  const descendants = new Set<number>()
  const queue = [...rootIds]

  while (queue.length > 0) {
    const parentId = queue.shift()!
    for (const child of children.get(parentId) ?? []) {
      if (descendants.has(child.id) || rootIds.includes(child.id)) continue
      descendants.add(child.id)
      queue.push(child.id)
    }
  }

  return descendants
}

export function getBookmarkParentValidationError<T extends BookmarkTreeItem>(
  items: T[],
  bookmarkId: number | null,
  categoryId: number,
  parentId: number | null,
): string | null {
  if (parentId == null) return null
  if (bookmarkId != null && parentId === bookmarkId) return 'bookmark cannot be its own parent'

  const byId = new Map(items.map((item) => [item.id, item]))
  const parent = byId.get(parentId)
  if (!parent) return 'parent bookmark not found'
  if (parent.category_id !== categoryId) return 'parent bookmark must be in the same category'

  const visited = new Set<number>()
  let current: T | undefined = parent
  while (current) {
    if (bookmarkId != null && current.id === bookmarkId) return 'bookmark hierarchy cannot contain a cycle'
    if (visited.has(current.id)) return 'bookmark hierarchy cannot contain a cycle'
    visited.add(current.id)
    const nextParentId = getBookmarkParentId(current)
    current = nextParentId == null ? undefined : byId.get(nextParentId)
  }

  return null
}

export function sortBookmarksParentsFirst<T extends BookmarkTreeItem>(items: T[]): T[] {
  const byId = new Map(items.map((item) => [item.id, item]))
  const depthMemo = new Map<number, number>()

  function getDepth(item: T, visiting = new Set<number>()): number {
    const memoized = depthMemo.get(item.id)
    if (memoized != null) return memoized
    if (visiting.has(item.id)) return 0
    visiting.add(item.id)
    const parentId = getBookmarkParentId(item)
    const parent = parentId == null ? undefined : byId.get(parentId)
    const depth = parent ? getDepth(parent, visiting) + 1 : 0
    depthMemo.set(item.id, depth)
    return depth
  }

  return [...items].sort((a, b) => getDepth(a) - getDepth(b))
}
