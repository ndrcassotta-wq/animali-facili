'use server'

import { createPartnerSubmission } from '@/lib/partners/queries'
import { normalizePartnerSubmissionFormData } from '@/lib/validators/partners'

type SubmissionState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
}

export async function submitPartnerApplication(
  _prevState: SubmissionState,
  formData: FormData
): Promise<SubmissionState> {
  const parsed = normalizePartnerSubmissionFormData(formData)

  if (!parsed.success) {
    const { fieldErrors, formErrors } = parsed.error.flatten()

    return {
      status: 'error',
      message: formErrors[0] ?? 'Controlla i campi evidenziati e riprova.',
      fieldErrors,
    }
  }

  try {
    await createPartnerSubmission(parsed.data)

    return {
      status: 'success',
      message:
        'Candidatura inviata con successo. La scheda è stata salvata in revisione e verrà controllata manualmente prima di essere pubblicata.',
      fieldErrors: {},
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Si è verificato un problema durante l’invio della candidatura.'

    return {
      status: 'error',
      message,
      fieldErrors: {},
    }
  }
}