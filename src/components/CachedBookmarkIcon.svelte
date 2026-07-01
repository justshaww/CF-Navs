<script lang="ts">
  import { onDestroy } from 'svelte'
  import {
    createBookmarkIconCacheKey,
    isDataImage,
    readCachedBookmarkIconDataUri,
    readCachedBookmarkIconUrl,
    revokeLocalIconUrl,
    writeBookmarkIconDataUri,
  } from '../lib/localBookmarkIconCache'

  export let id: string | number
  export let icon = ''
  export let iconSource: string | null | undefined = null
  export let iconBlob = ''
  export let src = ''
  export let alt = ''
  export let fallback = ''
  export let className = ''
  export let style = ''

  let localUrl = ''
  let syncLocalUrl = ''
  let cachePending = false
  let failed = false
  let stateKey = ''
  let requestId = 0

  $: trimmedIcon = icon.trim()
  $: trimmedIconBlob = iconBlob.trim()
  $: cacheKey = createBookmarkIconCacheKey({
    id,
    icon: trimmedIcon,
    iconSource,
  })
  $: syncLocalUrl = readCachedBookmarkIconDataUri(cacheKey) ?? ''
  $: shouldWaitForLocalCache = src.startsWith('/api/icon/') && !isDataImage(trimmedIconBlob)
  $: nextStateKey = `${cacheKey}:${trimmedIconBlob}:${src}`
  $: if (nextStateKey !== stateKey) {
    stateKey = nextStateKey
    failed = false
    resetLocalUrl()
    void loadCachedIcon(cacheKey, trimmedIconBlob, shouldWaitForLocalCache)
  }
  $: displaySrc =
    syncLocalUrl ||
    localUrl ||
    (!failed && isDataImage(trimmedIconBlob) ? trimmedIconBlob : shouldWaitForLocalCache ? '' : src)

  function resetLocalUrl() {
    if (localUrl) {
      revokeLocalIconUrl(localUrl)
      localUrl = ''
    }
  }

  async function loadCachedIcon(key: string, dataUri: string, waitForLocalCache: boolean) {
    const currentRequest = ++requestId

    if (isDataImage(dataUri)) {
      cachePending = false
      await writeBookmarkIconDataUri(key, dataUri)
      return
    }

    if (waitForLocalCache) {
      cachePending = true
    }

    const cached = await readCachedBookmarkIconUrl(key)
    if (currentRequest !== requestId) {
      if (cached) revokeLocalIconUrl(cached)
      return
    }

    if (cached) {
      resetLocalUrl()
      localUrl = cached
      cachePending = false
      return
    }

    if (!cached) {
      if (currentRequest === requestId) {
        cachePending = false
      }
      return
    }
  }

  function handleError() {
    if (localUrl) {
      resetLocalUrl()
      return
    }
    failed = true
  }

  onDestroy(() => {
    requestId += 1
    resetLocalUrl()
  })
</script>

{#if displaySrc}
  <img
    class={className}
    style={style}
    src={displaySrc}
    alt={alt}
    loading="lazy"
    decoding="async"
    on:error={handleError}
  />
{/if}
{#if !displaySrc && fallback}
  {fallback}
{/if}
