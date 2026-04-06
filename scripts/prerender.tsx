/**
 * Post-build script: SSR prerender using React's renderToString.
 *
 * Renders the actual App component to HTML so the pre-rendered content
 * matches exactly what React produces. This enables hydrateRoot() on the
 * client to adopt the existing DOM without replacing it (zero CLS).
 *
 * Articles are loaded from the article registry. Only articles whose
 * component files exist will be prerendered (new case studies added to the
 * registry but not yet created will be skipped gracefully).
 *
 * Usage: npx tsx scripts/prerender.tsx  (runs automatically via "npm run build")
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import React, { Suspense, type ComponentType } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter, Routes, Route } from 'react-router-dom';
import Critters from 'critters';
import App from '../src/App.tsx';
import GlobalNav from '../src/GlobalNav.tsx';
import { articleRegistry, type ArticleConfig } from '../src/articles/registry.ts';
import { buildArticleJsonLd } from '../src/articles/json-ld.ts';
import AboutPage from '../src/AboutPage.tsx';
import { aboutContent } from '../src/about-i18n.ts';
import { seo } from '../src/i18n.ts';

// Map article id → i18n content for JSON-LD generation
const i18nMap: Record<string, Record<string, { header: { h1: string }; nav: { breadcrumbHome: string; breadcrumbCurrent: string }; faq: { items: readonly { q: string; a: string }[] } }>> = {
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

/** Strip React 19 SSR-injected <link> tags from inside #root to prevent hydration mismatch */
function stripReactSSRTags(html: string): string {
  return html.replace(/<link[^>]*>/g, '');
}

// ---------------------------------------------------------------------------
// SSR render per language (home page)
// ---------------------------------------------------------------------------
function renderApp(lang: 'pt' | 'en'): string {
  const path = lang === 'en' ? '/en' : '/';
  return stripReactSSRTags(renderToString(
    <StaticRouter location={path}>
      <div>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/en" element={<App />} />
          </Routes>
        </Suspense>
      </div>
    </StaticRouter>
  ));
}

function renderArticlePage(slug: string, ArticleComponent: ComponentType<{ lang: 'pt' | 'en' }>, lang: 'pt' | 'en'): string {
  return stripReactSSRTags(renderToString(
    <StaticRouter location={`/${slug}`}>
      <GlobalNav />
      <div>
        <Suspense fallback={null}>
          <Routes>
            <Route path={`/${slug}`} element={<ArticleComponent lang={lang} />} />
          </Routes>
        </Suspense>
      </div>
    </StaticRouter>
  ));
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Inject into built HTML
// ---------------------------------------------------------------------------
const distDir = resolve(root, 'dist');
const indexPath = resolve(distDir, 'index.html');

let indexHtml: string;
try {
  indexHtml = readFileSync(indexPath, 'utf-8');
} catch {
  console.error('Error: dist/index.html not found. Run "vite build" first.');
  process.exit(1);
}

// --- PT-BR version (inject into existing index.html) ---
let ptHtml: string;
try {
  ptHtml = renderApp('pt');
} catch (err) {
  console.error('[prerender] SSR failed for PT, falling back to empty root:', err);
  ptHtml = '';
}

const ptSeo = seo.pt;

const injectedPt = indexHtml
  .replace('<div id="root"></div>', `<div id="root">${ptHtml}</div>`)
  .replace(/<title>[^<]*<\/title>/, `<title>${esc(ptSeo.title)}</title>`)
  .replace(/<meta name="title" content="[^"]*" \/>/, `<meta name="title" content="${esc(ptSeo.title)}" />`)
  .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(ptSeo.description)}" />`)
  .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(ptSeo.title)}" />`)
  .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(ptSeo.description)}" />`)
  .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${esc(ptSeo.title)}" />`)
  .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${esc(ptSeo.description)}" />`);

// --- EN version ---
let enHtml: string;
try {
  enHtml = renderApp('en');
} catch (err) {
  console.error('[prerender] SSR failed for EN, falling back to empty root:', err);
  enHtml = '';
}

const enSeo = seo.en;

let enPage = indexHtml
  .replace('<div id="root"></div>', `<div id="root">${enHtml}</div>`)
  .replace('<html lang="pt-BR" class="theme-warm dark">', '<html lang="en" class="theme-warm dark">')
  .replace(/<title>[^<]*<\/title>/, `<title>${esc(enSeo.title)}</title>`)
  .replace(/<meta name="title" content="[^"]*" \/>/, `<meta name="title" content="${esc(enSeo.title)}" />`)
  .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(enSeo.description)}" />`)
  .replace(/<link rel="canonical" href="[^"]*" \/>/, '<link rel="canonical" href="https://psilva.io/en" />')
  .replace(/<meta property="og:url" content="[^"]*" \/>/, '<meta property="og:url" content="https://psilva.io/en" />')
  .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(enSeo.title)}" />`)
  .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(enSeo.description)}" />`)
  .replace(/<meta property="og:locale" content="pt_BR" \/>/, '<meta property="og:locale" content="en_US" />')
  .replace(/<meta property="og:locale:alternate" content="en_US" \/>/, '<meta property="og:locale:alternate" content="pt_BR" />')
  .replace(/<meta name="twitter:url" content="[^"]*" \/>/, '<meta name="twitter:url" content="https://psilva.io/en" />')
  .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${esc(enSeo.title)}" />`)
  .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${esc(enSeo.description)}" />`);

// ---------------------------------------------------------------------------
// About / Entity Home — ES (/sobre-mim) + EN (/about)
// ---------------------------------------------------------------------------

const aboutJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ProfilePage',
  dateModified: '2026-03-27',
  mainEntity: {
    '@type': 'Person',
    '@id': 'https://psilva.io/#person',
    name: 'Paulo Victor Silva',
    alternateName: ['Paulo Silva', 'Victor'],
    url: 'https://psilva.io',
    image: 'https://psilva.io/foto-avatar.png',
    email: 'hello@psilva.io',
    jobTitle: ['Senior Tech Lead - Data Engineering', 'Data Architect', 'Snowflake & dbt Expert'],
    knowsAbout: [
      { '@type': 'Thing', name: 'Data Engineering', url: 'https://en.wikipedia.org/wiki/Data_engineering' },
      { '@type': 'Thing', name: 'Data Warehouse', url: 'https://en.wikipedia.org/wiki/Data_warehouse' },
      { '@type': 'Thing', name: 'ETL', url: 'https://en.wikipedia.org/wiki/Extract,_transform,_load' },
      { '@type': 'Thing', name: 'Cloud Computing', url: 'https://en.wikipedia.org/wiki/Cloud_computing' },
      { '@type': 'SoftwareApplication', name: 'Snowflake', url: 'https://www.snowflake.com' },
      { '@type': 'SoftwareApplication', name: 'dbt', url: 'https://www.getdbt.com' },
      { '@type': 'SoftwareApplication', name: 'Apache Airflow', url: 'https://airflow.apache.org' },
    ],
    hasCredential: [
      { '@type': 'EducationalOccupationalCredential', name: 'SnowPro Core Certification', recognizedBy: { '@type': 'Organization', name: 'Snowflake' } },
      { '@type': 'EducationalOccupationalCredential', name: 'Introduction to Big Data', recognizedBy: { '@type': 'Organization', name: 'Coursera / UC San Diego' } },
      { '@type': 'EducationalOccupationalCredential', name: 'Big Data Modeling and Management Systems', recognizedBy: { '@type': 'Organization', name: 'Coursera / UC San Diego' } },
    ],
    alumniOf: [
      { '@type': 'EducationalOrganization', name: 'UFSCar - MBA in Information, Technology and Innovation' },
      { '@type': 'EducationalOrganization', name: 'UNIESP - Bachelor of Information Systems' },
    ],
    sameAs: [
      'https://www.linkedin.com/in/paulovi',
    ],
    address: { '@type': 'PostalAddress', addressLocality: 'Rio de Janeiro', addressRegion: 'RJ', addressCountry: 'BR' },
  },
};

const aboutJsonLdScript = `<script type="application/ld+json">\n${JSON.stringify(aboutJsonLd, null, 2)}\n</script>`;

interface AboutPageData {
  slug: string;
  html: string;
}

const aboutPages: AboutPageData[] = [];

for (const lang of ['pt', 'en'] as const) {
  const t = aboutContent[lang];
  const slug = t.slug;
  const altSlug = t.altSlug;
  const url = `https://psilva.io/${slug}`;
  const altUrl = `https://psilva.io/${altSlug}`;
  const altLang = lang === 'pt' ? 'en' : 'pt';
  const ogLocale = lang === 'pt' ? 'pt_BR' : 'en_US';
  const ogLocaleAlt = lang === 'pt' ? 'en_US' : 'pt_BR';

  let renderedHtml: string;
  try {
    renderedHtml = stripReactSSRTags(renderToString(
      <StaticRouter location={`/${slug}`}>
        <GlobalNav />
        <div>
          <Suspense fallback={null}>
            <Routes>
              <Route path={`/${slug}`} element={<AboutPage lang={lang} />} />
            </Routes>
          </Suspense>
        </div>
      </StaticRouter>
    ));
  } catch (err) {
    console.error(`[prerender] SSR failed for ${slug}, falling back to empty root:`, err);
    renderedHtml = '';
  }

  const hreflangLinks = `<link rel="alternate" hreflang="${lang}" href="${url}" /><link rel="alternate" hreflang="${altLang}" href="${altUrl}" /><link rel="alternate" hreflang="x-default" href="https://psilva.io/sobre-mim" />`;

  let result = indexHtml
    .replace('<div id="root"></div>', `<div id="root">${renderedHtml}</div>`)
    .replace('<html lang="pt-BR" class="theme-warm dark">', `<html lang="${lang === 'pt' ? 'pt-BR' : lang}" class="theme-warm dark">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(t.seo.title)}</title>`)
    .replace(/<meta name="title" content="[^"]*" \/>/, `<meta name="title" content="${esc(t.seo.title)}" />`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(t.seo.description)}" />`)
    .replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>\s*/g, '')
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />${hreflangLinks}`)
    .replace(/<meta property="og:type" content="[^"]*" \/>/, '<meta property="og:type" content="profile" />')
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(t.seo.title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(t.seo.description)}" />`)
    .replace(/<meta property="og:locale" content="pt_BR" \/>/, `<meta property="og:locale" content="${ogLocale}" />`)
    .replace(/<meta property="og:locale:alternate" content="en_US" \/>/, `<meta property="og:locale:alternate" content="${ogLocaleAlt}" />`)
    .replace(/<meta name="twitter:url" content="[^"]*" \/>/, `<meta name="twitter:url" content="${url}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${esc(t.seo.title)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${esc(t.seo.description)}" />`);

  // Replace homepage JSON-LD with ProfilePage JSON-LD
  result = result.replace(
    /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    aboutJsonLdScript,
  );

  aboutPages.push({ slug, html: result });
}

// ---------------------------------------------------------------------------
// Article pages — build from registry
// ---------------------------------------------------------------------------
interface ArticlePage {
  slug: string;
  html: string;
}

function buildArticlePage(
  config: ArticleConfig,
  lang: 'pt' | 'en',
  ArticleComponent: ComponentType<{ lang: 'pt' | 'en' }>,
): string {
  const slug = config.slugs[lang];
  const altSlug = config.slugs[lang === 'pt' ? 'en' : 'pt'];
  const url = `https://psilva.io/${slug}`;
  const altUrl = `https://psilva.io/${altSlug}`;
  const altLang = lang === 'pt' ? 'en' : 'pt';
  const htmlLang = lang === 'pt' ? 'pt-BR' : lang;
  const ogLocale = lang === 'pt' ? 'pt_BR' : 'en_US';
  const ogLocaleAlt = lang === 'pt' ? 'en_US' : 'pt_BR';
  const articleSeo = config.seo[lang];
  const xDefaultHref = `https://psilva.io/${config.xDefaultSlug || config.slugs.pt}`;

  let renderedHtml: string;
  try {
    renderedHtml = renderArticlePage(slug, ArticleComponent, lang);
  } catch (err) {
    console.error(`[prerender] SSR failed for ${slug}, falling back to empty root:`, err);
    renderedHtml = '';
  }

  const hreflangLinks = `<link rel="alternate" hreflang="${lang}" href="${url}" /><link rel="alternate" hreflang="${altLang}" href="${altUrl}" /><link rel="alternate" hreflang="x-default" href="${xDefaultHref}" />`;

  let result = indexHtml
    .replace('<div id="root"></div>', `<div id="root">${renderedHtml}</div>`)
    .replace('<html lang="pt-BR" class="theme-warm dark">', `<html lang="${htmlLang}" class="theme-warm dark">`)
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(articleSeo.title)}</title>`)
    .replace(/<meta name="title" content="[^"]*" \/>/, `<meta name="title" content="${esc(articleSeo.title)}" />`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(articleSeo.description)}" />`)
    // Remove home hreflang tags before injecting article-specific ones
    .replace(/<link rel="alternate" hreflang="[^"]*" href="[^"]*" \/>\s*/g, '')
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />${hreflangLinks}`)
    .replace(/<meta property="og:type" content="[^"]*" \/>/, '<meta property="og:type" content="article" />')
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(articleSeo.title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(articleSeo.description)}" />`)
    .replace(/<meta property="og:locale" content="pt_BR" \/>/, `<meta property="og:locale" content="${ogLocale}" />`)
    .replace(/<meta property="og:locale:alternate" content="en_US" \/>/, `<meta property="og:locale:alternate" content="${ogLocaleAlt}" />`)
    .replace(/<meta name="twitter:url" content="[^"]*" \/>/, `<meta name="twitter:url" content="${url}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${esc(articleSeo.title)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${esc(articleSeo.description)}" />`)
    // OG image — replace with article-specific image if configured
    .replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${esc(config.ogImage || 'https://psilva.io/og-image.webp')}" />`)
    .replace(/<meta property="og:image:alt" content="[^"]*" \/>/, `<meta property="og:image:alt" content="${esc(articleSeo.title)}" />`)
    .replace(/<meta name="twitter:image" content="[^"]*" \/>/, config.ogImage ? `<meta name="twitter:image" content="${esc(config.ogImage)}" />` : '');

  // Inject article:published_time + article:modified_time + article:tag
  const seoMeta = config.seoMeta;
  if (seoMeta) {
    const articleMetaTags = [
      `<meta property="article:published_time" content="${seoMeta.datePublished}" />`,
      `<meta property="article:modified_time" content="${seoMeta.dateModified}" />`,
      `<meta property="article:author" content="https://www.linkedin.com/in/paulovi" />`,
      `<meta property="article:tag" content="${esc(seoMeta.articleTags)}" />`,
    ].join('\n    ');
    result = result.replace('</head>', `    ${articleMetaTags}\n  </head>`);
  }

  // Inject article JSON-LD (replace homepage Person/WebSite schema)
  const i18n = i18nMap[config.id];
  if (seoMeta && i18n) {
    const t = i18n[lang];
    if (t) {
      const jsonLd = buildArticleJsonLd({
        lang,
        url: `https://psilva.io/${slug}`,
        altUrl: `https://psilva.io/${altSlug}`,
        headline: t.header.h1,
        alternativeHeadline: articleSeo.title,
        description: articleSeo.description,
        datePublished: seoMeta.datePublished,
        dateModified: seoMeta.dateModified,
        keywords: seoMeta.keywords,
        images: config.heroImage ? [config.heroImage] : seoMeta.images,
        breadcrumbHome: t.nav.breadcrumbHome,
        breadcrumbCurrent: t.nav.breadcrumbCurrent,
        faq: t.faq.items,
        articleType: seoMeta.articleType,
        about: seoMeta.about,
        extra: seoMeta.extra,
        citation: seoMeta.citation,
        isBasedOn: seoMeta.isBasedOn,
        mentions: seoMeta.mentions,
        discussionUrl: seoMeta.discussionUrl,
        relatedLink: seoMeta.relatedLink,
      });
      const jsonLdScript = `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>`;
      // Replace the homepage JSON-LD with article-specific one
      result = result.replace(
        /<script type="application\/ld\+json">[\s\S]*?<\/script>/,
        jsonLdScript,
      );
    }
  }

  return result;
}

// Load article components and build pages
const articlePages: ArticlePage[] = [];

for (const config of articleRegistry) {
  let ArticleComponent: ComponentType<{ lang: 'pt' | 'en' }>;
  try {
    const mod = await config.component();
    ArticleComponent = mod.default;
  } catch {
    console.log(`[prerender] Skipping ${config.id} — component not found yet`);
    continue;
  }

  const seen = new Set<string>();
  for (const lang of ['pt', 'en'] as const) {
    const slug = config.slugs[lang];
    if (seen.has(slug)) continue; // same slug for both languages
    seen.add(slug);
    const html = buildArticlePage(config, lang, ArticleComponent);
    articlePages.push({ slug, html });
  }
}

// ---------------------------------------------------------------------------
// Critical CSS inlining with Critters
// ---------------------------------------------------------------------------
const critters = new Critters({
  path: distDir,
  publicPath: '/',
  inlineFonts: false,
  preload: 'media',
  compress: true,
  reduceInlineStyles: true,
});

function dedupePreloads(html: string): string {
  return html.replace(/<link rel="preload" as="image" href="\/foto-avatar\.webp">/g, '');
}

async function writePage(html: string, outputPath: string, label: string) {
  const dir = dirname(outputPath);
  mkdirSync(dir, { recursive: true });
  try {
    const processed = dedupePreloads(await critters.process(html));
    writeFileSync(outputPath, processed, 'utf-8');
    console.log(`[prerender] ${label} (with critical CSS)`);
  } catch {
    writeFileSync(outputPath, html, 'utf-8');
    console.log(`[prerender] ${label} (no critical CSS)`);
  }
}

async function inlineCriticalCSS() {
  // Home pages
  await writePage(injectedPt, indexPath, 'PT: dist/index.html updated');
  await writePage(enPage, resolve(distDir, 'en', 'index.html'), 'EN: dist/en/index.html created');

  // About pages
  for (const { slug, html } of aboutPages) {
    await writePage(html, resolve(distDir, slug, 'index.html'), `${slug}: dist/${slug}/index.html created`);
  }

  // Article pages
  for (const { slug, html } of articlePages) {
    await writePage(html, resolve(distDir, slug, 'index.html'), `${slug}: dist/${slug}/index.html created`);
  }
}

await inlineCriticalCSS();

// ---------------------------------------------------------------------------
// 404 page — Vercel serves this with HTTP 404 status automatically
// ---------------------------------------------------------------------------
const notFoundHtml = indexHtml
  .replace('<div id="root"></div>', `<div id="root"><div style="min-height:80vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 1.5rem"><p style="font-size:6rem;font-weight:bold;color:var(--primary);margin-bottom:1rem;font-family:var(--font-display)">404</p><h1 style="font-size:1.5rem;font-weight:600;color:var(--foreground);margin-bottom:0.5rem">Page not found</h1><p style="color:var(--muted-foreground);margin-bottom:2rem;max-width:28rem">The page you're looking for doesn't exist or has been moved.</p><a href="/" style="display:inline-flex;align-items:center;gap:0.5rem;padding:0.75rem 1.5rem;border-radius:0.75rem;background:var(--primary);color:var(--primary-foreground);font-weight:500;text-decoration:none">← Back to home</a></div></div>`)
  .replace(/<meta name="robots" content="[^"]*" \/>/, '<meta name="robots" content="noindex, nofollow" />')
  .replace(/<title>[^<]*<\/title>/, '<title>404 — Page not found | psilva.io</title>');

// Add noindex if no robots meta exists
if (!notFoundHtml.includes('name="robots"')) {
  const withNoindex = notFoundHtml.replace('</head>', '<meta name="robots" content="noindex, nofollow" /></head>');
  writeFileSync(resolve(distDir, '404.html'), withNoindex, 'utf-8');
} else {
  writeFileSync(resolve(distDir, '404.html'), notFoundHtml, 'utf-8');
}
console.log('[prerender] 404: dist/404.html created');

// ---------------------------------------------------------------------------
// Hydration structure validation
// ---------------------------------------------------------------------------
function validateHydrationStructure(html: string, label: string) {
  const rootMatch = html.match(/<div id="root">([\s\S]*?)<\/div>\s*<script/);
  if (!rootMatch || !rootMatch[1].trim()) return; // empty root = OK (fallback)
  const content = rootMatch[1];

  // Must NOT contain <link> tags (React 19 SSR artifacts)
  if (/<link\s/.test(content)) {
    console.error(`[hydration-check] FAIL ${label}: <link> tags found inside #root — will cause hydration mismatch`);
    process.exit(1);
  }

  // Must have <div> wrapper (PageTransition)
  if (!content.includes('<div')) {
    console.error(`[hydration-check] FAIL ${label}: missing <div> wrapper (PageTransition) inside #root`);
    process.exit(1);
  }
}

// Validate home pages
validateHydrationStructure(injectedPt, 'home-pt');
validateHydrationStructure(enPage, 'home-en');

// Validate about pages
for (const { slug, html } of aboutPages) {
  validateHydrationStructure(html, slug);
}

// Validate article pages
for (const { slug, html } of articlePages) {
  validateHydrationStructure(html, slug);
}

console.log('[hydration-check] All pages pass structural validation');
console.log('[prerender] Done.');
