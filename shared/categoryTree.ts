export type CategoryTreeItem = {
  id: number
  title: string
  parent_id?: number | null
  sort: number
}

export type CategoryTreeEntry<T extends CategoryTreeItem> = {
  category: T
  depth: number
  path: string[]
  hasChildren: boolean
}

function compareCategories<T extends CategoryTreeItem>(a: T, b: T): number {
  return a.sort - b.sort || a.id - b.id
}

export function flattenCategoryTree<T extends CategoryTreeItem>(categories: T[]): CategoryTreeEntry<T>[] {
  const categoryById = new Map(categories.map((category) => [category.id, category]))
  const childrenByParent = new Map<number | null, T[]>()

  for (const category of categories) {
    const requestedParentId = category.parent_id ?? null
    const parentId = requestedParentId !== category.id && categoryById.has(requestedParentId ?? -1)
      ? requestedParentId
      : null
    const siblings = childrenByParent.get(parentId) ?? []
    siblings.push(category)
    childrenByParent.set(parentId, siblings)
  }

  for (const siblings of childrenByParent.values()) siblings.sort(compareCategories)

  const entries: CategoryTreeEntry<T>[] = []
  const visited = new Set<number>()
  const visiting = new Set<number>()

  function visit(category: T, depth: number, parentPath: string[]): void {
    if (visited.has(category.id) || visiting.has(category.id)) return
    visiting.add(category.id)
    const path = [...parentPath, category.title]
    const children = childrenByParent.get(category.id) ?? []
    entries.push({ category, depth, path, hasChildren: children.length > 0 })
    for (const child of children) visit(child, depth + 1, path)
    visiting.delete(category.id)
    visited.add(category.id)
  }

  for (const root of childrenByParent.get(null) ?? []) visit(root, 0, [])

  // Malformed legacy/imported cycles should still remain manageable in the UI.
  for (const category of [...categories].sort(compareCategories)) {
    if (!visited.has(category.id)) visit(category, 0, [])
  }

  return entries
}

export function getCategoryDescendantIds<T extends CategoryTreeItem>(
  categories: T[],
  categoryId: number,
): Set<number> {
  const childrenByParent = new Map<number, number[]>()
  for (const category of categories) {
    const parentId = category.parent_id ?? null
    if (parentId == null) continue
    const childIds = childrenByParent.get(parentId) ?? []
    childIds.push(category.id)
    childrenByParent.set(parentId, childIds)
  }

  const descendants = new Set<number>()
  const pending = [...(childrenByParent.get(categoryId) ?? [])]
  while (pending.length > 0) {
    const id = pending.pop()!
    if (id === categoryId || descendants.has(id)) continue
    descendants.add(id)
    pending.push(...(childrenByParent.get(id) ?? []))
  }
  return descendants
}

export function includeCategoryAncestors<T extends CategoryTreeItem>(
  categories: T[],
  categoryIds: Iterable<number>,
): Set<number> {
  const categoryById = new Map(categories.map((category) => [category.id, category]))
  const visibleIds = new Set(categoryIds)

  for (const id of [...visibleIds]) {
    let current = categoryById.get(id)
    const visited = new Set<number>()
    while (current?.parent_id != null && !visited.has(current.id)) {
      visited.add(current.id)
      const parent = categoryById.get(current.parent_id)
      if (!parent) break
      visibleIds.add(parent.id)
      current = parent
    }
  }

  return visibleIds
}

export function canAssignCategoryParent<T extends CategoryTreeItem>(
  categories: T[],
  categoryId: number,
  parentId: number | null,
): boolean {
  if (parentId == null) return true
  if (parentId === categoryId || !categories.some((category) => category.id === parentId)) return false
  return !getCategoryDescendantIds(categories, categoryId).has(parentId)
}

export function getCategoryPathMap<T extends CategoryTreeItem>(categories: T[]): Map<number, string> {
  return new Map(flattenCategoryTree(categories).map(({ category, path }) => [category.id, path.join(' / ')]))
}
