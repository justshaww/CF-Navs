import type { BackgroundPresetId, BackgroundSetting } from '../../shared/types'

export type GradientPresetId = Exclude<BackgroundPresetId, 'custom'>

export type ThemeGradientPreset = {
  id: GradientPresetId
  label: string
  description: string
  light: BackgroundSetting
  dark: BackgroundSetting
  cardBackgroundColor: string
  cardBackgroundOpacity: number
  cardTextColor: string
  siteTitleColor: string
}

const clearTealLightGradient = [
  'radial-gradient(circle at 18% 12%, rgba(125, 211, 252, 0.42), transparent 32%)',
  'radial-gradient(circle at 82% 22%, rgba(45, 212, 191, 0.34), transparent 34%)',
  'radial-gradient(circle at 50% 92%, rgba(248, 250, 252, 0.9), transparent 42%)',
  'linear-gradient(135deg, #f8fbff 0%, #eef7f5 46%, #f6f7fb 100%)',
].join(', ')

const clearTealDarkGradient = [
  'radial-gradient(circle at 16% 14%, rgba(34, 211, 238, 0.22), transparent 34%)',
  'radial-gradient(circle at 84% 26%, rgba(20, 184, 166, 0.18), transparent 36%)',
  'radial-gradient(circle at 52% 92%, rgba(59, 130, 246, 0.12), transparent 42%)',
  'linear-gradient(135deg, #07111f 0%, #0d1b24 48%, #111827 100%)',
].join(', ')

const mistSlateLightGradient = [
  'radial-gradient(circle at 20% 16%, rgba(134, 239, 172, 0.28), transparent 30%)',
  'radial-gradient(circle at 76% 18%, rgba(147, 197, 253, 0.34), transparent 34%)',
  'radial-gradient(circle at 62% 86%, rgba(226, 232, 240, 0.78), transparent 40%)',
  'linear-gradient(145deg, #f7faf8 0%, #edf4f7 42%, #f4f1ec 100%)',
].join(', ')

const mistSlateDarkGradient = [
  'radial-gradient(circle at 18% 12%, rgba(34, 197, 94, 0.16), transparent 32%)',
  'radial-gradient(circle at 78% 18%, rgba(56, 189, 248, 0.18), transparent 34%)',
  'radial-gradient(circle at 58% 88%, rgba(180, 83, 9, 0.1), transparent 42%)',
  'linear-gradient(145deg, #08120f 0%, #10202a 46%, #171717 100%)',
].join(', ')

const coralSkyLightGradient = [
  'radial-gradient(circle at 14% 14%, rgba(251, 113, 133, 0.26), transparent 30%)',
  'radial-gradient(circle at 84% 18%, rgba(56, 189, 248, 0.24), transparent 34%)',
  'radial-gradient(circle at 50% 92%, rgba(204, 251, 241, 0.62), transparent 42%)',
  'linear-gradient(140deg, #fff7fb 0%, #f7fbff 48%, #f4fff8 100%)',
].join(', ')

const coralSkyDarkGradient = [
  'radial-gradient(circle at 16% 16%, rgba(251, 113, 133, 0.17), transparent 32%)',
  'radial-gradient(circle at 82% 22%, rgba(34, 211, 238, 0.16), transparent 34%)',
  'radial-gradient(circle at 48% 90%, rgba(16, 185, 129, 0.1), transparent 42%)',
  'linear-gradient(140deg, #140d14 0%, #111827 52%, #08131f 100%)',
].join(', ')

const sageGraphiteLightGradient = [
  'radial-gradient(circle at 18% 16%, rgba(132, 204, 22, 0.22), transparent 31%)',
  'radial-gradient(circle at 78% 20%, rgba(20, 184, 166, 0.2), transparent 34%)',
  'radial-gradient(circle at 60% 88%, rgba(226, 232, 240, 0.7), transparent 42%)',
  'linear-gradient(145deg, #f7fbf6 0%, #eef6f1 46%, #f6f8fb 100%)',
].join(', ')

const sageGraphiteDarkGradient = [
  'radial-gradient(circle at 18% 16%, rgba(132, 204, 22, 0.14), transparent 32%)',
  'radial-gradient(circle at 78% 22%, rgba(45, 212, 191, 0.13), transparent 36%)',
  'radial-gradient(circle at 58% 88%, rgba(148, 163, 184, 0.1), transparent 42%)',
  'linear-gradient(145deg, #0a120d 0%, #121a18 46%, #151821 100%)',
].join(', ')

const lumenAmberLightGradient = [
  'radial-gradient(circle at 18% 16%, rgba(251, 191, 36, 0.26), transparent 30%)',
  'radial-gradient(circle at 82% 18%, rgba(125, 211, 252, 0.23), transparent 34%)',
  'radial-gradient(circle at 54% 88%, rgba(244, 114, 182, 0.1), transparent 40%)',
  'linear-gradient(145deg, #fffdf7 0%, #f7fbff 48%, #f8fbf4 100%)',
].join(', ')

const lumenAmberDarkGradient = [
  'radial-gradient(circle at 18% 16%, rgba(245, 158, 11, 0.16), transparent 32%)',
  'radial-gradient(circle at 82% 20%, rgba(14, 165, 233, 0.14), transparent 35%)',
  'radial-gradient(circle at 58% 88%, rgba(244, 63, 94, 0.1), transparent 42%)',
  'linear-gradient(145deg, #12110a 0%, #17202a 48%, #171717 100%)',
].join(', ')

const emberNightLightGradient = [
  'radial-gradient(circle at 16% 14%, rgba(248, 113, 113, 0.18), transparent 30%)',
  'radial-gradient(circle at 82% 20%, rgba(45, 212, 191, 0.2), transparent 34%)',
  'radial-gradient(circle at 58% 88%, rgba(203, 213, 225, 0.72), transparent 42%)',
  'linear-gradient(145deg, #fbfbfd 0%, #f3f7f7 48%, #fff8f5 100%)',
].join(', ')

const emberNightDarkGradient = [
  'radial-gradient(circle at 16% 14%, rgba(248, 113, 113, 0.18), transparent 32%)',
  'radial-gradient(circle at 82% 22%, rgba(45, 212, 191, 0.16), transparent 34%)',
  'radial-gradient(circle at 54% 90%, rgba(251, 191, 36, 0.08), transparent 42%)',
  'linear-gradient(145deg, #140b0d 0%, #141a1f 48%, #081214 100%)',
].join(', ')

export const gradientPresets: ThemeGradientPreset[] = [
  {
    id: 'clear-teal',
    label: '清透蓝绿',
    description: '清爽的蓝绿冷调，适合玻璃卡片和高对比文字。',
    light: { type: 'gradient', value: clearTealLightGradient, blur: 0, mask: 0.12, maskColor: '#ffffff' },
    dark: { type: 'gradient', value: clearTealDarkGradient, blur: 0, mask: 0.28, maskColor: '#000000' },
    cardBackgroundColor: '#ffffff',
    cardBackgroundOpacity: 0.4,
    cardTextColor: '',
    siteTitleColor: '',
  },
  {
    id: 'mist-slate',
    label: '晨雾石青',
    description: '更柔和的石青和浅绿组合，页面氛围安静，卡片边界清晰。',
    light: { type: 'gradient', value: mistSlateLightGradient, blur: 0, mask: 0.14, maskColor: '#ffffff' },
    dark: { type: 'gradient', value: mistSlateDarkGradient, blur: 0, mask: 0.3, maskColor: '#000000' },
    cardBackgroundColor: '#ffffff',
    cardBackgroundOpacity: 0.4,
    cardTextColor: '',
    siteTitleColor: '',
  },
  {
    id: 'coral-sky',
    label: '珊瑚晴空',
    description: '珊瑚、天空蓝和薄荷绿的轻快组合，适合亮色首页。',
    light: { type: 'gradient', value: coralSkyLightGradient, blur: 0, mask: 0.12, maskColor: '#ffffff' },
    dark: { type: 'gradient', value: coralSkyDarkGradient, blur: 0, mask: 0.28, maskColor: '#000000' },
    cardBackgroundColor: '#ffffff',
    cardBackgroundOpacity: 0.44,
    cardTextColor: '',
    siteTitleColor: '',
  },
  {
    id: 'sage-graphite',
    label: '鼠尾草石墨',
    description: '低饱和绿与石墨灰，安静耐看，适合长期使用。',
    light: { type: 'gradient', value: sageGraphiteLightGradient, blur: 0, mask: 0.13, maskColor: '#ffffff' },
    dark: { type: 'gradient', value: sageGraphiteDarkGradient, blur: 0, mask: 0.3, maskColor: '#000000' },
    cardBackgroundColor: '#ffffff',
    cardBackgroundOpacity: 0.42,
    cardTextColor: '',
    siteTitleColor: '',
  },
  {
    id: 'lumen-amber',
    label: '琥珀晨光',
    description: '少量琥珀暖光配冷色高光，明亮但不刺眼。',
    light: { type: 'gradient', value: lumenAmberLightGradient, blur: 0, mask: 0.13, maskColor: '#ffffff' },
    dark: { type: 'gradient', value: lumenAmberDarkGradient, blur: 0, mask: 0.3, maskColor: '#000000' },
    cardBackgroundColor: '#ffffff',
    cardBackgroundOpacity: 0.46,
    cardTextColor: '',
    siteTitleColor: '',
  },
  {
    id: 'ember-night',
    label: '余烬夜航',
    description: '深色模式更有层次，亮色模式保持干净清透。',
    light: { type: 'gradient', value: emberNightLightGradient, blur: 0, mask: 0.14, maskColor: '#ffffff' },
    dark: { type: 'gradient', value: emberNightDarkGradient, blur: 0, mask: 0.28, maskColor: '#000000' },
    cardBackgroundColor: '#ffffff',
    cardBackgroundOpacity: 0.44,
    cardTextColor: '',
    siteTitleColor: '',
  },
]
