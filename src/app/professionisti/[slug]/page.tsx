import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { PartnerDetail } from '@/components/partner/PartnerDetail'
import { getPartnerBySlug } from '@/lib/partners/queries'

type Params = Promise<{
  slug: string
}>

export default async function ProfessionistaDetailPage({
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
    <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 md:px-5 md:pb-20 md:pt-8">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link
          href="/professionisti"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#EADFD3] bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-[#FFF9F5]"
        >
          <ArrowLeft className="h-4 w-4" />
          Torna ai professionisti
        </Link>
      </div>

      <PartnerDetail partner={partner} />
    </main>
  )
}