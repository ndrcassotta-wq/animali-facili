function stripDiacritics(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function slugifyChunk(value: string) {
  return stripDiacritics(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buildPartnerBaseSlug(nome: string, citta: string) {
  const base = `${slugifyChunk(nome)}-${slugifyChunk(citta)}`
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')

  return base.slice(0, 80) || 'partner'
}

export function buildPartnerSlugCandidates(baseSlug: string, maxAttempts = 20) {
  return Array.from({ length: maxAttempts }, (_, index) => {
    if (index === 0) return baseSlug
    return `${baseSlug}-${index + 1}`
  })
}