"use client"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useWeb3 } from "@/lib/web3Provider"
import { useRouter } from "next/navigation"

export function SiteHeader() {
  const { address, role, disconnectWallet } = useWeb3()
  const router = useRouter()

  const handleDisconnect = () => {
    disconnectWallet()
    document.cookie = "finternet_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC"
    router.push('/')
  }

  const getRoleBadge = () => {
    switch(role) {
      case 'authority': return '🏢 Warehouse'
      case 'bank': return '🏦 Bank'
      case 'farmer': return '🌾 Farmer'
      default: return '👤 User'
    }
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="text-base font-medium">CropLock Dashboard</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm">
            <span className="font-semibold">{getRoleBadge()}</span>
            <span className="text-gray-500 ml-2">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDisconnect}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            Disconnect
          </Button>
        </div>
      </div>
    </header>
  )
}
