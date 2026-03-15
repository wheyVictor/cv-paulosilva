/**
 * Post-prerender validation for SEO invariants.
 *
 * Runs AFTER prerender to validate the static HTML output in dist/.
 * Checks that article pages have proper JSON-LD, meta tags, alt text,
 * and description lengths in the actual HTML that bots will see.
 *
 * Usage:
 *   npx tsx --tsconfig tsconfig.app.json scripts/validate-prerender.ts
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { articleRegistry } from '../src/articles/registry.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const dist = resolve(root, 'dist')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Severity = 'error' | 'warn'
interface Issue { severity: Severity; msg: string }
interface ArticleResult { id: string; slug: string; issues: Issue[] }

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

function validatePrerenderHtml(id: string, slug: string, lang: 'es' | 'en'): Issue[] {
  const issues: Issue[] = []
  const htmlPath = resolve(dist, slug, 'index.html')

  if (!existsSync(htmlPath)) {
    issues.push({ severity: 'error', msg: `Prerendered HTML not found: dist/${slug}/index.html` })
    return issues
  }

  const html = readFileSync(htmlPath, 'utf-8')

  // 1. JSON-LD: article schema must be present (not just homepage Person/WebSite)
  const jsonLdBlocks = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || []
  const hasArticleSchema = jsonLdBlocks.some(block =>
    block.includes('"TechArticle"') || block.includes('"Article"') || block.includes('"BlogPosting"')
  )
  if (!hasArticleSchema) {
    issues.push({
      severity: 'error',
      msg: `Article JSON-LD missing in prerender (only homepage schema found). Article pages need TechArticle/Article schema for Google.`,
    })
  }

  // 2. Meta description length
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/)
  if (descMatch) {
    const descLen = descMatch[1].length
    if (descLen > 160) {
      issues.push({
        severity: 'warn',
        msg: `Meta description too long: ${descLen} chars (max 160). Google will truncate.`,
      })
    }
    if (descLen < 70) {
      issues.push({
        severity: 'warn',
        msg: `Meta description too short: ${descLen} chars (min ~70 for good CTR).`,
      })
    }
  } else {
    issues.push({ severity: 'error', msg: 'Meta description tag not found in prerender' })
  }

  // 3. Title tag
  const titleMatch = html.match(/<title>([^<]*)<\/title>/)
  if (titleMatch) {
    const titleLen = titleMatch[1].length
    if (titleLen > 65) {
      issues.push({
        severity: 'warn',
        msg: `Title tag long: ${titleLen} chars (ideal ≤60, max ~65).`,
      })
    }
  } else {
    issues.push({ severity: 'error', msg: 'Title tag not found in prerender' })
  }

  // 4. OG article meta tags
  if (!html.includes('article:published_time')) {
    issues.push({ severity: 'warn', msg: 'article:published_time missing in prerender (injected client-side only)' })
  }

  // 5. Canonical tag points to correct URL
  const canonicalMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/)
  if (canonicalMatch) {
    if (!canonicalMatch[1].includes(slug)) {
      issues.push({
        severity: 'error',
        msg: `Canonical URL doesn't match slug: ${canonicalMatch[1]} (expected to contain "${slug}")`,
      })
    }
  } else {
    issues.push({ severity: 'error', msg: 'Canonical tag not found in prerender' })
  }

  // 6. Hreflang tags
  if (!html.includes('hreflang="en"') || !html.includes('hreflang="es"')) {
    issues.push({ severity: 'warn', msg: 'Hreflang tags incomplete (need both en + es)' })
  }

  // 7. OG image
  if (!html.includes('og:image')) {
    issues.push({ severity: 'error', msg: 'og:image meta tag not found in prerender' })
  }

  // 8. Images without alt text
  const imgTags = html.match(/<img\s[^>]*>/g) || []
  const noAlt = imgTags.filter(tag => !tag.includes('alt='))
  if (noAlt.length > 0) {
    issues.push({
      severity: 'warn',
      msg: `${noAlt.length} image(s) without alt text in prerender`,
    })
  }

  // 9. H1 tag present and unique
  const h1s = html.match(/<h1[\s>]/g) || []
  if (h1s.length === 0) {
    issues.push({ severity: 'error', msg: 'No H1 tag found in prerender' })
  } else if (h1s.length > 1) {
    issues.push({ severity: 'warn', msg: `Multiple H1 tags found: ${h1s.length} (should be exactly 1)` })
  }

  return issues
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log('\n[validate-prerender] Post-prerender SEO validation\n')

let totalErrors = 0
let totalWarnings = 0
const results: ArticleResult[] = []

for (const article of articleRegistry) {
  if (article.type === 'bridge') continue // bridge pages have minimal SEO

  for (const [lang, slug] of Object.entries(article.slugs) as ['es' | 'en', string][]) {
    const issues = validatePrerenderHtml(article.id, slug, lang)
    const errors = issues.filter(i => i.severity === 'error').length
    const warnings = issues.filter(i => i.severity === 'warn').length
    totalErrors += errors
    totalWarnings += warnings

    if (issues.length > 0) {
      const icon = errors > 0 ? '\x1b[31m✗\x1b[0m' : '\x1b[33m⚠\x1b[0m'
      console.log(`${icon} ${article.id} [${lang}] — ${errors} errors, ${warnings} warnings`)
      for (const issue of issues) {
        const prefix = issue.severity === 'error' ? '\x1b[31m  ERR\x1b[0m' : '\x1b[33m  WARN\x1b[0m'
        console.log(`${prefix}  ${issue.msg}`)
      }
    } else {
      console.log(`\x1b[32m✓\x1b[0m ${article.id} [${lang}] — clean`)
    }
  }
}

console.log(`\nArticle pages: ${articleRegistry.filter(a => a.type !== 'bridge').length * 2} | Errors: ${totalErrors} | Warnings: ${totalWarnings}\n`)

if (totalErrors > 0) {
  console.error('\x1b[31m✗ Prerender validation failed. Fix errors before deploying.\x1b[0m\n')
  process.exit(1)
}

console.log('\x1b[32m✓ Prerender validation passed.\x1b[0m\n')
