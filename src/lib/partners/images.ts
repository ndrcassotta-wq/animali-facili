export const PARTNER_IMAGE_BUCKET = 'partner-images'

export const PARTNER_IMAGE_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const PARTNER_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024

export const PARTNER_IMAGE_INPUT_ACCEPT = '.jpg,.jpeg,.png,.webp'

export type PartnerImageMimeType =
  (typeof PARTNER_IMAGE_ALLOWED_MIME_TYPES)[number]

export function isPartnerImageFile(
  value: FormDataEntryValue | null
): value is File {
  return typeof File !== 'undefined' && value instanceof File && value.size > 0
}

export function isPartnerImageMimeTypeAllowed(
  mimeType: string
): mimeType is PartnerImageMimeType {
  return PARTNER_IMAGE_ALLOWED_MIME_TYPES.includes(
    mimeType as PartnerImageMimeType
  )
}

export function isPartnerImageSizeAllowed(size: number): boolean {
  return size <= PARTNER_IMAGE_MAX_SIZE_BYTES
}

export function getPartnerImageExtension(
  file: Pick<File, 'type' | 'name'>
): 'jpg' | 'png' | 'webp' {
  if (file.type === 'image/jpeg') return 'jpg'
  if (file.type === 'image/png') return 'png'
  if (file.type === 'image/webp') return 'webp'

  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === 'jpg' || ext === 'jpeg') return 'jpg'
  if (ext === 'png') return 'png'
  if (ext === 'webp') return 'webp'

  return 'jpg'
}

export function sanitizePartnerSlugForFile(slug: string): string {
  const safe = slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return safe || 'partner'
}

export function buildPartnerImagePath(
  slug: string,
  file: Pick<File, 'type' | 'name'>,
  now = Date.now()
): string {
  const safeSlug = sanitizePartnerSlugForFile(slug)
  const ext = getPartnerImageExtension(file)
  return `partner/${safeSlug}-${now}.${ext}`
}

export function getPartnerImagePublicUrl(
  imagePath?: string | null
): string | null {
  if (!imagePath) return null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return null

  const normalizedBase = supabaseUrl.replace(/\/$/, '')
  const normalizedPath = imagePath.replace(/^\/+/, '')

  return `${normalizedBase}/storage/v1/object/public/${PARTNER_IMAGE_BUCKET}/${normalizedPath}`
}

export function getPartnerImagePlaceholderInitial(name?: string | null): string {
  const first = name?.trim()?.charAt(0)?.toUpperCase()
  return first || 'P'
}

export function getPartnerImageValidationMessage(): string {
  return 'Usa un file JPG, PNG o WEBP da massimo 5 MB.'
}