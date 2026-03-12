'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'

interface GoogleWalletButtonProps {
    publicToken: string
}

export default function GoogleWalletButton({ publicToken }: GoogleWalletButtonProps) {
    const [loading, setLoading] = useState(false)

    async function handleAddToWallet() {
        setLoading(true)
        try {
            const res = await fetch(`/api/wallet/google/${publicToken}/create-save-link`, {
                method: 'POST'
            })
            const data = await res.json()

            if (data.url) {
                window.location.href = data.url
            } else {
                toast.error(data.error || 'Failed to generate wallet link')
            }
        } catch (err) {
            toast.error('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handleAddToWallet}
            disabled={loading}
            variant="outline"
            className="w-full bg-black hover:bg-black/90 text-white border-white/10 flex items-center justify-center gap-2 h-12 rounded-2xl transition-all"
        >
            <img
                src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Wallet_Icon_2022.svg"
                alt="Google Wallet"
                className="w-5 h-5"
            />
            {loading ? 'Adding...' : 'Add to Google Wallet'}
        </Button>
    )
}
