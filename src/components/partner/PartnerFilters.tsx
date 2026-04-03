import Link from 'next/link'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  PARTNER_CATEGORY_VALUES,
  PARTNER_SPECIES_VALUES,
  getPartnerCategoryLabel,
  getPartnerSpeciesLabel,
} from '@/lib/constants/partners'

type FilterValues = {
  q?: string
  categoria?: string
  luogo?: string
  specie?: string
}

export function PartnerFilters({
  basePath = '/partner',
  values,
}: {
  basePath?: string
  values: FilterValues
}) {
  return (
    <form
      action={basePath}
      method="GET"
      className="rounded-[28px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] md:p-6"
    >
      <div className="mb-4">
        <p className="text-sm font-medium text-[#8B5E3C]">Ricerca partner</p>
        <p className="mt-1 text-sm text-slate-600">
          Filtra per nome, luogo, categoria o specie trattata.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="min-w-0">
          <label
            htmlFor="partner-q"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Cerca
          </label>
          <Input
            id="partner-q"
            name="q"
            defaultValue={values.q}
            placeholder="Nome, indirizzo o città"
            className="h-11"
          />
        </div>

        <div className="min-w-0">
          <label
            htmlFor="partner-categoria"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Categoria
          </label>
          <select
            id="partner-categoria"
            name="categoria"
            defaultValue={values.categoria ?? ''}
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-slate-700"
          >
            <option value="">Tutte le categorie</option>
            {PARTNER_CATEGORY_VALUES.map((categoria) => (
              <option key={categoria} value={categoria}>
                {getPartnerCategoryLabel(categoria)}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0">
          <label
            htmlFor="partner-luogo"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Città o provincia
          </label>
          <Input
            id="partner-luogo"
            name="luogo"
            defaultValue={values.luogo}
            placeholder="Es. Roma o RM"
            className="h-11"
          />
        </div>

        <div className="min-w-0">
          <label
            htmlFor="partner-specie"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Specie trattata
          </label>
          <select
            id="partner-specie"
            name="specie"
            defaultValue={values.specie ?? ''}
            className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-slate-700"
          >
            <option value="">Tutte le specie</option>
            {PARTNER_SPECIES_VALUES.map((specie) => (
              <option key={specie} value={specie}>
                {getPartnerSpeciesLabel(specie)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button type="submit" className="h-11 gap-2 px-5">
          <Search className="h-4 w-4" />
          Cerca partner
        </Button>

        <Link
          href={basePath}
          className="inline-flex h-11 items-center justify-center rounded-xl border border-[#EADFD3] px-5 text-sm font-medium text-slate-700 transition hover:bg-[#FFF9F5]"
        >
          Reset filtri
        </Link>
      </div>
    </form>
  )
}