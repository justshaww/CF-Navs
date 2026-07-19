<script lang="ts">
  import { onDestroy, onMount, tick } from 'svelte'
  import type { PublicBookmark } from '../../shared/types'

  export let bookmark: PublicBookmark
  export let onClose: (() => void) | undefined = undefined

  let closeButton: HTMLButtonElement | null = null
  let copied = false
  let copiedTimer: ReturnType<typeof setTimeout> | null = null
  let previousBodyOverflow = ''

  function handleBackdropClick(event: MouseEvent) {
    if (event.currentTarget === event.target) onClose?.()
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(bookmark.url)
    } catch {
      const input = document.createElement('textarea')
      input.value = bookmark.url
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      input.remove()
    }

    copied = true
    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => {
      copied = false
      copiedTimer = null
    }, 1600)
  }

  onMount(async () => {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    await tick()
    closeButton?.focus()
  })

  onDestroy(() => {
    document.body.style.overflow = previousBodyOverflow
    if (copiedTimer) clearTimeout(copiedTimer)
  })
</script>

<div class="details-backdrop" role="presentation" on:click={handleBackdropClick}>
  <section class="details-sheet" role="dialog" aria-modal="true" aria-labelledby="bookmark-details-title">
    <header>
      <div>
        <p>站点详情</p>
        <h2 id="bookmark-details-title">{bookmark.title}</h2>
      </div>
      <button bind:this={closeButton} class="close-button" type="button" aria-label="关闭站点详情" title="关闭" on:click={() => onClose?.()}>×</button>
    </header>

    {#if bookmark.description}
      <p class="description">{bookmark.description}</p>
    {/if}

    <p class="url">{bookmark.url}</p>

    <footer>
      <button type="button" class="secondary-action" on:click={copyLink}>
        {copied ? '已复制' : '复制链接'}
      </button>
      <a
        class="primary-action"
        href={bookmark.url}
        target={bookmark.open_method === 1 ? '_blank' : undefined}
        rel={bookmark.open_method === 1 ? 'noopener noreferrer' : undefined}
      >访问站点</a>
    </footer>
  </section>
</div>

<style>
  .details-backdrop {
    position: fixed;
    inset: 0;
    z-index: 130;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }

  .details-sheet {
    width: min(100%, 34rem);
    padding: 1.1rem;
    border: 1px solid rgba(255, 255, 255, 0.62);
    border-radius: 8px;
    color: #172033;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 24px 70px rgba(15, 23, 42, 0.3);
  }

  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  header p,
  header h2,
  .description,
  .url {
    margin: 0;
  }

  header p {
    color: #64748b;
    font-size: 0.75rem;
  }

  header h2 {
    margin-top: 0.2rem;
    font-size: 1.2rem;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }

  .close-button {
    width: 2.25rem;
    height: 2.25rem;
    flex: 0 0 2.25rem;
    border: 0;
    border-radius: 50%;
    color: #475569;
    background: #eef2f7;
    font: inherit;
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
  }

  .description {
    margin-top: 1rem;
    color: #334155;
    font-size: 0.95rem;
    line-height: 1.65;
    overflow-wrap: anywhere;
  }

  .url {
    margin-top: 0.85rem;
    padding: 0.65rem 0.75rem;
    border-radius: 6px;
    color: #475569;
    background: rgba(226, 232, 240, 0.68);
    font-size: 0.76rem;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  footer {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.65rem;
    margin-top: 1rem;
  }

  footer button,
  footer a {
    display: inline-flex;
    min-height: 2.75rem;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    font: inherit;
    font-size: 0.9rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
  }

  .secondary-action {
    border: 1px solid #cbd5e1;
    color: #334155;
    background: #ffffff;
  }

  .primary-action {
    border: 1px solid var(--theme-accent-color, #2563eb);
    color: #ffffff;
    background: var(--theme-accent-color, #2563eb);
  }

  :global([data-theme='dark']) .details-sheet {
    border-color: rgba(148, 163, 184, 0.25);
    color: #e5eefb;
    background: rgba(15, 23, 42, 0.96);
  }

  :global([data-theme='dark']) header p,
  :global([data-theme='dark']) .description,
  :global([data-theme='dark']) .url {
    color: #cbd5e1;
  }

  :global([data-theme='dark']) .close-button,
  :global([data-theme='dark']) .secondary-action {
    border-color: rgba(148, 163, 184, 0.28);
    color: #e5eefb;
    background: #1e293b;
  }

  :global([data-theme='dark']) .url {
    background: rgba(30, 41, 59, 0.82);
  }

  @media (min-width: 721px) {
    .details-backdrop {
      align-items: center;
    }
  }
</style>
