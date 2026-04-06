import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Mail, ExternalLink, Award, GraduationCap, Briefcase, Clock, Newspaper, HelpCircle, Users } from 'lucide-react'
import { aboutContent, type AboutLang } from './about-i18n'

const SOCIAL_LINKS = [
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/paulovi' },
]

export default function AboutPage({ lang = 'pt' }: { lang?: AboutLang }) {
  const t = aboutContent[lang]
  const altSlug = t.altSlug

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = t.seo.title

    let desc = document.querySelector('meta[name="description"]') as HTMLMetaElement
    if (!desc) { desc = document.createElement('meta'); desc.name = 'description'; document.head.appendChild(desc) }
    desc.content = t.seo.description

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical) }
    canonical.href = `https://psilva.io/${t.slug}`

    const hreflangs = [
      { lang: 'pt', href: 'https://psilva.io/sobre-mim' },
      { lang: 'en', href: 'https://psilva.io/about' },
      { lang: 'x-default', href: 'https://psilva.io/sobre-mim' },
    ]
    document.querySelectorAll('link[hreflang]').forEach(el => el.remove())
    for (const hl of hreflangs) {
      const link = document.createElement('link')
      link.rel = 'alternate'
      link.hreflang = hl.lang
      link.href = hl.href
      document.head.appendChild(link)
    }

    let script = document.querySelector('script[data-about-jsonld]') as HTMLScriptElement
    if (!script) { script = document.createElement('script'); script.type = 'application/ld+json'; script.dataset.aboutJsonld = ''; document.head.appendChild(script) }
    script.textContent = JSON.stringify({
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
    })

    return () => {
      script?.remove()
      document.querySelectorAll('link[hreflang]').forEach(el => el.remove())
    }
  }, [lang, t])

  return (
    <div className="min-h-screen bg-background text-foreground bg-[length:24px_24px] [background-image:radial-gradient(circle,hsl(var(--dot-grid))_1px,transparent_1px)]">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12 md:py-20">

        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-10">
          <img
            src="/foto-avatar-sm.webp"
            srcSet="/foto-avatar-sm.webp 192w, /foto-avatar.webp 384w"
            sizes="96px"
            alt="Paulo Victor Silva"
            className="w-24 h-24 rounded-full border-2 border-border shadow-lg"
            width={96}
            height={96}
          />
          <div className="text-center sm:text-left">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-1">
              {t.heading}
            </h1>
            <p className="text-sm text-primary font-medium mb-2">{t.subtitle}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {t.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {t.lastUpdated}
              </span>
            </div>
          </div>
        </header>

        {/* Bio */}
        <section className="mb-10">
          {t.bio.map((paragraph, i) => (
            <p key={i} className="text-base text-muted-foreground leading-relaxed mb-4">
              {paragraph}
            </p>
          ))}
        </section>

        {/* Seeking */}
        <section className="mb-10 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-sm font-medium text-primary mb-2">{t.seeking}</p>
          <div className="flex flex-wrap gap-2">
            {t.roles.map((role) => (
              <span key={role} className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                {role}
              </span>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            {t.timelineHeading}
          </h2>
          <div className="space-y-3">
            {t.timeline.map((item) => (
              <div key={item.period} className="flex gap-4 p-3 rounded-lg bg-card border border-border">
                <span className="text-xs font-mono text-primary whitespace-nowrap pt-0.5">{item.period}</span>
                <div>
                  <p className="font-medium text-foreground text-sm">{item.role}</p>
                  <p className="text-xs text-muted-foreground">{item.company} — {item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Projects */}
        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            {t.projectsHeading}
          </h2>
          <div className="space-y-2">
            {t.projects.map((project) => (
              <div
                key={project.name}
                className="flex items-center justify-between p-3 rounded-lg bg-card border border-border"
              >
                <div>
                  <p className="font-medium text-foreground text-sm">{project.name}</p>
                  <p className="text-xs text-muted-foreground">{project.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Certifications */}
        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            {t.certificationsHeading}
          </h2>
          <div className="space-y-3">
            {t.certifications.map((cert) => (
              <div key={cert.org} className="p-3 rounded-lg bg-card border border-border">
                <p className="font-medium text-foreground text-sm mb-1">{cert.org}</p>
                <div className="flex flex-wrap gap-1.5">
                  {cert.items.map((item) => (
                    <span key={item} className="px-2 py-0.5 rounded text-xs bg-muted/30 text-muted-foreground">{item}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Education */}
        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-primary" />
            {t.educationHeading}
          </h2>
          <ul className="space-y-1.5">
            {t.education.map((item) => (
              <li key={item} className="text-sm text-muted-foreground">{item}</li>
            ))}
          </ul>
        </section>

        {/* Press */}
        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-primary" />
            {t.pressHeading}
          </h2>
          {t.press.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-all group"
            >
              <div>
                <p className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.publisher} · {item.date}</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </a>
          ))}
        </section>

        {/* Community */}
        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            {t.communityHeading}
          </h2>
          <div className="space-y-2">
            {t.community.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/30 transition-all group"
              >
                <div>
                  <p className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.platform}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </a>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" />
            {t.faqHeading}
          </h2>
          <div className="space-y-4">
            {t.faq.map((item) => (
              <div key={item.q} className="p-4 rounded-lg bg-card border border-border">
                <p className="font-medium text-foreground text-sm mb-2">{item.q}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Connect */}
        <section className="mb-10">
          <h2 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <ExternalLink className="w-4 h-4 text-primary" />
            {t.connectHeading}
          </h2>

          <a
            href={`mailto:${t.email}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors mb-4"
          >
            <Mail className="w-4 h-4" />
            {t.email}
          </a>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SOCIAL_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
              >
                <ExternalLink className="w-3 h-3 text-primary shrink-0" />
                {link.name}
              </a>
            ))}
          </div>
        </section>

        {/* Language toggle */}
        <div className="text-center pt-6 border-t border-border">
          <Link
            to={`/${altSlug}`}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            {lang === 'pt' ? 'Read in English →' : 'Ler em Português →'}
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Paulo Victor Silva. {lang === 'pt' ? 'Todos os direitos reservados.' : 'All rights reserved.'}
          </p>
        </footer>
      </main>
    </div>
  )
}
