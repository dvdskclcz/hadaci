'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { getPlayerProfileAction } from '@/app/actions/profile'
import { PlayerProfileData } from '@/lib/badges'
import UserProfileView from '@/components/UserProfileView'
import { X, Loader2, LogIn, User as UserIcon } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

interface ProfileModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const [profileData, setProfileData] = useState<PlayerProfileData | null>(null)
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!isOpen) return

        let isMounted = true
        setLoading(true)

        getPlayerProfileAction()
            .then((data) => {
                if (isMounted) {
                    setProfileData(data)
                }
            })
            .catch((err) => {
                console.error('Chyba při načítání profilu hráče:', err)
            })
            .finally(() => {
                if (isMounted) {
                    setLoading(false)
                }
            })

        return () => {
            isMounted = false
        }
    }, [isOpen])

    const handleGoogleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
    }

    if (!isOpen || !mounted) return null

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-3xl p-5 sm:p-7 shadow-2xl relative max-h-[90dvh] flex flex-col text-left my-auto overflow-hidden">
                {/* Křížek pro zavření */}
                <button
                    onClick={onClose}
                    type="button"
                    className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/60 transition z-10"
                    aria-label="Zavřít profil"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Obsah modalu s vlastním scrollem */}
                <div className="overflow-y-auto pr-1 sm:pr-2 min-h-0 flex-1 space-y-4">
                    {loading ? (
                        <div className="py-24 text-center space-y-3">
                            <Loader2 className="w-8 h-8 mx-auto animate-spin text-amber-400" />
                            <p className="text-xs text-slate-400 font-medium">Načítám statistiky a odznaky...</p>
                        </div>
                    ) : profileData ? (
                        <UserProfileView data={profileData} onClose={onClose} />
                    ) : (
                        <div className="py-12 text-center max-w-md mx-auto space-y-4">
                            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-lg">
                                🕵️‍♂️
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white mb-1.5">
                                    Přihlas se pro sledování statistik a odznaků
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Ukládej své dosažené série, vyřešené detektivní spisy a sbírej všech 10 prestižních odznaků napříč všemi zařízeními.
                                </p>
                            </div>
                            <div className="pt-2">
                                <button
                                    onClick={handleGoogleLogin}
                                    type="button"
                                    className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition shadow-lg shadow-amber-500/20 active:scale-95"
                                >
                                    <LogIn className="w-4 h-4" />
                                    <span>Přihlásit se přes Google</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
