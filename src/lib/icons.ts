// 图标获取方式辅助函数
// 为指定书签（url + title）生成四种方式的候选图标 URL

import type { IconSource } from '../../shared/types'

export type IconCandidate = {
  source: IconSource
  label: string
  url: string
}

/**
 * 从 URL 中提取纯域名（不含协议 / 路径 / www）
 */
export function getHostname(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

// ========== 四种方式 ==========

/**
 * 方式1: 直接 favicon（由服务端 fetch-favicon 解析，返回完整 URL）
 */
export function directIcon(url: string): string {
  return `/api/fetch-favicon?url=${encodeURIComponent(url)}`
}

/**
 * 方式2: favicon.im
 * 文档: https://favicon.im/  无需 API key，直接热链
 */
export function faviconImIcon(url: string): string {
  const hostname = getHostname(url)
  return hostname ? `https://favicon.im/${hostname}?larger=true` : ''
}

/**
 * 方式3: 仿 logo.surf 文字图标
 * logo.surf 是一个纯浏览器端 SVG 生成工具，无公开 URL API，
 * 这里在本地生成一个带首字母的 SVG data URI，效果类似
 */
export function logoSurfIcon(title: string, url: string): string {
  const letter = title.trim().charAt(0).toUpperCase() || 'N'
  const hostname = getHostname(url) || '?'

  // 生成一个类似 logo.surf 风格的单字母圆角图标 SVG
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#2563eb"/>
  <text x="32" y="41" text-anchor="middle" fill="#ffffff" font-size="32" font-weight="bold" font-family="Arial,Helvetica,sans-serif">${letter}</text>
</svg>`

  const encoded = encodeURIComponent(svg)
    .replace(/%20/g, ' ')
    .replace(/%3C/g, '<')
    .replace(/%3E/g, '>')
    .replace(/%22/g, "'")
    .replace(/%2F/g, '/')
    .replace(/%3A/g, ':')
  return `data:image/svg+xml;charset=utf-8,${encoded}`
}

/**
 * 方式4: Google s2 favicons
 * 格式: https://www.google.com/s2/favicons?sz={size}&domain={domain}
 */
export function googleIcon(url: string, size = 64): string {
  const hostname = getHostname(url)
  return hostname ? `https://www.google.com/s2/favicons?sz=${size}&domain=${encodeURIComponent(hostname)}` : ''
}

// ========== 聚合 ==========

/**
 * 为给定的书签 URL + title 生成四种图标候选项
 */
export function getIconCandidates(url: string, title: string): IconCandidate[] {
  const hostname = getHostname(url)
  if (!hostname) return []

  return [
    {
      source: 'direct',
      label: '自动获取',
      url: directIcon(url),
    },
    {
      source: 'favicon_im',
      label: 'Favicon.im',
      url: faviconImIcon(url),
    },
    {
      source: 'logo_surf',
      label: '文字图标',
      url: logoSurfIcon(title, url),
    },
    {
      source: 'google',
      label: 'Google',
      url: googleIcon(url),
    },
  ]
}