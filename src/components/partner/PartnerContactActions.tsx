import { Globe, Mail, MessageCircle, Phone } from 'lucide-react'
import type { PartnerProfile } from '@/lib/partners/queries'

type ContactShape = Pick<PartnerProfile, 'telefono' | 'whatsapp' | 'email' | 'sito'>

function normalizeSiteUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url
  return `https://${url}`
}

function normalizePhone(phone: string) {
  return phone.replace(/[^\d+]/g, '')
}

function buildWhatsAppUrl(value: string) {
  const normalized = normalizePhone(value).replace(/^\+/, '')
  return `https://wa.me/${normalized}`
}

export function PartnerContactActions({
  partner,
  compact = false,
}: {
  partner: ContactShape
  compact?: boolean
}) {
  const actions = []

  if (partner.telefono) {
    actions.push({
      key: 'telefono',
      href: `tel:${normalizePhone(partner.telefono)}`,
      label: 'Chiama',
      icon: Phone,
    })
  }

  if (partner.whatsapp) {
    actions.push({
      key: 'whatsapp',
      href: buildWhatsAppUrl(partner.whatsapp),
      label: 'WhatsApp',
      icon: MessageCircle,
    })
  }

  if (partner.email) {
    actions.push({
      key: 'email',
      href: `mailto:${partner.email}`,
      label: 'Email',
      icon: Mail,
    })
  }

  if (partner.sito) {
    actions.push({
      key: 'sito',
      href: normalizeSiteUrl(partner.sito),
      label: 'Sito',
      icon: Globe,
    })
  }

  if (actions.length === 0) return null

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? 'mt-4' : 'mt-6'}`}>
      {actions.map((action) => {
        const Icon = action.icon
        const external = action.href.startsWith('http')

        return (
          <a
            key={action.key}
            href={action.href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer' : undefined}
            className="inline-flex items-center gap-2 rounded-full border border-[#EADFD3] bg-[#FFF9F5] px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#D9C4B2] hover:bg-white"
          >
            <Icon className="h-4 w-4" />
            {action.label}
          </a>
        )
      })}
    </div>
  )
}