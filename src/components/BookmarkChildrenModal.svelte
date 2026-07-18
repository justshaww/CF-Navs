<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type { PublicBookmark } from '../../shared/types'
  import BookmarkLinkModal from './BookmarkLinkModal.svelte'

  export let parent: PublicBookmark
  export let children: PublicBookmark[] = []
  export let onClose: (() => void) | undefined = undefined

  let embeddedBookmark: PublicBookmark | null = null
  let previousBodyOverflow = ''

  function targetFor(bookmark: PublicBookmark): string | undefined {
    return bookmark.open_method === 1 ? '_blank' : undefined
  }

  function handleLinkClick(event: MouseEvent, bookmark: PublicBookmark) {
    if (bookmark.open_method !== 3) return
    event.preventDefault()
    embeddedBookmark = bookmark
  }

  function getHost(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '')
    } catch {
      return url
    }
  }

  function handleBackdropClick(event: MouseEvent) {
    if (event.currentTarget === event.target) onClose?.()
  }

  onMount(() => {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  })

  onDestroy(() => {
    document.body.style.overflow = previousBodyOverflow
  })
</script>

<div class="children-modal-backdrop" role="presentation" on:click={handleBackdropClick}>
  <section class="children-modal" role="dialog" aria-modal="true" aria-labelledby="children-modal-title">
    <header>
      <div>
        <p>收藏帖子</p>
        <h2 id="children-modal-title">{parent.title}</h2>
      </div>
      <button class="close-button" type="button" aria-label="关闭帖子列表" title="关闭" on:click={() => onClose?.()}>×</button>
    </header>

    <a
      class="homepage-link"
      href={parent.url}
      target={targetFor(parent)}
      rel={parent.open_method === 1 ? 'noopener noreferrer' : undefined}
      on:click={(event) => handleLinkClick(event, parent)}
    >
      <span>访问 {parent.title} 主页</span>
      <span aria-hidden="true">↗</span>
    </a>

    <div class="post-list">
      {#each children as child (child.id)}
        <a
          class="post-row"
          href={child.url}
          target={targetFor(child)}
          rel={child.open_method === 1 ? 'noopener noreferrer' : undefined}
          on:click={(event) => handleLinkClick(event, child)}
        >
          <span class="post-index" aria-hidden="true"></span>
          <span class="post-content">
            <strong>{child.title}</strong>
            {#if child.description}<small>{child.description}</small>{/if}
            <small>{getHost(child.url)}</small>
          </span>
          <span class="post-arrow" aria-hidden="true">›</span>
        </a>
      {/each}
    </div>
  </section>
</div>

{#if embeddedBookmark}
  <BookmarkLinkModal
    title={embeddedBookmark.title}
    url={embeddedBookmark.url}
    onClose={() => { embeddedBookmark = null }}
  />
{/if}

<style>
  .children-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 120;
    display: grid;
    place-items: center;
    padding: 16px;
    background: rgba(15, 23, 42, 0.56);
    backdrop-filter: blur(6px);
  }

  .children-modal {
    width: min(100%, 560px);
    max-height: min(680px, calc(100dvh - 32px));
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 8px;
    color: #172033;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 24px 70px rgba(15, 23, 42, 0.3);
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 20px 14px;
  }

  header p,
  header h2 { margin: 0; }
  header p { color: #64748b; font-size: 12px; }
  header h2 { margin-top: 3px; font-size: 20px; line-height: 1.3; }

  .close-button {
    width: 36px;
    height: 36px;
    flex: 0 0 36px;
    border: 0;
    border-radius: 50%;
    color: #475569;
    background: #eef2f7;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
  }

  .homepage-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 0 20px 12px;
    padding: 11px 13px;
    border-radius: 6px;
    color: #1d4ed8;
    background: #eff6ff;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
  }

  .post-list {
    min-height: 0;
    overflow-y: auto;
    padding: 0 10px 12px;
  }

  .post-row {
    display: grid;
    grid-template-columns: 10px minmax(0, 1fr) 18px;
    align-items: center;
    gap: 10px;
    padding: 13px 10px;
    border-top: 1px solid #e7ebf0;
    color: inherit;
    text-decoration: none;
  }

  .post-row:hover { background: #f7f9fc; }
  .post-index { width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; }
  .post-content { min-width: 0; display: flex; flex-direction: column; gap: 3px; }
  .post-content strong { overflow: hidden; color: #172033; font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
  .post-content small { overflow: hidden; color: #64748b; font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }
  .post-arrow { color: #94a3b8; font-size: 24px; }

  :global([data-theme='dark']) .children-modal {
    border-color: rgba(148, 163, 184, 0.24);
    color: #e5eefb;
    background: rgba(15, 23, 42, 0.96);
  }
  :global([data-theme='dark']) .close-button { color: #cbd5e1; background: #263449; }
  :global([data-theme='dark']) .homepage-link { color: #bae6fd; background: rgba(14, 165, 233, 0.14); }
  :global([data-theme='dark']) .post-row { border-color: rgba(148, 163, 184, 0.18); }
  :global([data-theme='dark']) .post-row:hover { background: rgba(148, 163, 184, 0.08); }
  :global([data-theme='dark']) .post-content strong { color: #e5eefb; }
  :global([data-theme='dark']) .post-content small,
  :global([data-theme='dark']) header p { color: #94a3b8; }
</style>
