'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { LogIn, LogOut, User as UserIcon } from 'lucide-react'

export default function UserNav() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Klientský Supabase klient
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleGoogleLogin = async () => {
    // Pokud už je anonymní, zkusíme linkIdentity, jinak standardní přihlášení
    if (user?.is_anonymous) {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (!error) return
    }

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  if (loading) {
    return <div className="h-8 w-24 bg-slate-800/40 rounded-xl animate-pulse" />
  }

  // 1. Uživatel je přihlášen trvale (neanonymně přes Google)
  if (user && !user.is_anonymous) {
    const avatarUrl = user.user_metadata?.avatar_url
    const displayName =
      user.user_metadata?.full_name || user.email?.split('@')[0] || 'Hráč'

    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full py-1 pl-1 pr-3">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs">
              <UserIcon className="w-3.5 h-3.5" />
            </div>
          )}
          <span className="text-xs font-semibold text-slate-200 max-w-[100px] truncate">
            {displayName}
          </span>
        </div>

        <button
          onClick={handleLogout}
          title="Odhlásit se"
          type="button"
          className="p-1.5 rounded-full text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // 2. Anonymní nebo nepřihlášený uživatel
  return (
    <button
      onClick={handleGoogleLogin}
      type="button"
      className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-amber-400/60 text-xs font-semibold text-slate-200 transition shadow-sm shrink-0"
    >
      <LogIn className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span className="hidden sm:inline">Uložit postup přes Google</span>
      <span className="sm:hidden">Přihlásit</span>
    </button>
  )
}

