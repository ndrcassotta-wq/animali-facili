'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createPartnerSubmission } from '@/lib/partners/queries'
import {
  buildPartnerImagePath,
  PARTNER_IMAGE_BUCKET,
} from '@/lib/partners/images'
import {
  normalizePartnerSubmissionFormData,
  validatePartnerImage,
} from '@/lib/validators/partners'

type SubmissionState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  fieldErrors?: Record<string, string[] | undefined>
}

function slugifyPartnerName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

function getSupabaseStorageAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Configurazione server incompleta per upload immagini partner.'
    )
  }

  return createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
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

  const imageValidation = validatePartnerImage(formData.get('image'))

  if (!imageValidation.success) {
    return {
      status: 'error',
      message: imageValidation.error,
      fieldErrors: {
        image: [imageValidation.error],
      },
    }
  }

  const imageFile = imageValidation.data
  const slug = slugifyPartnerName(parsed.data.nome)
  const storageAdmin = getSupabaseStorageAdmin()

  let uploadedImagePath: string | null = null

  try {
    if (imageFile) {
      uploadedImagePath = buildPartnerImagePath(slug, imageFile)

      const { error: uploadError } = await storageAdmin.storage
        .from(PARTNER_IMAGE_BUCKET)
        .upload(uploadedImagePath, imageFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: imageFile.type,
        })

      if (uploadError) {
        return {
          status: 'error',
          message: 'Upload immagine non riuscito. Riprova con un file valido.',
          fieldErrors: {
            image: ['Upload immagine non riuscito.'],
          },
        }
      }
    }

    await createPartnerSubmission(parsed.data, {
      slug,
      imagePath: uploadedImagePath,
      imageUpdatedAt: uploadedImagePath ? new Date().toISOString() : null,
    })

    return {
      status: 'success',
      message:
        'Candidatura inviata con successo. La scheda è stata salvata in revisione e verrà controllata manualmente prima di essere pubblicata.',
      fieldErrors: {},
    }
  } catch (error) {
    if (uploadedImagePath) {
      try {
        await storageAdmin.storage
          .from(PARTNER_IMAGE_BUCKET)
          .remove([uploadedImagePath])
      } catch (cleanupError) {
        console.error('[partner image cleanup error]', cleanupError)
      }
    }

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