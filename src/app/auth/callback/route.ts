import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Pokud hráč ještě nemá řádek v profiles, po prvním přihlášení ho můžeme založit
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const fullName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split('@')[0] ||
          'Hádač'

        await supabase.from('profiles').upsert(
          {
            id: user.id,
            nickname: fullName.slice(0, 30),
          },
          { onConflict: 'id', ignoreDuplicates: true }
        )
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // V případě chyby přesměrujeme na hlavní stránku s parametrem chyby
  return NextResponse.redirect(`${origin}/?auth_error=true`)
}

