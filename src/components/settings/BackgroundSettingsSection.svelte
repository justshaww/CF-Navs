<script lang="ts">
  import type { BackgroundSetting } from '../../../shared/types'
  import {
    cloneBackgroundSetting,
    cloneSettingsForm,
    getActiveGradientPresetId,
    normalizeSettingsForm,
    type SettingsFormModel,
  } from '../../lib/settingsForm'
  import type { ThemeGradientPreset } from '../../lib/themePresets'
  import GradientPresetSelector from './GradientPresetSelector.svelte'
  import ThemeBackgroundCard from './ThemeBackgroundCard.svelte'

  export let form: SettingsFormModel
  export let saving = false

  $: normalizedForm = normalizeSettingsForm(form)
  $: lightBackgroundValid = normalizedForm.backgrounds.light.value.length > 0
  $: darkBackgroundValid = normalizedForm.backgrounds.dark.value.length > 0
  $: activeGradientPresetId = getActiveGradientPresetId(form)
  $: uploadHost = form.image_host_url.trim()

  function markCustomGradientPreset(): void {
    const next = cloneSettingsForm(form)
    next.background_preset_id = 'custom'
    form = next
  }

  function applyGradientPreset(preset: ThemeGradientPreset): void {
    const next = cloneSettingsForm(form)
    next.background_preset_id = preset.id
    next.backgrounds = {
      light: cloneBackgroundSetting(preset.light),
      dark: cloneBackgroundSetting(preset.dark),
    }
    next.background = cloneBackgroundSetting(next.theme === 'dark' ? preset.dark : preset.light)
    next.card_background_color = preset.cardBackgroundColor
    next.card_background_opacity = preset.cardBackgroundOpacity
    next.card_text_color = preset.cardTextColor
    next.site_title_color = preset.siteTitleColor
    form = next
  }

  function applyThemeBackground(theme: 'light' | 'dark', background: BackgroundSetting): void {
    const next = cloneSettingsForm(form)
    next.background_preset_id = 'custom'
    next.backgrounds[theme] = cloneBackgroundSetting(background)
    next.background = cloneBackgroundSetting(next.theme === 'dark' ? next.backgrounds.dark : next.backgrounds.light)
    form = next
  }

  function openUpload(): void {
    if (!uploadHost) return
    const base = uploadHost.endsWith('/') ? uploadHost.slice(0, -1) : uploadHost
    window.open(`${base}/upload`, '_blank', 'noopener,noreferrer')
  }
</script>

<fieldset class="group group-wide group-background" disabled={saving}>
  <legend>背景</legend>

  <GradientPresetSelector
    {activeGradientPresetId}
    on:custom={() => markCustomGradientPreset()}
    on:select={(event) => applyGradientPreset(event.detail)}
  />

  <div class="theme-background-grid">
    <ThemeBackgroundCard
      theme="light"
      background={form.backgrounds.light}
      valid={lightBackgroundValid}
      {uploadHost}
      on:change={(event) => applyThemeBackground('light', event.detail)}
      on:upload={openUpload}
    />

    <ThemeBackgroundCard
      theme="dark"
      background={form.backgrounds.dark}
      valid={darkBackgroundValid}
      {uploadHost}
      on:change={(event) => applyThemeBackground('dark', event.detail)}
      on:upload={openUpload}
    />
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

  .theme-background-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 12px;
  }

  fieldset:disabled {
    opacity: 1;
  }

  @media (max-width: 960px) {
    .group {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 720px) {
    .theme-background-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
