'use client'

import { useState, useEffect } from 'react'
import { updateNicknameAction, getNicknameAction } from '@/app/actions/game'
import { User, Check, Edit2, Loader2 } from 'lucide-react'

export default function NicknameEditor({ initialNickname }: { initialNickname?: string }) {
    const [nickname, setNickname] = useState(initialNickname || 'Anonymní hádač')
    const [isEditing, setIsEditing] = useState(false)
    const [tempNick, setTempNick] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!initialNickname) {
            getNicknameAction().then((nick) => {
                if (nick) setNickname(nick)
            })
        }
    }, [initialNickname])

    const handleStartEdit = () => {
        setTempNick(nickname === 'Anonymní hádač' ? '' : nickname)
        setIsEditing(true)
    }

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault()
        if (!tempNick.trim() || loading) {
            setIsEditing(false)
            return
        }

        setLoading(true)
        const res = await updateNicknameAction(tempNick)
        setLoading(false)

        if (res.success && res.nickname) {
            setNickname(res.nickname)
        }
        setIsEditing(false)
    }

    if (isEditing) {
        return (
            <form onSubmit={handleSave} className="inline-flex items-center gap-1.5 animate-fade-in">
                <input
                    type="text"
                    value={tempNick}
                    onChange={(e) => setTempNick(e.target.value)}
                    placeholder="Tvoje přezdívka..."
                    maxLength={30}
                    autoFocus
                    disabled={loading}
                    className="bg-slate-950 border border-amber-400/80 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none w-32 sm:w-40"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="p-1 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition"
                >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                </button>
            </form>
        )
    }

    return (
        <button
            type="button"
            onClick={handleStartEdit}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition group text-xs"
            title="Klikni pro změnu přezdívky"
        >
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium max-w-[120px] truncate">{nickname}</span>
            <Edit2 className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition ml-0.5" />
        </button>
    )
}