import type { ComponentType } from 'react'

export interface ArticleSeo {
  title: string
  description: string
}

export interface ArticleSeoMeta {
  datePublished: string
  dateModified: string
  keywords: string[]
  articleType: 'Article' | 'TechArticle'
  articleTags: string
  images: string[]
  about: Array<Record<string, string>>
  extra?: Record<string, string>
  citation?: Array<{ '@type': string; name: string; url: string }>
  isBasedOn?: Record<string, unknown>
  mentions?: Array<Record<string, string>>
  discussionUrl?: string
  relatedLink?: string
}

export interface ArticleConfig {
  id: string
  slugs: { pt: string; en: string }
  titles: { pt: string; en: string }
  seo: { pt: ArticleSeo; en: ArticleSeo }
  sectionLabels: { pt: Record<string, string>; en: Record<string, string> }
  type: 'collab' | 'case-study' | 'bridge'
  /** Absolute OG image URL for prerender (social cards: LinkedIn, Twitter) */
  ogImage?: string
  /** Hero image path for JSON-LD / GEO (what AI search engines see). Falls back to ogImage if not set. */
  heroImage?: string
  component: () => Promise<{ default: ComponentType<{ lang: 'pt' | 'en' }> }>
  /** x-default hreflang slug (defaults to ES slug) */
  xDefaultSlug?: string
  /** Whether this article is ready for RAG indexing (default: false) */
  ragReady?: boolean
  /** Path to i18n content file relative to project root (required when ragReady=true) */
  i18nFile?: string
  /** SEO metadata for prerender JSON-LD + article meta tags */
  seoMeta?: ArticleSeoMeta
}

export const articleRegistry: ArticleConfig[] = []

// Derived maps for GlobalNav and routing
export function getAltPaths(): Record<string, string> {
  const map: Record<string, string> = {
    '/': '/pt',
    '/pt': '/',
    '/sobre-mim': '/about',
    '/about': '/sobre-mim',
    '/privacidade': '/privacy',
    '/privacy': '/privacidade',
  }
  for (const article of articleRegistry) {
    map[`/${article.slugs.pt}`] = `/${article.slugs.en}`
    map[`/${article.slugs.en}`] = `/${article.slugs.pt}`
  }
  return map
}

export function getPageTitles(): Record<string, string> {
  const map: Record<string, string> = {
    '/': "Paulo's Portfolio",
    '/pt': 'Portfolio do Paulo',
    '/sobre-mim': 'Sobre Mim',
    '/about': 'About',
  }
  for (const article of articleRegistry) {
    map[`/${article.slugs.pt}`] = article.titles.pt
    map[`/${article.slugs.en}`] = article.titles.en
  }
  return map
}

export function getSectionLabels(): Record<string, Record<string, string>> {
  const map: Record<string, Record<string, string>> = {}
  for (const article of articleRegistry) {
    map[`/${article.slugs.pt}`] = article.sectionLabels.pt
    map[`/${article.slugs.en}`] = article.sectionLabels.en
  }
  return map
}

/** All PT slugs (for lang detection: if pathname matches a PT slug → lang is 'pt') */
export function getPtSlugs(): Set<string> {
  const slugs = new Set<string>(['/pt', '/privacidade', '/sobre-mim'])
  for (const article of articleRegistry) {
    slugs.add(`/${article.slugs.pt}`)
  }
  return slugs
}
