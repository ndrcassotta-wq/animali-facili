import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/layout/BottomNav'
import { NotificationTapHandler } from '@/components/notifiche/NotificationTapHandler'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-[100dvh] bg-background">
      <NotificationTapHandler />
      <main
        id="app-scroll-root"
        className="mx-auto min-h-[100dvh] max-w-lg overflow-x-hidden pb-20"
      >
        {children}
      </main>
      <BottomNav />
    </div>
  )
}