<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type { CardStyle, DescriptionDisplayMode, PublicBookmark } from '../../shared/types'
  import BookmarkCardCompact from './BookmarkCardCompact.svelte'
  import BookmarkCardInfo from './BookmarkCardInfo.svelte'
  import BookmarkContextMenu from './BookmarkContextMenu.svelte'
  import BookmarkLinkModal from './BookmarkLinkModal.svelte'
  import BookmarkChildrenModal from './BookmarkChildrenModal.svelte'
  import BookmarkDetailsSheet from './BookmarkDetailsSheet.svelte'
  import { getIconCardTrackWidth } from '../lib/bookmarkCardLayout'
  import { buildIconStyle } from '../lib/bookmarkIconDisplay'
  import {
    BOOKMARK_CONTEXT_MENU_OPEN_EVENT,
    canOpenBookmarkContextMenu,
    createBookmarkContextMenuOpenEvent,
    isExternalContextMenuOpenEvent,
    shouldBlockCardNavigation,
    shouldOpenBookmarkModal,
  } from '../lib/bookmarkCardInteractions'
  import {
    deriveBookmarkCardIconBase,
    deriveBookmarkCardIconUrl,
  } from '../lib/bookmarkCardIconState'
  import { observeIconVisibility } from '../lib/iconVisibility'
  import {
    fetchCachedBookmarkIconUrl,
    readCachedBookmarkIconDataUri,
    revokeLocalIconUrl,
  } from '../lib/localBookmarkIconCache'

  type AsyncVoid<T = void> = T | Promise<T>

  export let bookmark: PublicBookmark
  export let children: PublicBookmark[] = []
  export let style: CardStyle = 'info'
  export let iconSize: number = 100
  export let showDescription: boolean = true
  export let descriptionMode: DescriptionDisplayMode = showDescription ? 'always' : 'hidden'
  export let showIconTitle: boolean = true
  export let width: number = 200
  export let height: number = 0
  export let canEdit = false
  export let sortMode = false
  export let onEdit: ((bookmark: PublicBookmark) => AsyncVoid) | undefined = undefined

  let cachedIconFailed = false
  let fallbackFailed = false
  let localCachedIconUrl = ''
  let syncLocalCachedIconUrl = ''
  let localCachePending = false
  let localCacheRequestId = 0
  let iconInView = false
  let shellElement: HTMLDivElement | null = null
  let stopIconVisibilityObserver: (() => void) | null = null
  let contextMenuOpen = false
  let modalOpen = false
  let childrenModalOpen = false
  let descriptionDetailsOpen = false
  let descriptionOverflow = false
  let descriptionStateKey = ''
  let iconStateKey = ''
  let windowListenersAttached = false
  let contextMenuInstanceId = Math.random().toString(36).slice(2)

  $: openInNewTab = bookmark.open_method === 1
  $: iconBaseState = deriveBookmarkCardIconBase({
    bookmark,
    iconInView,
  })
  $: cachedIcon = iconBaseState.cachedIcon
  $: iconText = iconBaseState.iconText
  $: nextIconStateKey = iconBaseState.nextIconStateKey
  $: localCacheKey = iconBaseState.localCacheKey
  $: shouldReadLocalIconCache = iconBaseState.shouldReadLocalIconCache
  $: shouldWaitForLocalIconCache = iconBaseState.shouldWaitForLocalIconCache
  $: syncLocalCachedIconUrl = iconInView && !iconBaseState.hasEmbeddedIcon
    ? readCachedBookmarkIconDataUri(localCacheKey) ?? ''
    : ''
  $: iconUrlState = deriveBookmarkCardIconUrl({
    bookmark,
    baseState: iconBaseState,
    cachedIconFailed,
    fallbackFailed,
    syncLocalCachedIconUrl,
    localCachedIconUrl,
    localCachePending,
  })
  $: iconUrl = iconUrlState.iconUrl
  $: hasRenderableIcon = iconUrlState.hasRenderableIcon
  $: infoCardHeight = height > 0 ? height : 70
  $: infoIconInset = infoCardHeight <= 56 ? 6 : 8
  $: infoIconSize = Math.max(32, Math.min(infoCardHeight - infoIconInset * 2, width - infoIconInset * 2))
  $: compactIconSize = Math.max(0, iconSize)
  $: compactShellWidth = getIconCardTrackWidth(compactIconSize, showIconTitle)
  $: iconBackgroundColor = bookmark.icon_background_color || ''
  $: hasCustomIconBackground = Boolean(iconBackgroundColor)
  $: infoIconStyle = buildIconStyle(infoIconSize, { customBackground: iconBackgroundColor })
  $: compactIconStyle = buildIconStyle(compactIconSize, {
    compact: true,
    customBackground: iconBackgroundColor,
  })
  $: tooltipText = bookmark.description ? `${bookmark.title}\n${bookmark.description}` : bookmark.title
  $: cardShellStyle =
    style === 'info'
      ? `min-width: ${width}px; --bookmark-card-height: ${infoCardHeight}px;`
      : `width: ${compactShellWidth}px;`
  $: cardLinkStyle = `--bookmark-card-height: ${infoCardHeight}px;`
  $: nextDescriptionStateKey = `${bookmark.id}:${bookmark.description ?? ''}:${descriptionMode}`
  $: if (nextDescriptionStateKey !== descriptionStateKey) {
    descriptionStateKey = nextDescriptionStateKey
    descriptionOverflow = false
    descriptionDetailsOpen = false
  }
  $: if (nextIconStateKey !== iconStateKey) {
    iconStateKey = nextIconStateKey
    cachedIconFailed = false
    fallbackFailed = false
    resetLocalCachedIconUrl()
    if (shouldReadLocalIconCache) {
      void loadLocalCachedIcon(localCacheKey, shouldWaitForLocalIconCache)
    } else {
      localCachePending = false
    }
  }
  $: syncWindowListeners(contextMenuOpen || modalOpen || childrenModalOpen || descriptionDetailsOpen)

  function resetLocalCachedIconUrl() {
    if (localCachedIconUrl) {
      revokeLocalIconUrl(localCachedIconUrl)
      localCachedIconUrl = ''
    }
  }

  async function loadLocalCachedIcon(cacheKey: string, waitForLocalCache: boolean) {
    if (waitForLocalCache) {
      localCachePending = true
    }

    const result = await fetchCachedBookmarkIconUrl(cacheKey, { current: localCacheRequestId })
    if (result.stale) return
    if (result.url) {
      resetLocalCachedIconUrl()
      localCachedIconUrl = result.url
    }
    localCachePending = false
  }

  function handleIconError() {
    if (localCachedIconUrl) {
      resetLocalCachedIconUrl()
      return
    }

    if (!cachedIconFailed && /^data:image\//i.test(cachedIcon)) {
      cachedIconFailed = true
      return
    }

    fallbackFailed = true
  }

  function handleIconLoad() {
    localCachePending = false
    fallbackFailed = false
  }

  function closeContextMenu() {
    contextMenuOpen = false
  }

  function notifyContextMenuOpen() {
    window.dispatchEvent(createBookmarkContextMenuOpenEvent(contextMenuInstanceId))
  }

  function handleContextMenuOpenEvent(event: Event) {
    if (isExternalContextMenuOpenEvent(event, contextMenuInstanceId)) {
      closeContextMenu()
    }
  }

  function handleContextMenu(event: MouseEvent) {
    if (shouldBlockCardNavigation(sortMode)) {
      event.preventDefault()
      return
    }
    if (!canOpenBookmarkContextMenu({ sortMode, canEdit, hasEditHandler: Boolean(onEdit) })) return
    event.preventDefault()
    event.stopPropagation()
    notifyContextMenuOpen()
    contextMenuOpen = true
  }

  async function handleEditClick() {
    closeContextMenu()
    await onEdit?.(bookmark)
  }

  function handleLinkClick(event: MouseEvent) {
    if (shouldBlockCardNavigation(sortMode)) {
      event.preventDefault()
      return
    }
    if (!shouldOpenBookmarkModal({ sortMode, openMethod: bookmark.open_method })) return
    event.preventDefault()
    modalOpen = true
  }

  function closeModal() {
    modalOpen = false
  }

  function openChildrenModal() {
    if (sortMode || children.length === 0) return
    childrenModalOpen = true
  }

  function closeChildrenModal() {
    childrenModalOpen = false
  }

  function handleDescriptionOverflowChange(overflowing: boolean) {
    descriptionOverflow = overflowing
    if (!overflowing) descriptionDetailsOpen = false
  }

  function openDescriptionDetails() {
    if (sortMode || !descriptionOverflow || !bookmark.description) return
    descriptionDetailsOpen = true
  }

  function closeDescriptionDetails() {
    descriptionDetailsOpen = false
  }

  function handleWindowClick() {
    if (contextMenuOpen) closeContextMenu()
  }

  function handleDocumentKeydown(event: KeyboardEvent) {
    if (modalOpen && event.key === 'Escape') closeModal()
    if (childrenModalOpen && event.key === 'Escape') closeChildrenModal()
    if (descriptionDetailsOpen && event.key === 'Escape') closeDescriptionDetails()
    if (contextMenuOpen && event.key === 'Escape') closeContextMenu()
  }

  function markIconInView() {
    iconInView = true
    disconnectIconObserver()
  }

  function disconnectIconObserver() {
    stopIconVisibilityObserver?.()
    stopIconVisibilityObserver = null
  }

  function setupIconObserver() {
    disconnectIconObserver()
    if (iconInView) return

    if (shellElement) {
      stopIconVisibilityObserver = observeIconVisibility(shellElement, markIconInView)
    } else {
      iconInView = true
    }
  }

  function syncWindowListeners(active: boolean) {
    if (typeof window === 'undefined') return

    if (active && !windowListenersAttached) {
      window.addEventListener('click', handleWindowClick)
      window.addEventListener('keydown', handleDocumentKeydown)
      window.addEventListener(BOOKMARK_CONTEXT_MENU_OPEN_EVENT, handleContextMenuOpenEvent)
      windowListenersAttached = true
      return
    }

    if (!active && windowListenersAttached) {
      window.removeEventListener('click', handleWindowClick)
      window.removeEventListener('keydown', handleDocumentKeydown)
      window.removeEventListener(BOOKMARK_CONTEXT_MENU_OPEN_EVENT, handleContextMenuOpenEvent)
      windowListenersAttached = false
    }
  }

  onMount(() => {
    setupIconObserver()
  })

  onDestroy(() => {
    localCacheRequestId += 1
    disconnectIconObserver()
    resetLocalCachedIconUrl()
    syncWindowListeners(false)
  })
</script>

<div
  class="bookmark-card-shell"
  class:is-info={style === 'info'}
  class:is-icon={style !== 'info'}
  class:sort-mode={sortMode}
  style={cardShellStyle}
  bind:this={shellElement}
>
  {#if style === 'info'}
    <BookmarkCardInfo
      {bookmark}
      {openInNewTab}
      {sortMode}
      {cardLinkStyle}
      {showDescription}
      {descriptionMode}
      {tooltipText}
      iconUrl={hasRenderableIcon ? iconUrl : ''}
      {iconText}
      {infoIconSize}
      {infoIconStyle}
      {hasCustomIconBackground}
      hasChildren={children.length > 0}
      hasMobileDetails={descriptionOverflow && !sortMode}
      onLinkClick={handleLinkClick}
      onContextMenu={handleContextMenu}
      onIconError={handleIconError}
      onIconLoad={handleIconLoad}
      onDescriptionOverflowChange={handleDescriptionOverflowChange}
    />
  {:else}
    <BookmarkCardCompact
      {bookmark}
      {openInNewTab}
      {sortMode}
      {tooltipText}
      {compactIconSize}
      {compactIconStyle}
      {showIconTitle}
      iconUrl={hasRenderableIcon ? iconUrl : ''}
      {iconText}
      {hasCustomIconBackground}
      onLinkClick={handleLinkClick}
      onContextMenu={handleContextMenu}
      onIconError={handleIconError}
      onIconLoad={handleIconLoad}
    />
  {/if}

  {#if children.length > 0 && !sortMode}
    <button
      type="button"
      class="children-button"
      class:is-icon={style !== 'info'}
      aria-label={`查看 ${bookmark.title} 的 ${children.length} 个收藏帖子`}
      title="查看收藏帖子"
      on:click|stopPropagation={openChildrenModal}
    >
      <span aria-hidden="true">≡</span><strong>{children.length}</strong>
    </button>
  {/if}

  {#if style === 'info' && descriptionOverflow && bookmark.description && !sortMode}
    <button
      type="button"
      class="description-details-button"
      class:has-children={children.length > 0}
      aria-label={`查看 ${bookmark.title} 的完整描述`}
      title="查看完整描述"
      on:click|stopPropagation={openDescriptionDetails}
    ><span aria-hidden="true">i</span></button>
  {/if}

  {#if contextMenuOpen}
    <BookmarkContextMenu onEdit={handleEditClick} />
  {/if}

  {#if modalOpen}
    <BookmarkLinkModal title={bookmark.title} url={bookmark.url} onClose={closeModal} />
  {/if}


  {#if childrenModalOpen}
    <BookmarkChildrenModal parent={bookmark} {children} onClose={closeChildrenModal} />
  {/if}

  {#if descriptionDetailsOpen}
    <BookmarkDetailsSheet {bookmark} onClose={closeDescriptionDetails} />
  {/if}
</div>

<style>
  .bookmark-card-shell {
    position: relative;
    min-width: 0;
    contain: style;
  }

  .bookmark-card-shell.is-info {
    width: 100%;
  }

  .bookmark-card-shell.is-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 0 0 auto;
  }

  .children-button {
    position: absolute;
    z-index: 5;
    top: 50%;
    right: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-width: 34px;
    height: 28px;
    padding: 0 7px;
    border: 1px solid rgba(148, 163, 184, 0.32);
    border-radius: 14px;
    color: var(--card-title-color, #334155);
    background: rgba(255, 255, 255, 0.78);
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1);
    transform: translateY(-50%);
    cursor: pointer;
  }

  .children-button span { font-size: 17px; line-height: 1; }
  .children-button strong { font-size: 10px; }
  .children-button:hover { border-color: var(--theme-accent-color, #3b82f6); }
  .children-button.is-icon { top: -5px; right: -7px; transform: none; }
  :global([data-theme='dark']) .children-button { background: rgba(15, 23, 42, 0.86); }

  .description-details-button {
    position: absolute;
    z-index: 6;
    right: 0.45rem;
    bottom: 0.45rem;
    display: none;
    width: 1.8rem;
    height: 1.8rem;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 1px solid rgba(148, 163, 184, 0.34);
    border-radius: 50%;
    color: var(--card-title-color, #334155);
    background: rgba(255, 255, 255, 0.86);
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.1);
    cursor: pointer;
  }

  .description-details-button span {
    font-family: Georgia, serif;
    font-size: 0.9rem;
    font-weight: 700;
    line-height: 1;
  }

  .description-details-button.has-children {
    right: 3.15rem;
  }

  :global([data-theme='dark']) .description-details-button {
    border-color: rgba(148, 163, 184, 0.28);
    color: #e5eefb;
    background: rgba(15, 23, 42, 0.9);
  }

  @media (hover: none), (max-width: 720px) {
    .description-details-button {
      display: inline-flex;
    }
  }

</style>
