// src/components/login-form.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useWeb3 } from "@/lib/web3Provider" // MetaMask Hook
import { usePrivy } from "@privy-io/react-auth" // Privy Hook

type UserRole = 'farmer' | 'bank' | 'authority'

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  // State
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>('farmer')
  const [step, setStep] = useState<'role-selection' | 'wallet-connect' | 'phone-input'>('role-selection')
  const [hasRedirected, setHasRedirected] = useState(false)
  const [allowAutoRedirect, setAllowAutoRedirect] = useState(false)
  
  // Hooks
  const router = useRouter()
  const { connectWallet, isConnected, address, setPrivyAuth } = useWeb3() 
  const { login: loginWithPrivy, authenticated, ready, user, logout: privyLogout } = usePrivy()

  // Force logout any existing Privy session on mount
  useEffect(() => {
    const isLoggingOut = localStorage.getItem('is_logging_out') === 'true'
    const hasExistingAuth = authenticated && ready
    
    // Always logout existing sessions when landing on login page
    if (hasExistingAuth) {
      privyLogout().then(() => {
        console.log('🔓 Cleared existing Privy session')
        localStorage.removeItem('is_logging_out')
        localStorage.removeItem('user_role_manual')
        setAllowAutoRedirect(false) // Prevent any auto-redirect
      })
    } else if (isLoggingOut) {
      localStorage.removeItem('is_logging_out')
    }
  }, [ready])

  // 1. PRIVY AUTO-REDIRECT (Only after explicit login)
  useEffect(() => {
    const hasRoleSelected = localStorage.getItem('user_role_manual')
    const justLoggedIn = localStorage.getItem('just_logged_in') === 'true'
    
    // Only redirect if user JUST logged in (not from restored session)
    if (ready && authenticated && user && !hasRedirected && hasRoleSelected && justLoggedIn) {
      // Store auth cookies
      document.cookie = "finternet_auth=true; path=/"
      
      // Get wallet address from Privy's embedded wallet
      const walletAddress = user.wallet?.address || user.id
      if (walletAddress) {
        document.cookie = `wallet_address=${walletAddress}; path=/`
        // Set Privy auth mode (no MetaMask popup needed)
        setPrivyAuth(walletAddress)
      }
      
      setSelectedRole(hasRoleSelected as UserRole)
      console.log('✅ Privy login successful, redirecting to dashboard')
      localStorage.removeItem('just_logged_in') // Clear flag
      setHasRedirected(true)
      router.push("/dashboard")
    }
  }, [ready, authenticated, router, user, setPrivyAuth, hasRedirected])

  // 2. HANDLERS
  const handleRoleSelection = (role: UserRole) => {
    setSelectedRole(role)
    localStorage.setItem('user_role_manual', role)
    localStorage.removeItem('is_logging_out')  // Clear logout flag when selecting new role
    setStep('wallet-connect')
  }

  // MetaMask Login
  const handleConnectWallet = async () => {
    try {
      setIsLoading(true)
      await connectWallet()
      setStep('phone-input') 
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      alert("Failed to connect wallet.")
    } finally {
      setIsLoading(false)
    }
  }

  // Privy Login (Triggers Email/Phone Modal)
  const handlePrivyLogin = () => {
    localStorage.setItem('just_logged_in', 'true') // Mark as explicit login
    loginWithPrivy()
  }

  // Manual Phone Entry (Only for MetaMask users)
  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isConnected) return
    if (phoneNumber.length < 10) {
      alert("Enter valid mobile number")
      return
    }
    document.cookie = "finternet_auth=true; path=/"
    router.push("/dashboard")
  }

  // Icons & Labels
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
          {step === 'wallet-connect' && `🔐 Step 2: Choose Login Method`}
          {step === 'phone-input' && `✅ Connected: ${address?.slice(0, 6)}...`}
        </p>
      </div>

      {/* STEP 1: ROLE SELECTION */}
      {step === 'role-selection' && (
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-white/90 text-sm font-semibold">Choose User Type</label>
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
                    <div className="text-white/60 text-xs">Login to access dashboard</div>
                  </div>
                  <span className="ml-auto text-white text-2xl">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: HYBRID LOGIN OPTIONS */}
      {step === 'wallet-connect' && !isConnected && !authenticated && (
        <div className="space-y-4">
          <div className="bg-white/10 rounded-2xl p-6 border border-white/20">
            <div className="text-center space-y-3">
              <div className="text-5xl">{getRoleIcon(selectedRole)}</div>
              <div className="text-white font-bold text-xl">{getRoleLabel(selectedRole)}</div>
              <div className="text-white/70 text-sm">Select how you want to connect</div>
            </div>
          </div>

          <div className="grid gap-4">
            {/* OPTION A: PRIVY (Email/Phone) */}
            <Button 
              onClick={handlePrivyLogin}
              disabled={!ready || isLoading}
              className="w-full h-16 bg-[#074d2f] text-white hover:bg-[#09633d] text-lg font-bold rounded-2xl shadow-xl transition-all active:scale-[0.98] border-2 border-white/10"
            >
              <span className="mr-2">📧</span> Login with Email or Phone
            </Button>

            <div className="relative flex items-center py-1">
               <div className="flex-grow border-t border-white/10"></div>
               <span className="flex-shrink mx-4 text-white/40 text-[10px] uppercase font-bold">OR</span>
               <div className="flex-grow border-t border-white/10"></div>
            </div>

            {/* OPTION B: METAMASK */}
            <Button 
              onClick={handleConnectWallet}
              disabled={isLoading}
              variant="outline"
              className="w-full h-14 border-white/20 bg-white/5 text-white hover:bg-white/10 text-lg font-semibold rounded-2xl backdrop-blur-sm"
            >
              <span className="mr-2">🦊</span> Connect MetaMask
            </Button>
          </div>
          
          <button
            onClick={() => setStep('role-selection')}
            className="w-full text-white/60 hover:text-white text-sm py-2"
          >
            ← Back to Role Selection
          </button>
        </div>
      )}

      {/* STEP 3: MANUAL PHONE (MetaMask Only) */}
      {isConnected && step === 'phone-input' && (
        <form onSubmit={handleManualLogin} className="space-y-6">
          <div className="bg-white/10 rounded-2xl p-4 border border-white/20">
             <div className="flex items-center gap-3">
              <span className="text-3xl">{getRoleIcon(selectedRole)}</span>
              <div>
                <div className="text-white font-semibold">Connected via MetaMask</div>
                <div className="text-white/70 text-sm">{address?.slice(0, 10)}...</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Input 
              type="tel" 
              placeholder="Confirm Mobile Number" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              className="h-14 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-green-400 rounded-2xl text-lg px-4"
            />
          </div>
          
          <Button type="submit" className="w-full h-14 bg-white text-[#074d2f] hover:bg-white/90 text-lg font-bold rounded-2xl">
            Verify & Enter Dashboard →
          </Button>
        </form>
      )}
    </div>
  )
}