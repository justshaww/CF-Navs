<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type { CardStyle, PublicBookmark } from '../../shared/types'
  import BookmarkCardCompact from './BookmarkCardCompact.svelte'
  import BookmarkCardInfo from './BookmarkCardInfo.svelte'
  import BookmarkContextMenu from './BookmarkContextMenu.svelte'
  import BookmarkLinkModal from './BookmarkLinkModal.svelte'
  import { buildIconStyle, createIconVersion } from '../lib/bookmarkIconDisplay'
  import { iconifyProxyIcon, isIconifyIconUrl, logoSurfIcon } from '../lib/icons'
  import { observeIconVisibility } from '../lib/iconVisibility'
  import {
    createBookmarkIconCacheKey,
    readCachedBookmarkIconDataUri,
    readCachedBookmarkIconUrl,
    revokeLocalIconUrl,
  } from '../lib/localBookmarkIconCache'

  type AsyncVoid<T = void> = T | Promise<T>

  const CONTEXT_MENU_OPEN_EVENT = 'cf-navs-bookmark-context-menu-open'

  export let bookmark: PublicBookmark
  export let style: CardStyle = 'info'
  export let iconSize: number = 100
  export let showDescription: boolean = true
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
  let iconInView = true
  let shellElement: HTMLDivElement | null = null
  let stopIconVisibilityObserver: (() => void) | null = null
  let contextMenuOpen = false
  let modalOpen = false
  let iconStateKey = ''
  let windowListenersAttached = false
  let contextMenuInstanceId = Math.random().toString(36).slice(2)

  $: openInNewTab = bookmark.open_method === 1
  $: openInModal = bookmark.open_method === 3
  $: rawIcon = bookmark.icon?.trim() ?? ''
  $: cachedIcon = bookmark.icon_blob?.trim() ?? ''
  $: customTextIcon =
    rawIcon &&
    bookmark.icon_source !== 'logo_surf' &&
    bookmark.icon_source !== 'iconify' &&
    !isIconifyIconUrl(rawIcon) &&
    !/^data:image\//i.test(rawIcon) &&
    !/^https?:\/\//i.test(rawIcon)
      ? rawIcon
      : ''
  $: iconText = customTextIcon || bookmark.title.trim().slice(0, 1) || '书'
  $: infoCardHeight = height > 0 ? height : 70
  $: infoIconInset = infoCardHeight <= 56 ? 6 : 8
  $: infoIconSize = Math.max(32, Math.min(infoCardHeight - infoIconInset * 2, width - infoIconInset * 2))
  $: compactIconSize = Math.max(0, iconSize)
  $: iconBackgroundColor = bookmark.icon_background_color || ''
  $: hasCustomIconBackground = Boolean(iconBackgroundColor)
  $: infoIconStyle = buildIconStyle(infoIconSize, { customBackground: iconBackgroundColor })
  $: compactIconStyle = buildIconStyle(compactIconSize, {
    compact: true,
    customBackground: iconBackgroundColor,
  })
  $: tooltipText = bookmark.description ? `${bookmark.title}\n${bookmark.description}` : bookmark.title
  $: nextIconStateKey = `${bookmark.id}:${bookmark.icon_source ?? ''}:${bookmark.icon ?? ''}:${bookmark.icon_blob ?? ''}:${bookmark.title}:${bookmark.url}:${iconInView}`
  $: localCacheKey = createBookmarkIconCacheKey({
    id: bookmark.id,
    icon: rawIcon,
    iconSource: bookmark.icon_source,
  })
  $: hasEmbeddedIcon = /^data:image\//i.test(cachedIcon)
  $: hasCachedRemoteIcon = Boolean(bookmark.icon_cached) && !hasEmbeddedIcon
  $: syncLocalCachedIconUrl = iconInView && !hasEmbeddedIcon
    ? readCachedBookmarkIconDataUri(localCacheKey) ?? ''
    : ''
  $: cardShellStyle =
    style === 'info'
      ? `min-width: ${width}px; ${height > 0 ? `height: ${height}px;` : ''}`
      : `width: ${compactIconSize}px; height: ${compactIconSize}px;`
  $: cardLinkStyle = height > 0 ? `height: ${height}px;` : ''
  $: iconifyRemoteUrl =
    bookmark.icon_source === 'iconify' || isIconifyIconUrl(rawIcon)
      ? iconifyProxyIcon(rawIcon)
      : ''
  $: canUseRawHttpIconFallback =
    /^https?:\/\//i.test(rawIcon) &&
    !iconifyRemoteUrl &&
    bookmark.icon_source !== 'logo_surf' &&
    !customTextIcon
  $: shouldReadLocalIconCache =
    iconInView &&
    Boolean(rawIcon) &&
    !iconifyRemoteUrl &&
    !hasEmbeddedIcon &&
    bookmark.icon_source !== 'logo_surf' &&
    !customTextIcon
  $: shouldUseIconProxy = canUseRawHttpIconFallback || hasCachedRemoteIcon
  $: shouldWaitForLocalIconCache = false
  $: proxiedHttpIconUrl = shouldUseIconProxy
    ? `/api/icon/${encodeURIComponent(String(bookmark.id))}?v=${createIconVersion(`${bookmark.id}:${rawIcon}:${bookmark.title}:${bookmark.url}`)}`
    : ''
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
  $: syncWindowListeners(contextMenuOpen || modalOpen)

  $: iconUrl = (() => {
    if (!iconInView) return ''
    if (bookmark.icon_source === 'logo_surf') return bookmark.icon || logoSurfIcon(bookmark.title, bookmark.url)
    if (!cachedIconFailed && hasEmbeddedIcon) return cachedIcon
    if (syncLocalCachedIconUrl) return syncLocalCachedIconUrl
    if (localCachedIconUrl) return localCachedIconUrl
    if (localCachePending && shouldWaitForLocalIconCache) return ''
    if ((!rawIcon && !hasCachedRemoteIcon) || customTextIcon) return ''
    if (iconifyRemoteUrl) return iconifyRemoteUrl
    if (/^data:image\//i.test(rawIcon)) return rawIcon
    if (shouldUseIconProxy) return proxiedHttpIconUrl
    return ''
  })()
  $: hasRenderableIcon = Boolean(iconUrl) && !fallbackFailed

  function resetLocalCachedIconUrl() {
    if (localCachedIconUrl) {
      revokeLocalIconUrl(localCachedIconUrl)
      localCachedIconUrl = ''
    }
  }

  async function loadLocalCachedIcon(cacheKey: string, waitForLocalCache: boolean) {
    const requestId = ++localCacheRequestId

    if (waitForLocalCache) {
      localCachePending = true
    }

    const cachedUrl = await readCachedBookmarkIconUrl(cacheKey)
    if (requestId !== localCacheRequestId) {
      if (cachedUrl) revokeLocalIconUrl(cachedUrl)
      return
    }

    if (cachedUrl) {
      resetLocalCachedIconUrl()
      localCachedIconUrl = cachedUrl
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
    window.dispatchEvent(new CustomEvent(CONTEXT_MENU_OPEN_EVENT, {
      detail: contextMenuInstanceId,
    }))
  }

  function handleContextMenuOpenEvent(event: Event) {
    const sourceId = (event as CustomEvent<string>).detail
    if (sourceId !== contextMenuInstanceId) {
      closeContextMenu()
    }
  }

  function handleContextMenu(event: MouseEvent) {
    if (sortMode) {
      event.preventDefault()
      return
    }
    if (!canEdit || !onEdit) return
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
    if (sortMode) {
      event.preventDefault()
      return
    }
    if (!openInModal) return
    event.preventDefault()
    modalOpen = true
  }

  function closeModal() {
    modalOpen = false
  }

  function handleWindowClick() {
    if (contextMenuOpen) closeContextMenu()
  }

  function handleDocumentKeydown(event: KeyboardEvent) {
    if (modalOpen && event.key === 'Escape') closeModal()
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
      window.addEventListener(CONTEXT_MENU_OPEN_EVENT, handleContextMenuOpenEvent)
      windowListenersAttached = true
      return
    }

    if (!active && windowListenersAttached) {
      window.removeEventListener('click', handleWindowClick)
      window.removeEventListener('keydown', handleDocumentKeydown)
      window.removeEventListener(CONTEXT_MENU_OPEN_EVENT, handleContextMenuOpenEvent)
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
      iconUrl={hasRenderableIcon ? iconUrl : ''}
      {iconText}
      {infoIconSize}
      {infoIconStyle}
      {hasCustomIconBackground}
      onLinkClick={handleLinkClick}
      onContextMenu={handleContextMenu}
      onIconError={handleIconError}
      onIconLoad={handleIconLoad}
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

  {#if contextMenuOpen}
    <BookmarkContextMenu onEdit={handleEditClick} />
  {/if}

  {#if modalOpen}
    <BookmarkLinkModal title={bookmark.title} url={bookmark.url} onClose={closeModal} />
  {/if}
</div>

<style>
  .bookmark-card-shell {
    position: relative;
    min-width: 0;
    contain: layout style;
  }

  .bookmark-card-shell.is-info {
    width: 100%;
  }

  .bookmark-card-shell.is-icon {
    flex: 0 0 auto;
    aspect-ratio: 1 / 1;
  }

</style>
