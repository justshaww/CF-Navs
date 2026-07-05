<script lang="ts">
  import { tick } from 'svelte'
  import { cloneSettingsForm, type SettingsFormModel } from '../../lib/settingsForm'

  export let form: SettingsFormModel
  export let saving = false
  export let enginesValid = true

  async function syncForm(): Promise<void> {
    await tick()
    form = cloneSettingsForm(form)
  }

  function addEngine(): void {
    form.search_engine.engines = [
      ...form.search_engine.engines,
      { name: '', icon: '', url_template: 'https://example.com/search?q={q}' },
    ]
    form = cloneSettingsForm(form)
  }

  function removeEngine(index: number): void {
    const removed = form.search_engine.engines[index]
    const next = form.search_engine.engines.filter((_, i) => i !== index)
    form.search_engine.engines = next
    if (removed && removed.name === form.search_engine.current) {
      form.search_engine.current = next[0]?.name ?? ''
    }
    form = cloneSettingsForm(form)
  }
</script>

<fieldset class="group group-wide group-search" disabled={saving} on:input={() => void syncForm()} on:change={() => void syncForm()}>
  <legend>搜索引擎</legend>

  <div class="settings-grid search-controls-grid">
    <label class="field field-select">
      <span>默认引擎</span>
      <select bind:value={form.search_engine.current} disabled={form.search_engine.engines.length === 0}>
        {#if form.search_engine.engines.length === 0}
          <option value="">无可用引擎</option>
        {:else}
          {#each form.search_engine.engines as engine (engine)}
            {#if engine.name.trim()}
              <option value={engine.name}>{engine.name}</option>
            {/if}
          {/each}
        {/if}
      </select>
      <small>首页搜索框默认选中的引擎。</small>
    </label>

    <label class="toggle-field">
      <div class="toggle-copy">
        <span>显示搜索框</span>
        <p>控制首页标题下方的搜索区域是否展示。</p>
      </div>
      <input bind:checked={form.search_box_show} type="checkbox" />
    </label>

    <label class="toggle-field">
      <div class="toggle-copy">
        <span>显示引擎选择器</span>
        <p>关闭后首页搜索框只使用默认搜索引擎。</p>
      </div>
      <input bind:checked={form.search_engine_selector_show} type="checkbox" />
    </label>
  </div>

  <div class="engine-list">
    {#each form.search_engine.engines as engine, index (index)}
      <div class="engine-row">
        <label class="engine-cell">
          <span>名称</span>
          <input bind:value={engine.name} type="text" placeholder="Google" />
        </label>
        <label class="engine-cell">
          <span>图标 URL</span>
          <input bind:value={engine.icon} type="text" placeholder="可留空" />
        </label>
        <label class="engine-cell grow">
          <span>查询模板（含 {'{q}'}）</span>
          <input
            bind:value={engine.url_template}
            type="text"
            placeholder="https://www.google.com/search?q={'{q}'}"
          />
        </label>
        <button
          type="button"
          class="danger-button"
          on:click={() => removeEngine(index)}
          disabled={form.search_engine.engines.length <= 1}
          aria-label="删除引擎"
        >
          删除
        </button>
      </div>
    {/each}
  </div>

  <button type="button" class="ghost-button add-engine" on:click={addEngine}>+ 新增搜索引擎</button>

  {#if !enginesValid}
    <small class="warn">每个引擎都需填写名称，且查询模板必须包含 {'{q}'} 占位符。</small>
  {/if}
</fieldset>

<style>
  .group {
    position: relative;
    grid-column: span 6;
    align-content: start;
    border: 1px solid var(--sp-group-border);
    border-radius: 14px;
    padding: 16px 16px 16px 18px;
    display: grid;
    gap: 14px;
    margin: 0;
    min-width: 0;
    background: var(--sp-group-bg-strong);
    box-shadow:
      0 1px 2px rgba(15, 23, 42, 0.04),
      0 1px 0 rgba(255, 255, 255, 0.72) inset;
  }

  .group::before {
    content: '';
    position: absolute;
    left: 0;
    top: 18px;
    bottom: 18px;
    width: 3px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--sp-accent) 52%, transparent);
  }

  .group-wide {
    grid-column: 1 / -1;
  }

  .group legend {
    padding: 0 7px;
    margin-left: -4px;
    font-size: 13px;
    font-weight: 700;
    color: var(--sp-strong);
  }

  .settings-grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 12px;
    align-items: start;
  }

  .field,
  .toggle-field,
  .engine-cell {
    display: grid;
    gap: 6px;
  }

  .search-controls-grid .field-select,
  .search-controls-grid .toggle-field {
    grid-column: span 4;
  }

  .field span,
  .toggle-copy span,
  .engine-cell span {
    color: var(--sp-label);
    font-size: 14px;
    font-weight: 600;
  }

  small,
  .toggle-copy p {
    color: var(--sp-muted);
    line-height: 1.55;
  }

  small.warn {
    color: var(--sp-warn);
  }

  input:not([type='checkbox']),
  select {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--sp-input-border);
    border-radius: 10px;
    padding: 9px 11px;
    font-size: 14px;
    color: var(--sp-input-text);
    background: var(--sp-input-bg);
    font-family: inherit;
    transition:
      border-color 0.18s ease,
      box-shadow 0.18s ease,
      background 0.18s ease;
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: var(--sp-accent);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  }

  .toggle-field {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    border: 1px solid var(--sp-toggle-border);
    border-radius: 14px;
    padding: 14px;
    background: var(--sp-toggle-bg);
    transition:
      border-color 0.18s ease,
      background 0.18s ease,
      transform 0.18s ease;
  }

  .toggle-field:hover {
    border-color: color-mix(in srgb, var(--sp-accent) 32%, var(--sp-toggle-border));
    background: var(--sp-toggle-hover-bg);
  }

  .toggle-copy {
    display: grid;
    gap: 4px;
  }

  .toggle-field input[type='checkbox'] {
    width: 18px;
    height: 18px;
    margin: 0;
    accent-color: var(--sp-accent);
  }

  .engine-list {
    display: grid;
    gap: 10px;
  }

  .engine-row {
    display: grid;
    grid-template-columns: minmax(130px, 0.7fr) minmax(150px, 0.8fr) minmax(240px, 1.6fr) auto;
    gap: 10px;
    align-items: end;
    border: 1px solid var(--sp-toggle-border);
    border-radius: 12px;
    padding: 10px;
    background: var(--sp-toggle-bg);
  }

  .engine-cell.grow {
    min-width: 0;
  }

  .ghost-button,
  .danger-button {
    border-radius: 10px;
    padding: 10px 16px;
    font-size: 14px;
    cursor: pointer;
    transition:
      border-color 0.18s ease,
      background 0.18s ease,
      color 0.18s ease,
      transform 0.18s ease;
    white-space: nowrap;
  }

  .ghost-button {
    border: 1px solid var(--sp-input-border);
    background: var(--sp-input-bg);
    color: var(--sp-text);
  }

  .danger-button {
    border: 1px solid var(--sp-danger-border);
    background: var(--sp-danger-bg);
    color: var(--sp-danger);
  }

  .ghost-button:hover:not(:disabled) {
    border-color: var(--sp-input-hover-border);
    background: var(--sp-toggle-hover-bg);
  }

  .danger-button:hover:not(:disabled) {
    border-color: var(--sp-danger-hover-border);
    background: var(--sp-danger-hover-bg);
  }

  .ghost-button:disabled,
  .danger-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .add-engine {
    justify-self: start;
  }

  @media (max-width: 960px) {
    .group,
    .search-controls-grid .field-select,
    .search-controls-grid .toggle-field {
      grid-column: 1 / -1;
    }

    .engine-row {
      grid-template-columns: 1fr;
      align-items: stretch;
    }

    .engine-cell.grow,
    .engine-row .danger-button {
      width: 100%;
    }
  }
</style>
