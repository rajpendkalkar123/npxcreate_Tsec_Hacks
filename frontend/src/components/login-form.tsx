// src/components/login-form.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWeb3 } from "@/lib/web3Provider"

type UserRole = 'farmer' | 'bank' | 'authority'

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer')
  const [step, setStep] = useState<'role-selection' | 'wallet-connect' | 'phone-input'>('role-selection')
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
      setStep('phone-input')
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      alert("Failed to connect wallet. Please make sure MetaMask is installed and unlocked.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected) {
      alert("Please connect your wallet first!")
      return
    }

    if (phoneNumber.length < 10) {
      alert("Please enter a valid 10-digit mobile number")
      return
    }
    
    // Store auth cookie
    document.cookie = "finternet_auth=true; path=/"
    
    // Redirect to dashboard
    router.push("/dashboard")
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
      case 'authority': return 'Warehouse Authority'
      case 'bank': return 'Bank/Lender'
      case 'farmer': return 'Farmer'
    }
  }

  return (
    <div className={cn("flex flex-col gap-8", className)} {...props}>
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">Agri-Wallet Access</h2>
        <p className="text-white/70 text-sm">
          {step === 'role-selection' && '👤 Step 1: Select your role'}
          {step === 'wallet-connect' && `🦊 Step 2: Connect wallet as ${getRoleLabel(selectedRole)}`}
          {step === 'phone-input' && `✅ Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}`}
        </p>
      </div>

      {/* STEP 1: ROLE SELECTION */}
      {step === 'role-selection' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-white/90 text-sm font-semibold">Choose How You Want to Login</label>
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
                      {role === 'farmer' && 'Manage crops, trade tokens, get loans'}
                      {role === 'authority' && 'Inspect crops, issue eNWR tokens'}
                      {role === 'bank' && 'Offer loans, manage pledged assets'}
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
              <div className="text-white/70 text-sm">Connect your wallet to continue</div>
            </div>
          </div>

          <Button 
            onClick={handleConnectWallet}
            disabled={isLoading}
            className="w-full h-14 bg-white text-[#074d2f] hover:bg-white/90 text-lg font-bold rounded-2xl shadow-xl transition-all active:scale-[0.98]"
          >
            {isLoading ? '⏳ Connecting...' : '🦊 Connect MetaMask Wallet'}
          </Button>
          
          <button
            onClick={() => setStep('role-selection')}
            className="w-full text-white/60 hover:text-white text-sm py-2"
          >
            ← Change Role
          </button>

          <p className="text-white/60 text-xs text-center">
            Make sure you're on <span className="font-semibold text-white">Hoodi Testnet</span> (Chain ID: 560048)
          </p>
        </div>
      )}

      {/* STEP 3: PHONE INPUT */}
      {isConnected && step === 'phone-input' && (
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Show selected role */}
          <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getRoleIcon(selectedRole)}</span>
              <div>
                <div className="text-white font-semibold">Logging in as</div>
                <div className="text-white/70 text-sm">{getRoleLabel(selectedRole)}</div>
              </div>
              <button
                type="button"
                onClick={() => setStep('role-selection')}
                className="ml-auto text-white/60 hover:text-white text-xs"
              >
                Change
              </button>
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Input 
              type="tel" 
              placeholder="Mobile Number (+91...)" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-green-400 focus:ring-green-400 rounded-2xl text-lg px-4 backdrop-blur-sm"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full h-14 bg-white text-[#074d2f] hover:bg-white/90 text-lg font-bold rounded-2xl shadow-xl transition-all active:scale-[0.98]"
            disabled={phoneNumber.length < 10}
          >
            Enter Dashboard →
          </Button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink mx-4 text-white/40 text-[10px] uppercase tracking-[0.2em] font-black">Or Join Us</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <Button variant="outline" type="button" className="w-full h-14 border-white/20 text-white hover:bg-white/10 font-bold rounded-2xl backdrop-blur-sm">
            Register as New User
          </Button>
        </form>
      )}
    </div>
  )
}