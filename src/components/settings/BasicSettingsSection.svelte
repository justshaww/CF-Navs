<script lang="ts">
  import { tick } from 'svelte'
  import { cloneSettingsForm, themeOptions, type SettingsFormModel } from '../../lib/settingsForm'
  import ColorAlphaInput from '../ColorAlphaInput.svelte'

  export let form: SettingsFormModel
  export let saving = false

  $: currentThemeHint = themeOptions.find((option) => option.value === form.theme)?.hint ?? ''

  async function syncForm(): Promise<void> {
    await tick()
    form = cloneSettingsForm(form)
  }
</script>

<fieldset class="group group-wide group-base" disabled={saving}>
  <legend>基础</legend>
  <div class="form-grid base-grid">
    <label class="field field-title">
      <span>站点标题</span>
      <input
        bind:value={form.site_title}
        type="text"
        placeholder="例如：CF-Navs 导航站"
        maxlength="80"
        required
        on:input={() => void syncForm()}
      />
      <small>将显示在页面标题与管理界面中。</small>
    </label>

    <div class="field field-color">
      <span>标题颜色</span>
      <ColorAlphaInput
        bind:value={form.site_title_color}
        on:change={() => void syncForm()}
        placeholder="留空则跟随主题"
        inputLabel="标题颜色值"
        swatchTitle="选择标题颜色"
        alphaText="标题透明度"
      />
      <small>首页搜索栏上方标题的文字颜色；留空时自动跟随当前主题。</small>
    </div>

    <label class="field field-range">
      <span>标题文字大小 <em>{form.site_title_font_size}px</em></span>
      <input
        bind:value={form.site_title_font_size}
        type="range"
        min="16"
        max="72"
        step="1"
        on:input={() => void syncForm()}
      />
      <small>控制首页标题字号，建议 28-44px。</small>
    </label>

    <label class="field field-select">
      <span>主题模式</span>
      <select bind:value={form.theme} on:change={() => void syncForm()}>
        {#each themeOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
      <small>{currentThemeHint}</small>
    </label>

    <label class="field field-url">
      <span>图床地址</span>
      <input
        bind:value={form.image_host_url}
        type="url"
        placeholder="https://img.example.com"
        on:input={() => void syncForm()}
      />
      <small>可留空。用于背景/图标的“打开图床上传”跳转。</small>
    </label>

    <div class="toggle-field field-toggle">
      <label class="toggle-copy" for="settings-public-mode">
        <span>公开模式</span>
        <p>开启后，未登录用户也可以访问首页内容。</p>
      </label>
      <input
        id="settings-public-mode"
        bind:checked={form.public_mode}
        on:change={() => void syncForm()}
        type="checkbox"
      />
    </div>
  </div>
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
    background: var(--sp-group-bg);
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

  .form-grid,
  .base-grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 12px;
    align-items: start;
  }

  .field,
  .toggle-field {
    display: grid;
    gap: 6px;
  }

  .field-title,
  .field-url {
    grid-column: span 5;
  }

  .field-color,
  .field-toggle {
    grid-column: span 4;
  }

  .field-range,
  .field-select {
    grid-column: span 3;
  }

  .field span,
  .toggle-copy span {
    color: var(--sp-label);
    font-size: 14px;
    font-weight: 600;
  }

  .field span em {
    font-style: normal;
    color: var(--sp-accent);
    font-weight: 600;
  }

  small,
  .toggle-copy p {
    color: var(--sp-muted);
    line-height: 1.55;
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

  input[type='range'] {
    padding: 0;
    accent-color: var(--sp-accent);
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
    cursor: pointer;
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
    cursor: pointer;
  }

  @media (max-width: 960px) {
    .group {
      grid-column: 1 / -1;
    }

    .field-title,
    .field-url,
    .field-color,
    .field-range,
    .field-select,
    .field-toggle {
      grid-column: 1 / -1;
    }
  }
</style>
