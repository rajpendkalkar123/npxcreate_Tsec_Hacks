// src/app/page.tsx
"use client"

import { LoginForm } from "@/components/login-form"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#074d2f] p-6 lg:p-12 relative overflow-hidden">
      {/* Decorative background element for texture (optional) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0a633d] rounded-full blur-[120px] opacity-50" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#0a633d] rounded-full blur-[120px] opacity-50" />

      <div className="z-10 flex w-full max-w-6xl flex-col lg:flex-row items-center gap-12 lg:gap-24">
        {/* Left Side: Branding and Text */}
        <div className="flex-1 text-white text-center lg:text-left">
          <div className="mb-8 flex items-center justify-center lg:justify-start gap-3">
            <div className="size-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xl">
              <span className="text-white font-black text-2xl">C</span>
            </div>
            <span className="text-3xl font-bold tracking-tighter">CropLock</span>
          </div>
          
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl mb-8 leading-[1.1]">
            Tokenize. <span className="text-green-300">Secure.</span> <br />
            Grow.
          </h1>
          
          <p className="text-xl text-white/80 mb-12 leading-relaxed max-w-lg mx-auto lg:mx-0">
            Digitizing agricultural value chains through <span className="text-white font-semibold underline decoration-green-400">eWR tokenization</span>. Unlock instant liquidity for your harvest with our self-custody wallet.
          </p>

          <div className="grid grid-cols-2 gap-8 border-t border-white/10 pt-10 text-left">
            <div className="space-y-2">
              <h3 className="font-bold text-green-300 text-lg">Digital Receipts</h3>
              <p className="text-sm text-white/60">Convert physical warehouse receipts into digital assets.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-green-300 text-lg">Direct Liquidity</h3>
              <p className="text-sm text-white/60">Instant capital access via Finternet blockchain protocols.</p>
            </div>
          </div>
        </div>

        {/* Right Side: The White Glassmorphism Login Form */}
        <div className="w-full max-w-md relative">
          {/* Subtle outer glow */}
          <div className="absolute -inset-0.5 bg-white/10 rounded-[2.5rem] blur opacity-30" />
          
          <div className="relative bg-white/15 backdrop-blur-2xl border border-white/25 p-10 rounded-[2.5rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}