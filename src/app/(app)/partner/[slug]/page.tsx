import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { PartnerDetail } from '@/components/partner/PartnerDetail'
import { getPartnerBySlug } from '@/lib/partners/queries'

type Params = Promise<{
  slug: string
}>

export default async function PartnerDetailPage({
  params,
}: {
  params: Params
}) {
  const { slug } = await params
  const partner = await getPartnerBySlug(slug)

  if (!partner) {
    notFound()
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:py-8">
      <Link
        href="/partner"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Torna alla directory partner
      </Link>

      <PartnerDetail partner={partner} />
    </main>
  )
}