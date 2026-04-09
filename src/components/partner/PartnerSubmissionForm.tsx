'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  Building2,
  CheckCircle2,
  PhoneCall,
  Image as ImageIcon,
} from 'lucide-react'
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
import { PARTNER_IMAGE_INPUT_ACCEPT } from '@/lib/partners/images'

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

  return <p className="mt-2 text-sm font-medium text-red-600">{errors[0]}</p>
}

function SectionCard({
  title,
  description,
  icon,
  children,
}: {
  title: string
  description?: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[24px] border border-[#F1E5DA] bg-white p-5 md:p-6">
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF9F5] text-[#8B5E3C]">
            {icon}
          </div>
        ) : null}

        <div className="min-w-0">
          <h2 className="text-base font-semibold text-slate-900 md:text-lg">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5">{children}</div>
    </section>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending} className="h-11 rounded-xl px-5">
      {pending ? 'Invio in corso...' : 'Invia richiesta'}
    </Button>
  )
}

export function PartnerSubmissionForm({
  action,
  isAuthenticated,
}: {
  action: (
    prevState: SubmissionState,
    formData: FormData
  ) => Promise<SubmissionState>
  isAuthenticated: boolean
}) {
  const [state, formAction] = useActionState(action, initialState)

  return (
    <form
      action={formAction}
      encType="multipart/form-data"
      className="space-y-6"
    >
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

      <SectionCard
        title="Informazioni principali"
        description="Inserisci i dati base della tua attività."
        icon={<Building2 className="h-5 w-5" />}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="nome"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Nome *
            </label>
            <Input
              id="nome"
              name="nome"
              placeholder="Es. Clinica Veterinaria XYZ"
              className="h-11"
            />
            <FieldError errors={state.fieldErrors?.nome} />
          </div>

          <div>
            <label
              htmlFor="categoria"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Categoria *
            </label>
            <select
              id="categoria"
              name="categoria"
              defaultValue=""
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-slate-700"
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
            <label
              htmlFor="citta"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Città *
            </label>
            <Input
              id="citta"
              name="citta"
              placeholder="Es. Roma"
              className="h-11"
            />
            <FieldError errors={state.fieldErrors?.citta} />
          </div>

          <div>
            <label
              htmlFor="provincia"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Provincia *
            </label>
            <Input
              id="provincia"
              name="provincia"
              placeholder="Es. RM"
              className="h-11"
            />
            <FieldError errors={state.fieldErrors?.provincia} />
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="descrizione"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Descrizione *
          </label>
          <Textarea
            id="descrizione"
            name="descrizione"
            rows={6}
            placeholder="Racconta in modo chiaro chi sei, che servizi offri e per quali animali lavori."
            className="min-h-[140px]"
          />
          <FieldError errors={state.fieldErrors?.descrizione} />
        </div>

        <div className="mt-4 rounded-[24px] border border-[#EADFD3] bg-[#FFF9F5] p-4 md:p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#8B5E3C]">
              <ImageIcon className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <label
                htmlFor="image"
                className="block text-sm font-semibold text-slate-900"
              >
                Logo o foto attività
              </label>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Facoltativa. JPG, PNG, WEBP – max 5 MB.
              </p>

              <input
                id="image"
                name="image"
                type="file"
                accept={PARTNER_IMAGE_INPUT_ACCEPT}
                className="mt-3 block w-full rounded-xl border border-[#EADFD3] bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-[#F4EFE7] file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-800"
              />

              <FieldError errors={state.fieldErrors?.image} />
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Animali e servizi"
        description="Seleziona le specie trattate e i servizi principali che vuoi mostrare nella scheda attività."
        icon={<CheckCircle2 className="h-5 w-5" />}
      >
        <div>
          <p className="mb-3 text-sm font-medium text-slate-700">
            Specie trattate *
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PARTNER_SPECIES_VALUES.map((specie) => (
              <label
                key={specie}
                className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-[#EADFD3] bg-[#FFF9F5] px-4 py-3 text-sm text-slate-700 transition hover:bg-white"
              >
                <input
                  type="checkbox"
                  name="specie_trattate"
                  value={specie}
                  className="h-4 w-4 shrink-0"
                />
                <span className="leading-5">
                  {getPartnerSpeciesLabel(specie)}
                </span>
              </label>
            ))}
          </div>
          <FieldError errors={state.fieldErrors?.specie_trattate} />
        </div>

        <div className="mt-6">
          <p className="mb-3 text-sm font-medium text-slate-700">
            Servizi principali *
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PARTNER_SERVICE_SUGGESTIONS.map((service) => (
              <label
                key={service}
                className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-[#EADFD3] bg-[#FFF9F5] px-4 py-3 text-sm text-slate-700 transition hover:bg-white"
              >
                <input
                  type="checkbox"
                  name="servizi_principali"
                  value={service}
                  className="h-4 w-4 shrink-0"
                />
                <span className="leading-5">{service}</span>
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
      </SectionCard>

      <SectionCard
        title="Posizione e contatti"
        description="Aggiungi le informazioni utili per farti trovare e contattare."
        icon={<PhoneCall className="h-5 w-5" />}
      >
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
              className="h-11"
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
              className="h-11"
            />
            <FieldError errors={state.fieldErrors?.zona_servita} />
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border border-[#EADFD3] bg-[#FFF9F5] p-4 md:p-5">
          <p className="text-sm font-semibold text-slate-900">
            Almeno un contatto è obbligatorio *
          </p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="telefono"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Telefono
              </label>
              <Input
                id="telefono"
                name="telefono"
                placeholder="Es. 06 1234567"
                className="h-11"
              />
              <FieldError errors={state.fieldErrors?.telefono} />
            </div>

            <div>
              <label
                htmlFor="whatsapp"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                WhatsApp
              </label>
              <Input
                id="whatsapp"
                name="whatsapp"
                placeholder="Es. +39 333 1234567"
                className="h-11"
              />
              <FieldError errors={state.fieldErrors?.whatsapp} />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Es. info@attivita.it"
                className="h-11"
              />
              <FieldError errors={state.fieldErrors?.email} />
            </div>

            <div>
              <label
                htmlFor="sito"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Sito
              </label>
              <Input
                id="sito"
                name="sito"
                placeholder="Es. www.attivita.it"
                className="h-11"
              />
              <FieldError errors={state.fieldErrors?.sito} />
            </div>
          </div>

          <FieldError errors={state.fieldErrors?.contatti} />
        </div>
      </SectionCard>

      <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        <p>
          La richiesta non viene pubblicata automaticamente. Prima entra in
          revisione e poi, se approvata manualmente, la scheda attività
          comparirà tra i professionisti.
        </p>
        <p className="mt-2">
          {isAuthenticated
            ? 'La richiesta verrà collegata al tuo account.'
            : 'Puoi inviare la richiesta anche senza login, ma in questa fase la richiesta non verrà collegata automaticamente a un account.'}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SubmitButton />
      </div>
    </form>
  )
}