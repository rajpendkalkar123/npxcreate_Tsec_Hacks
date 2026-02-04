// src/components/login-form.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const [phoneNumber, setPhoneNumber] = useState("")
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    document.cookie = "finternet_auth=true; path=/"
    if (phoneNumber.length >= 10) {
      router.push("/dashboard")
    }
  }

  return (
    <div className={cn("flex flex-col gap-8", className)} {...props}>
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-white tracking-tight">Agri-Wallet Access</h2>
        <p className="text-white/70 text-sm">
          Enter your mobile number to manage your tokenized assets.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
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
        
        <Button type="submit" className="w-full h-14 bg-white text-[#074d2f] hover:bg-white/90 text-lg font-bold rounded-2xl shadow-xl transition-all active:scale-[0.98]">
          Login to CropLock
        </Button>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-4 text-white/40 text-[10px] uppercase tracking-[0.2em] font-black">Or Join Us</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <Button variant="outline" type="button" className="w-full h-14 border-white/20 text-white hover:bg-white/10 font-bold rounded-2xl backdrop-blur-sm">
          Register as New Farmer
        </Button>
      </form>
    </div>
  )
}