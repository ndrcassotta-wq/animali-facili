import Link from 'next/link'
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
      className="rounded-[28px] border border-[#EADFD3] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label htmlFor="partner-q" className="mb-2 block text-sm font-medium text-slate-700">
            Cerca
          </label>
          <Input
            id="partner-q"
            name="q"
            defaultValue={values.q}
            placeholder="Nome, indirizzo, città"
          />
        </div>

        <div>
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
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Tutte le categorie</option>
            {PARTNER_CATEGORY_VALUES.map((categoria) => (
              <option key={categoria} value={categoria}>
                {getPartnerCategoryLabel(categoria)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="partner-luogo"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Città / provincia
          </label>
          <Input
            id="partner-luogo"
            name="luogo"
            defaultValue={values.luogo}
            placeholder="Es. Roma o RM"
          />
        </div>

        <div>
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
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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

      <div className="mt-5 flex flex-wrap gap-3">
        <Button type="submit">Cerca partner</Button>
        <Link
          href={basePath}
          className="inline-flex h-10 items-center justify-center rounded-md border border-[#EADFD3] px-4 text-sm font-medium text-slate-700 transition hover:bg-[#FFF9F5]"
        >
          Reset filtri
        </Link>
      </div>
    </form>
  )
}