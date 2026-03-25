import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Animale } from '@/lib/types/query.types'
import { User, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

const COLORI = [
  'from-amber-300 to-orange-400',
  'from-rose-300 to-pink-400',
  'from-teal-300 to-emerald-400',
  'from-violet-300 to-purple-400',
  'from-sky-300 to-blue-400',
  'from-lime-300 to-green-400',
]

function colorePerNome(nome: string) {
  return COLORI[nome.charCodeAt(0) % COLORI.length]
}

function sizeCls(n: number): string {
  if (n === 1) return 'h-56 w-56'
  if (n === 2) return 'h-44 w-44'
  if (n === 3) return 'h-36 w-36'
  if (n === 4) return 'h-36 w-36'
  if (n <= 6)  return 'h-28 w-28'
  return 'h-24 w-24'
}

function fontSizePx(n: number): string {
  if (n === 1) return '3rem'
  if (n === 2) return '2.5rem'
  if (n === 3) return '2rem'
  return '1.5rem'
}

function textCls(n: number): string {
  if (n <= 2) return 'text-base'
  if (n <= 4) return 'text-sm'
  return 'text-xs'
}

function gapCls(n: number): string {
  if (n === 2) return 'gap-6'   // più compatti verticalmente
  if (n <= 4)  return 'gap-7'
  return 'gap-5'
}

function AvatarAnimale({
  animale,
  n,
}: {
  animale: Pick<Animale, 'id' | 'nome' | 'categoria' | 'foto_url'>
  n: number
}) {
  const iniziale = animale.nome.charAt(0).toUpperCase()
  const colore   = colorePerNome(animale.nome)

  return (
    <Link
      href={`/animali/${animale.id}`}
      className="flex flex-col items-center gap-3 active:scale-95 transition-transform"
    >
      {animale.foto_url ? (
        <img
          src={animale.foto_url}
          alt={animale.nome}
          className={cn(sizeCls(n), 'rounded-full border-4 border-white object-cover shadow-xl')}
        />
      ) : (
        <div className={cn(
          sizeCls(n),
          'rounded-full border-4 border-white bg-gradient-to-br shadow-xl flex items-center justify-center',
          colore
        )}>
          <span
            className="font-bold text-white select-none"
            style={{ fontSize: fontSizePx(n) }}
          >
            {iniziale}
          </span>
        </div>
      )}
      <span className={cn('font-semibold text-gray-800 max-w-[140px] truncate text-center', textCls(n))}>
        {animale.nome}
      </span>
    </Link>
  )
}

function GrigliaAnimali({
  animali,
}: {
  animali: Pick<Animale, 'id' | 'nome' | 'categoria' | 'foto_url'>[]
}) {
  const n   = animali.length
  const gap = gapCls(n)

  let righe: (typeof animali)[] = []
  if (n === 1) righe = [[animali[0]]]
  else if (n === 2) righe = [[animali[0]], [animali[1]]]
  else if (n === 3) righe = [[animali[0]], [animali[1], animali[2]]]
  else if (n === 4) righe = [[animali[0], animali[1]], [animali[2], animali[3]]]
  else if (n === 5) righe = [[animali[0], animali[1]], [animali[2], animali[3], animali[4]]]
  else if (n === 6) righe = [[animali[0], animali[1], animali[2]], [animali[3], animali[4], animali[5]]]
  else {
    for (let i = 0; i < n; i += 3) righe.push(animali.slice(i, i + 3))
  }

  return (
    <div className={cn('flex flex-col items-center w-full', gap)}>
      {righe.map((riga, ri) => (
        <div key={ri} className={cn('flex items-center justify-center', gap)}>
          {riga.map(a => (
            <AvatarAnimale key={a.id} animale={a} n={n} />
          ))}
        </div>
      ))}
    </div>
  )
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: animaliRaw },
    { count: notificheNonLette },
  ] = await Promise.all([
    supabase
      .from('animali')
      .select('id, nome, categoria, foto_url')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }),

    supabase
      .from('notifiche')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('letta', false),
  ])

  const animaliList   = (animaliRaw ?? []) as Pick<Animale, 'id' | 'nome' | 'categoria' | 'foto_url'>[]
  const nessunAnimale = animaliList.length === 0
  const badge         = notificheNonLette ?? 0

  return (
    <div
      className="flex flex-col bg-[#FDF8F3]"
      style={{ height: '100dvh' }}
    >

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="shrink-0 px-5 pt-10 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-animali-facili.png"
              alt="Animali Facili"
              width={44}
              height={44}
              className="rounded-2xl shadow-md"
            />
            <span className="text-xl font-extrabold tracking-tight text-gray-900">
              Animali Facili
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/notifiche" aria-label="Notifiche">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100">
                <Bell className="h-5 w-5 text-gray-500" />
                {badge > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
            </Link>
            <Link href="/profilo" aria-label="Profilo utente">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm border border-gray-100">
                <User className="h-5 w-5 text-gray-500" />
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* ── ANIMALI ─────────────────────────────────────────────────────── */}
      {/*
        flex-1 prende tutto lo spazio tra header e bottom nav.
        pb-16 compensa visivamente la bottom nav (bias verso l'alto).
        justify-center centra nel rimanente spazio utile.
      */}
      <section className="flex flex-1 items-center justify-center px-6 pb-16">
        {nessunAnimale ? (
          <Link href="/animali/nuovo">
            <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed border-amber-200 bg-white px-10 py-14 text-center active:scale-[0.98] transition-transform">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
                <span className="text-4xl">🐾</span>
              </div>
              <div>
                <p className="text-base font-bold text-gray-700">Aggiungi il tuo primo animale</p>
                <p className="mt-1 text-sm text-gray-400">Tocca per iniziare</p>
              </div>
            </div>
          </Link>
        ) : (
          <GrigliaAnimali animali={animaliList} />
        )}
      </section>

    </div>
  )
}