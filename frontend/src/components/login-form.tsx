// src/components/login-form.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWeb3 } from "@/lib/web3Provider"
import { useLanguage } from "@/lib/languageContext"

type UserRole = 'farmer' | 'bank' | 'authority'

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer')
  const [step, setStep] = useState<'role-selection' | 'wallet-connect'>('role-selection')
  const router = useRouter()
  const { connectWallet, isConnected, address } = useWeb3()

  const handleRoleSelection = (role: UserRole) => {
    setSelectedRole(role)
    // ✅ Store role BEFORE connecting wallet
    localStorage.setItem('user_role_manual', role)
    console.log('🎯 Role selected:', role)
    setStep('wallet-connect')
  }

  const handleConnectWallet = async () => {
    try {
      setIsLoading(true)
      await connectWallet()
      
      // Store auth cookie and redirect immediately after wallet connection
      document.cookie = "finternet_auth=true; path=/"
      console.log('✅ Wallet connected, redirecting to dashboard...')
      
      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      alert("Failed to connect wallet. Please make sure MetaMask is installed and unlocked.")
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch(role) {
      case 'authority': return '🏢'
      case 'bank': return '🏦'
      case 'farmer': return '🌾'
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch(role) {
      case 'authority': return t('Warehouse Authority')
      case 'bank': return t('Bank/Lender')
      case 'farmer': return t('Farmer')
    }
  }

  return (
    <div className={cn("flex flex-col gap-8", className)} {...props}>
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">{t('Agri-Wallet Access')}</h2>
        <p className="text-white/70 text-sm">
          {step === 'role-selection' && `👤 ${t('Step 1: Select your role')}`}
          {step === 'wallet-connect' && `🦊 ${t('Step 2: Connect wallet as')} ${getRoleLabel(selectedRole)}`}
        </p>
      </div>

      {/* STEP 1: ROLE SELECTION */}
      {step === 'role-selection' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-white/90 text-sm font-semibold">{t('Choose How You Want to Login')}</label>
            <div className="grid grid-cols-1 gap-4">
              {(['farmer', 'authority', 'bank'] as UserRole[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelection(role)}
                  className="h-20 rounded-2xl border-2 bg-white/5 border-white/20 hover:bg-white/20 hover:border-white hover:scale-105 transition-all flex items-center gap-4 px-6"
                >
                  <span className="text-4xl">{getRoleIcon(role)}</span>
                  <div className="text-left">
                    <div className="text-white text-lg font-bold">{getRoleLabel(role)}</div>
                    <div className="text-white/60 text-xs">
                      {role === 'farmer' && t('Manage crops, trade tokens, get loans')}
                      {role === 'authority' && t('Inspect crops, issue eNWR tokens')}
                      {role === 'bank' && t('Offer loans, manage pledged assets')}
                    </div>
                  </div>
                  <span className="ml-auto text-white text-2xl">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: WALLET CONNECTION */}
      {step === 'wallet-connect' && !isConnected && (
        <div className="space-y-4">
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <div className="text-center space-y-3">
              <div className="text-5xl">{getRoleIcon(selectedRole)}</div>
              <div className="text-white font-bold text-xl">{getRoleLabel(selectedRole)}</div>
              <div className="text-white/70 text-sm">{t('Connect your wallet to continue')}</div>
            </div>
          </div>

          <Button 
            onClick={handleConnectWallet}
            disabled={isLoading}
            className="w-full h-14 bg-white text-[#074d2f] hover:bg-white/90 text-lg font-bold rounded-2xl shadow-xl transition-all active:scale-[0.98]"
          >
            {isLoading ? `⏳ ${t('Connecting...')}` : `🦊 ${t('Connect MetaMask & Enter Dashboard')}`}
          </Button>
          
          <button
            onClick={() => setStep('role-selection')}
            className="w-full text-white/60 hover:text-white text-sm py-2"
          >
            ← {t('Change Role')}
          </button>

          <p className="text-white/60 text-xs text-center">
            {t('Make sure you\'re on')} <span className="font-semibold text-white">{t('Hoodi Testnet')}</span> (Chain ID: 560048)
          </p>
        </div>
      )}
    </div>
  )
}