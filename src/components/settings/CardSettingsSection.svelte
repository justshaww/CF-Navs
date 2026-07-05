<script lang="ts">
  import { tick } from 'svelte'
  import { cloneSettingsForm, type SettingsFormModel } from '../../lib/settingsForm'
  import ColorAlphaInput from '../ColorAlphaInput.svelte'

  export let form: SettingsFormModel
  export let saving = false

  async function syncForm(): Promise<void> {
    await tick()
    form = cloneSettingsForm(form)
  }
</script>

<fieldset class="group group-wide group-card" disabled={saving} on:input={() => void syncForm()} on:change={() => void syncForm()}>
  <legend>卡片及图标</legend>

  <div class="settings-subsection">
    <h3>展示密度</h3>
    <div class="settings-grid card-size-grid">
      <label class="field field-number">
        <span>最小宽度 (px)</span>
        <input bind:value={form.card_size.width} type="number" min="80" max="400" step="10" />
        <small>推荐 80。</small>
      </label>
      <label class="field field-number">
        <span>最小高度 (px)</span>
        <input bind:value={form.card_size.height} type="number" min="0" max="300" step="10" />
        <small>推荐 60。</small>
      </label>
      <label class="field field-number">
        <span>图标大小 (px)</span>
        <input bind:value={form.card_icon_size} type="number" min="40" max="100" step="5" />
        <small>推荐 60。</small>
      </label>
    </div>
  </div>

  <div class="settings-subsection">
    <h3>内容区域</h3>
    <div class="settings-grid content-layout-grid">
      <label class="field field-size">
        <span>最大宽度</span>
        <div class="inline-input">
          <input bind:value={form.content_layout.max_width} type="number" min="40" max="2400" step="10" />
          <select bind:value={form.content_layout.max_width_unit} class="unit-select" aria-label="最大宽度单位">
            <option value="px">px</option>
            <option value="%">%</option>
          </select>
        </div>
        <small>首页内容区最大宽度。</small>
      </label>

      <label class="field field-range">
        <span>左右边距 <em>{form.content_layout.margin_x}px</em></span>
        <input bind:value={form.content_layout.margin_x} type="range" min="0" max="100" step="1" />
      </label>

      <label class="field field-range">
        <span>顶部边距 <em>{form.content_layout.margin_top}%</em></span>
        <input bind:value={form.content_layout.margin_top} type="range" min="0" max="50" step="1" />
      </label>

      <label class="field field-range">
        <span>底部边距 <em>{form.content_layout.margin_bottom}%</em></span>
        <input bind:value={form.content_layout.margin_bottom} type="range" min="0" max="50" step="1" />
      </label>
    </div>
  </div>

  <div class="settings-subsection">
    <h3>卡片外观</h3>
    <div class="settings-grid card-appearance-grid">
      <div class="field field-color">
        <span>卡片颜色</span>
        <ColorAlphaInput
          bind:value={form.card_background_color}
          bind:alpha={form.card_background_opacity}
          on:change={() => void syncForm()}
          placeholder="#ffffff"
          inputLabel="卡片颜色值"
          swatchTitle="选择卡片颜色"
          alphaText="卡片透明度"
        />
        <small>书签卡片背景色。</small>
      </div>

      <label class="field field-range">
        <span>卡片透明度 <em>{form.card_background_opacity.toFixed(2)}</em></span>
        <input bind:value={form.card_background_opacity} type="range" min="0" max="1" step="0.05" />
      </label>

      <div class="field field-color">
        <span>卡片文字颜色</span>
        <ColorAlphaInput
          bind:value={form.card_text_color}
          on:change={() => void syncForm()}
          placeholder="留空则跟随主题"
          inputLabel="卡片文字颜色值"
          swatchTitle="选择卡片文字颜色"
          alphaText="文字透明度"
        />
        <small>留空时自动跟随当前主题。</small>
      </div>
    </div>
  </div>

  <div class="settings-subsection">
    <h3>卡片风格</h3>
    <div class="radio-group">
      <label class="radio-option">
        <input type="radio" bind:group={form.card_style} value="info" />
        <div class="radio-content">
          <strong>详情风格</strong>
          <p>显示图标、标题和描述，适合信息丰富的书签</p>
        </div>
      </label>

      <label class="radio-option">
        <input type="radio" bind:group={form.card_style} value="icon" />
        <div class="radio-content">
          <strong>极简风格</strong>
          <p>仅显示图标和标题，紧凑布局节省空间</p>
        </div>
      </label>
    </div>

    {#if form.card_style === 'info'}
      <label class="checkbox-field style-option">
        <input type="checkbox" bind:checked={form.card_show_description} />
        <span>显示书签描述</span>
      </label>
    {/if}

    {#if form.card_style === 'icon'}
      <label class="checkbox-field style-option">
        <input type="checkbox" bind:checked={form.card_icon_show_title} />
        <span>显示书签标题</span>
      </label>
    {/if}
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

  .settings-subsection {
    display: grid;
    gap: 10px;
    min-width: 0;
  }

  .settings-subsection + .settings-subsection {
    border-top: 1px solid var(--sp-subsection-border);
    padding-top: 14px;
  }

  .settings-subsection h3 {
    position: relative;
    margin: 0;
    padding-left: 10px;
    color: var(--sp-strong);
    font-size: 13px;
    font-weight: 700;
    line-height: 1.3;
  }

  .settings-subsection h3::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.18em;
    bottom: 0.18em;
    width: 3px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--sp-accent) 48%, transparent);
  }

  .field {
    display: grid;
    gap: 6px;
  }

  .field-number,
  .card-size-grid .field-number {
    grid-column: span 4;
  }

  .field-size,
  .content-layout-grid .field-size,
  .content-layout-grid .field-range {
    grid-column: span 3;
  }

  .field-color,
  .card-appearance-grid .field-color,
  .card-appearance-grid .field-range {
    grid-column: span 4;
  }

  .field span,
  .checkbox-field span {
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
  .radio-content p {
    color: var(--sp-muted);
    line-height: 1.55;
  }

  input:not([type='radio']):not([type='checkbox']),
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

  .inline-input {
    display: flex;
    gap: 8px;
    align-items: center;
    min-width: 0;
  }

  .inline-input input {
    flex: 1 1 0;
    min-width: 0;
  }

  .unit-select {
    flex: 0 0 84px;
  }

  .radio-group {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 12px;
  }

  .radio-option {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 16px;
    border: 1px solid var(--sp-radio-border);
    border-radius: 12px;
    background: var(--sp-toggle-bg);
    cursor: pointer;
    transition: all 0.18s ease;
  }

  .radio-option:hover {
    border-color: var(--sp-accent);
    background: var(--sp-toggle-hover-bg);
  }

  .radio-option input[type='radio'] {
    margin-top: 3px;
    width: 18px;
    height: 18px;
    accent-color: var(--sp-accent);
  }

  .radio-content {
    display: grid;
    gap: 4px;
  }

  .radio-content strong {
    color: var(--sp-strong);
    font-size: 14px;
  }

  .radio-content p {
    margin: 0;
    font-size: 13px;
  }

  .checkbox-field {
    display: flex;
    gap: 10px;
    align-items: center;
    color: var(--sp-label);
    font-size: 14px;
  }

  .checkbox-field input[type='checkbox'] {
    accent-color: var(--sp-accent);
  }

  @media (max-width: 960px) {
    .group,
    .field-number,
    .field-size,
    .field-color,
    .card-size-grid .field-number,
    .content-layout-grid .field-size,
    .content-layout-grid .field-range,
    .card-appearance-grid .field-color,
    .card-appearance-grid .field-range {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 720px) {
    .inline-input {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
