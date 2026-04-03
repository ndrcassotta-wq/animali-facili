'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  PARTNER_CATEGORY_VALUES,
  PARTNER_SERVICE_SUGGESTIONS,
  PARTNER_SPECIES_VALUES,
  getPartnerCategoryLabel,
  getPartnerSpeciesLabel,
} from '@/lib/constants/partners'

type SubmissionState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
}

const initialState: SubmissionState = {
  status: 'idle',
  message: '',
  fieldErrors: {},
}

function FieldError({
  errors,
}: {
  errors?: string[]
}) {
  if (!errors?.length) return null

  return (
    <p className="mt-2 text-sm font-medium text-red-600">
      {errors[0]}
    </p>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Invio in corso...' : 'Invia candidatura'}
    </Button>
  )
}

export function PartnerSubmissionForm({
  action,
}: {
  action: (
    prevState: SubmissionState,
    formData: FormData
  ) => Promise<SubmissionState>
}) {
  const [state, formAction] = useActionState(action, initialState)

  return (
    <form action={formAction} className="space-y-6">
      {state.status === 'success' ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          {state.message}
        </div>
      ) : null}

      {state.status === 'error' && state.message ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {state.message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="nome" className="mb-2 block text-sm font-medium text-slate-700">
            Nome *
          </label>
          <Input id="nome" name="nome" placeholder="Es. Clinica Veterinaria XYZ" />
          <FieldError errors={state.fieldErrors?.nome} />
        </div>

        <div>
          <label htmlFor="categoria" className="mb-2 block text-sm font-medium text-slate-700">
            Categoria *
          </label>
          <select
            id="categoria"
            name="categoria"
            defaultValue=""
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Seleziona una categoria
            </option>
            {PARTNER_CATEGORY_VALUES.map((categoria) => (
              <option key={categoria} value={categoria}>
                {getPartnerCategoryLabel(categoria)}
              </option>
            ))}
          </select>
          <FieldError errors={state.fieldErrors?.categoria} />
        </div>

        <div>
          <label htmlFor="citta" className="mb-2 block text-sm font-medium text-slate-700">
            Città *
          </label>
          <Input id="citta" name="citta" placeholder="Es. Roma" />
          <FieldError errors={state.fieldErrors?.citta} />
        </div>

        <div>
          <label htmlFor="provincia" className="mb-2 block text-sm font-medium text-slate-700">
            Provincia *
          </label>
          <Input id="provincia" name="provincia" placeholder="Es. RM" />
          <FieldError errors={state.fieldErrors?.provincia} />
        </div>
      </div>

      <div>
        <label htmlFor="descrizione" className="mb-2 block text-sm font-medium text-slate-700">
          Descrizione *
        </label>
        <Textarea
          id="descrizione"
          name="descrizione"
          rows={6}
          placeholder="Racconta in modo chiaro chi sei, che servizi offri e per quali animali lavori."
        />
        <FieldError errors={state.fieldErrors?.descrizione} />
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-slate-700">Specie trattate *</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PARTNER_SPECIES_VALUES.map((specie) => (
            <label
              key={specie}
              className="flex items-center gap-3 rounded-2xl border border-[#EADFD3] bg-[#FFF9F5] px-4 py-3 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                name="specie_trattate"
                value={specie}
                className="h-4 w-4"
              />
              <span>{getPartnerSpeciesLabel(specie)}</span>
            </label>
          ))}
        </div>
        <FieldError errors={state.fieldErrors?.specie_trattate} />
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-slate-700">Servizi principali *</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PARTNER_SERVICE_SUGGESTIONS.map((service) => (
            <label
              key={service}
              className="flex items-center gap-3 rounded-2xl border border-[#EADFD3] bg-[#FFF9F5] px-4 py-3 text-sm text-slate-700"
            >
              <input
                type="checkbox"
                name="servizi_principali"
                value={service}
                className="h-4 w-4"
              />
              <span>{service}</span>
            </label>
          ))}
        </div>

        <div className="mt-4">
          <label
            htmlFor="servizi_principali_extra"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Altri servizi principali
          </label>
          <Textarea
            id="servizi_principali_extra"
            name="servizi_principali_extra"
            rows={4}
            placeholder="Uno per riga oppure separati da virgola."
          />
        </div>

        <FieldError errors={state.fieldErrors?.servizi_principali} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label
            htmlFor="indirizzo_completo"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Indirizzo completo
          </label>
          <Input
            id="indirizzo_completo"
            name="indirizzo_completo"
            placeholder="Es. Via Roma 123"
          />
          <FieldError errors={state.fieldErrors?.indirizzo_completo} />
        </div>

        <div>
          <label
            htmlFor="zona_servita"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Zona servita
          </label>
          <Input
            id="zona_servita"
            name="zona_servita"
            placeholder="Es. Roma nord / provincia"
          />
          <FieldError errors={state.fieldErrors?.zona_servita} />
        </div>
      </div>

      <div className="rounded-[28px] border border-[#EADFD3] bg-[#FFF9F5] p-5">
        <p className="text-sm font-semibold text-slate-900">
          Almeno un contatto è obbligatorio *
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="telefono" className="mb-2 block text-sm font-medium text-slate-700">
              Telefono
            </label>
            <Input id="telefono" name="telefono" placeholder="Es. 06 1234567" />
            <FieldError errors={state.fieldErrors?.telefono} />
          </div>

          <div>
            <label htmlFor="whatsapp" className="mb-2 block text-sm font-medium text-slate-700">
              WhatsApp
            </label>
            <Input id="whatsapp" name="whatsapp" placeholder="Es. +39 333 1234567" />
            <FieldError errors={state.fieldErrors?.whatsapp} />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <Input id="email" name="email" type="email" placeholder="Es. info@partner.it" />
            <FieldError errors={state.fieldErrors?.email} />
          </div>

          <div>
            <label htmlFor="sito" className="mb-2 block text-sm font-medium text-slate-700">
              Sito
            </label>
            <Input id="sito" name="sito" placeholder="Es. www.partner.it" />
            <FieldError errors={state.fieldErrors?.sito} />
          </div>
        </div>

        <FieldError errors={state.fieldErrors?.contatti} />
      </div>

      <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        La candidatura non viene pubblicata automaticamente. Prima entra in revisione e poi,
        se approvata manualmente, comparirà nella directory partner.
      </div>

      <SubmitButton />
    </form>
  )
}