import { describe, expect, it } from 'vitest'
import {
  getBookmarkChildrenMap,
  getBookmarkDescendantIds,
  getBookmarkParentValidationError,
  getTopLevelBookmarks,
  sortBookmarksParentsFirst,
} from '../../shared/bookmarkTree'

const items = [
  { id: 1, category_id: 10, parent_id: null },
  { id: 2, category_id: 10, parent_id: 1 },
  { id: 3, category_id: 10, parent_id: 2 },
  { id: 4, category_id: 20, parent_id: null },
]

describe('bookmark tree helpers', () => {
  it('groups children while keeping only root bookmarks on the homepage', () => {
    expect(getTopLevelBookmarks(items).map((item) => item.id)).toEqual([1, 4])
    expect(getBookmarkChildrenMap(items).get(1)?.map((item) => item.id)).toEqual([2])
    expect([...getBookmarkDescendantIds(items, [1])]).toEqual([2, 3])
  })

  it('rejects missing parents, category mismatches and cycles', () => {
    expect(getBookmarkParentValidationError(items, null, 10, 99)).toBe('parent bookmark not found')
    expect(getBookmarkParentValidationError(items, null, 20, 1)).toBe('parent bookmark must be in the same category')
    expect(getBookmarkParentValidationError(items, 1, 10, 3)).toBe('bookmark hierarchy cannot contain a cycle')
    expect(getBookmarkParentValidationError(items, 2, 10, 1)).toBeNull()
  })

  it('orders imported parents before their descendants', () => {
    expect(sortBookmarksParentsFirst([items[2], items[1], items[0]]).map((item) => item.id)).toEqual([1, 2, 3])
  })
})
