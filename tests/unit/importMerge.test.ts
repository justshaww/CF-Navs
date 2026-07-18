import { describe, expect, it } from 'vitest'
import { mergeImportData } from '../../worker/lib/db/importMerge'

describe('merge import data', () => {
  it('reuses case-insensitive categories, remaps ids and preserves settings', () => {
    const result = mergeImportData({
      categories: [{ id: 4, title: ' Work ', icon: 'x', sort: 0, created_at: 1 }],
      bookmarks: [], settings: null,
    }, {
      categories: [{ id: 1, title: 'work', icon: null, sort: 0, created_at: 1 }],
      bookmarks: [{ id: 1, category_id: 1, title: 'A', url: 'https://a.test', icon: null, icon_source: null, icon_background_color: null, icon_blob: null, description: null, description_mode: null, open_method: 1, sort: 0, created_at: 1 }],
      settings: { site_title: 'Imported' },
    })
    expect(result.reusedCategories).toBe(1)
    expect(result.createdCategories).toBe(0)
    expect(result.payload.bookmarks[0].category_id).toBe(4)
    expect(result.payload.settings).toBeUndefined()
  })

  it('remaps imported bookmark parent ids', () => {
    const result = mergeImportData({ categories: [], bookmarks: [], settings: null }, {
      categories: [{ id: 1, title: 'Forums', icon: null, sort: 0, created_at: 1 }],
      bookmarks: [
        { id: 10, category_id: 1, parent_id: null, title: 'NodeSeek', url: 'https://nodeseek.com', icon: null, icon_source: null, icon_background_color: null, icon_blob: null, description: null, open_method: 1, sort: 0, created_at: 1 },
        { id: 11, category_id: 1, parent_id: 10, title: 'Post', url: 'https://nodeseek.com/post-1', icon: null, icon_source: null, icon_background_color: null, icon_blob: null, description: null, open_method: 1, sort: 0, created_at: 1 },
      ],
    })

    const parent = result.payload.bookmarks.find((bookmark) => bookmark.title === 'NodeSeek')!
    const child = result.payload.bookmarks.find((bookmark) => bookmark.title === 'Post')!
    expect(child.parent_id).toBe(parent.id)
  })
})
