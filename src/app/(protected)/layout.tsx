import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/Header'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <>
      <a href="#conteudo" className="sr-only z-[60] rounded-lg bg-sheet px-3 py-2 text-sm focus:not-sr-only focus:fixed focus:left-3 focus:top-3">Ir para o conteúdo</a>
      <Header email={user.email} />
      <main id="conteudo" className="mx-auto w-full max-w-[1500px] px-4 pb-16 pt-4 md:px-8 md:pt-6">{children}</main>
    </>
  )
}
