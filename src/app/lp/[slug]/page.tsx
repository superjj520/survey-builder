import { BUILTIN_TEMPLATES, getTemplateBySlug } from '@/lib/templates'
import { LandingPageClient } from './client'

export function generateStaticParams() {
  return BUILTIN_TEMPLATES.filter(t => t.slug).map(t => ({ slug: t.slug! }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const template = getTemplateBySlug(slug)
  if (!template) return { title: '趣测小屋' }
  return {
    title: `${template.title} - 趣测小屋`,
    description: template.description,
    openGraph: {
      title: template.title,
      description: template.description,
      type: 'website',
      siteName: '趣测小屋',
    },
  }
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <LandingPageClient slug={slug} />
}
