<script lang="ts">
  import { tick } from 'svelte'
  import { cloneSettingsForm, type SettingsFormModel } from '../../lib/settingsForm'

  export let form: SettingsFormModel
  export let saving = false

  async function syncForm(): Promise<void> {
    await tick()
    form = cloneSettingsForm(form)
  }
</script>

<fieldset class="group group-wide" disabled={saving} on:input={() => void syncForm()}>
  <legend>自定义页脚</legend>
  <label class="field full-width">
    <span>页脚 HTML</span>
    <textarea
      bind:value={form.footer_html}
      rows="4"
      placeholder='<div style="text-align:center;color:#cbd5e1">Powered by CF-Navs</div>'
    ></textarea>
    <small>显示在首页底部。请仅填写可信 HTML。</small>
    <small>页面安全策略会阻止脚本和内联事件处理器执行。</small>
  </label>
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

  .field {
    display: grid;
    gap: 6px;
  }

  .field.full-width {
    grid-column: 1 / -1;
  }

  .field span {
    color: var(--sp-label);
    font-size: 14px;
    font-weight: 600;
  }

  small {
    color: var(--sp-muted);
    line-height: 1.55;
  }

  textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--sp-input-border);
    border-radius: 10px;
    padding: 9px 11px;
    font-size: 14px;
    color: var(--sp-input-text);
    background: var(--sp-input-bg);
    font-family: inherit;
    resize: vertical;
    min-height: 96px;
    line-height: 1.5;
    transition:
      border-color 0.18s ease,
      box-shadow 0.18s ease,
      background 0.18s ease;
  }

  textarea:focus {
    outline: none;
    border-color: var(--sp-accent);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  }

  textarea:disabled,
  fieldset:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  fieldset:disabled {
    opacity: 1;
  }

  @media (max-width: 960px) {
    .group {
      grid-column: 1 / -1;
    }
  }
</style>
