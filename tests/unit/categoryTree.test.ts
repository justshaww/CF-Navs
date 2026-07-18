import { describe, expect, it } from 'vitest'
import {
  canAssignCategoryParent,
  flattenCategoryTree,
  getCategoryDescendantIds,
  getCategoryPathMap,
  includeCategoryAncestors,
} from '../../shared/categoryTree'

const categories = [
  { id: 1, title: 'Root B', parent_id: null, sort: 2 },
  { id: 2, title: 'Child', parent_id: 1, sort: 0 },
  { id: 3, title: 'Grandchild', parent_id: 2, sort: 0 },
  { id: 4, title: 'Root A', parent_id: null, sort: 1 },
]

describe('category tree helpers', () => {
  it('flattens categories in sibling sort order and keeps path metadata', () => {
    expect(flattenCategoryTree(categories).map(({ category, depth, path }) => ({
      id: category.id,
      depth,
      path: path.join(' / '),
    }))).toEqual([
      { id: 4, depth: 0, path: 'Root A' },
      { id: 1, depth: 0, path: 'Root B' },
      { id: 2, depth: 1, path: 'Root B / Child' },
      { id: 3, depth: 2, path: 'Root B / Child / Grandchild' },
    ])
    expect(getCategoryPathMap(categories).get(3)).toBe('Root B / Child / Grandchild')
  })

  it('finds descendants and includes ancestors for search results', () => {
    expect(getCategoryDescendantIds(categories, 1)).toEqual(new Set([2, 3]))
    expect(includeCategoryAncestors(categories, [3])).toEqual(new Set([3, 2, 1]))
  })

  it('rejects self and descendant parent assignments', () => {
    expect(canAssignCategoryParent(categories, 1, 3)).toBe(false)
    expect(canAssignCategoryParent(categories, 2, 2)).toBe(false)
    expect(canAssignCategoryParent(categories, 3, 4)).toBe(true)
    expect(canAssignCategoryParent(categories, 3, 99)).toBe(false)
  })
})
