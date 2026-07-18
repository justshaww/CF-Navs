<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import type { PublicSettings } from '../../shared/types'
  import SearchBox from './SearchBox.svelte'

  export let pageTitle = ''
  export let siteTitleColor = 'inherit'
  export let siteTitleFontSize = 32
  export let settings: PublicSettings | null = null
  export let query = ''
  export let topNavigation = false

  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  let now = new Date()
  let timer: ReturnType<typeof setInterval> | null = null

  $: resolvedSiteTitleColor = siteTitleColor === 'inherit' ? '#37317d' : siteTitleColor
  $: hours = now.getHours()
  $: greeting = hours < 5
    ? '夜深了，shaw'
    : hours < 12
      ? '上午好，shaw'
      : hours < 18
        ? '下午好，shaw'
        : '晚上好，shaw'
  $: timeText = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  $: dateText = `${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]}`

  onMount(() => {
    timer = setInterval(() => {
      now = new Date()
    }, 1000)
  })

  onDestroy(() => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  })
</script>

<section class="hero-search" class:top-navigation={topNavigation} aria-label="站点搜索">
  <div class="hero-clock" aria-live="polite">
    <div class="hero-greeting">{greeting}</div>
    <div class="hero-time">{timeText}</div>
    <div class="hero-date">{dateText}</div>
  </div>
  <h1 class="site-title" style="--site-title-color: {resolvedSiteTitleColor}; font-size: {siteTitleFontSize}px;">{pageTitle}</h1>
  {#if settings?.search_box_show ?? true}
    <div class="search-card">
      <SearchBox
        searchEngine={settings?.search_engine ?? null}
        bind:query
        showEngineSelector={settings?.search_engine_selector_show ?? true}
      />
    </div>
  {/if}
</section>

<style>
  .hero-search {
    display: grid;
    gap: 0.95rem;
    max-width: 680px;
    margin: calc(2.35rem + var(--content-margin-top, 0%)) auto 1.35rem;
    text-align: center;
  }

  .hero-search.top-navigation {
    margin-top: calc(3.5rem + var(--content-margin-top, 0%));
  }

  .hero-clock {
    display: grid;
    gap: 0.15rem;
    justify-items: center;
    color: var(--home-text-color, #0f172a);
    text-shadow: 0 8px 30px rgba(15, 23, 42, 0.18);
  }

  .hero-greeting {
    font-size: 0.98rem;
    font-weight: 600;
    opacity: 0.74;
  }

  .hero-time {
    font-size: clamp(3.8rem, 9vw, 6.4rem);
    font-weight: 750;
    line-height: 0.95;
    letter-spacing: 0;
    font-variant-numeric: tabular-nums;
  }

  .hero-date {
    font-size: 1rem;
    font-weight: 650;
    opacity: 0.7;
  }

  .site-title {
    display: inline-block;
    position: relative;
    margin: 0.15rem 0 0;
    padding: 0.52em 0.32em 0;
    justify-self: center;
    font-family:
      'Arial Black',
      Impact,
      SimHei,
      'Microsoft YaHei UI',
      'Microsoft YaHei',
      'PingFang SC',
      'Hiragino Sans GB',
      sans-serif;
    font-style: italic;
    font-weight: 950;
    line-height: 0.95;
    overflow-wrap: anywhere;
    letter-spacing: -0.04em;
    color: var(--site-title-color, #37317d);
    -webkit-text-fill-color: var(--site-title-color, #37317d);
    -webkit-text-stroke: 0;
    paint-order: stroke fill;
    transform: skewX(-10deg);
    filter: drop-shadow(5px 5px 0 rgba(55, 49, 125, 0.12));
    text-shadow:
      0 2px 0 rgba(255, 255, 255, 0.92),
      3px 3px 0 rgba(255, 255, 255, 0.62),
      8px 10px 18px rgba(30, 41, 59, 0.16);
  }

  .site-title::before {
    content: "";
    position: absolute;
    left: 0.08em;
    right: 0.08em;
    top: 0.08em;
    height: 0.38em;
    background: #ff3434;
    clip-path: polygon(0 54%, 30% 0, 58% 52%, 100% 52%, 100% 82%, 56% 82%, 30% 30%, 0 84%);
    transform: skewX(10deg);
    transform-origin: center;
    filter: drop-shadow(3px 4px 0 rgba(55, 49, 125, 0.13));
  }

  :global([data-theme='dark']) .site-title {
    color: #d6d3ff;
    -webkit-text-fill-color: #d6d3ff;
    filter: drop-shadow(5px 5px 0 rgba(0, 0, 0, 0.2));
    text-shadow:
      0 2px 0 rgba(15, 23, 42, 0.8),
      4px 5px 0 rgba(49, 46, 129, 0.55),
      0 18px 38px rgba(0, 0, 0, 0.28);
  }

  .search-card {
    max-width: 680px;
    margin: 0;
    padding: 0.75rem 1rem;
    border-radius: 1.35rem;
    border: 1px solid rgba(255, 255, 255, 0.58);
    background: rgba(255, 255, 255, 0.56);
    box-shadow:
      0 18px 45px rgba(15, 23, 42, 0.12),
      inset 0 1px 0 rgba(255, 255, 255, 0.42);
    backdrop-filter: blur(18px) saturate(1.2);
    -webkit-backdrop-filter: blur(18px) saturate(1.2);
  }

  :global([data-theme='dark']) .search-card {
    border-color: rgba(255, 255, 255, 0.12);
    background: rgba(15, 23, 42, 0.34);
  }

  @media (max-width: 720px) {
    .hero-search {
      gap: 0.75rem;
      margin-top: 2.75rem;
      padding: 0 0.25rem;
    }

    .hero-time {
      font-size: clamp(3rem, 18vw, 4.6rem);
    }

    .hero-search.top-navigation {
      margin-top: 3rem;
    }

    .search-card {
      margin-top: 0.75rem;
      padding: 0.6rem;
      border-radius: 1rem;
    }
  }

  @media (max-width: 420px) {
    .search-card {
      padding: 0.55rem;
      border-radius: 0.95rem;
    }
  }
</style>
