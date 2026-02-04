"use client"
import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import data from "./data.json"
import { useWeb3 } from "@/lib/web3Provider"
import { CropInspectionForm } from "@/components/authority/crop-inspection-form"
import { AssetList } from "@/components/farmer/asset-list"
import { ListForSale } from "@/components/farmer/list-for-sale"
import { PledgeCollateral } from "@/components/farmer/pledge-collateral"
import { QRScanner } from "@/components/farmer/qr-scanner"
import { MarketplaceListings } from "@/components/marketplace/marketplace-listings"
import { PledgedTokens } from "@/components/bank/pledged-tokens"
import { OfferLoan } from "@/components/bank/offer-loan"
import { LoanOffers } from "@/components/farmer/loan-offers"
import { ActiveLoans } from "@/components/farmer/active-loans"

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { role, isConnected, address, disconnectWallet } = useWeb3()
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [selectedTokenForSale, setSelectedTokenForSale] = useState<bigint | null>(null)
  const [selectedTokenForLoan, setSelectedTokenForLoan] = useState<bigint | null>(null)
  const [selectedTokenData, setSelectedTokenData] = useState<any>(null)
  const [showLoans, setShowLoans] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleDisconnect = () => {
    disconnectWallet()
    document.cookie = "finternet_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC"
    router.push('/')
  }

  if (!mounted) return null

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Wallet Not Connected</h2>
          <p className="text-gray-600 mb-6">Please connect your MetaMask wallet to continue</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  // Show loading while detecting role
  if (!role) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">Detecting your role...</h2>
          <p className="text-gray-500 mt-2">Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
        </div>
      </div>
    )
  }

  // AUTHORITY VIEW
  if (role === 'authority') {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col p-6">
            <h1 className="text-3xl font-bold mb-6">Warehouse Authority Dashboard</h1>
            <CropInspectionForm />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // BANK VIEW
  if (role === 'bank') {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col p-6">
            <h1 className="text-3xl font-bold mb-6">Bank Dashboard</h1>
            {selectedTokenData ? (
              <OfferLoan
                {...selectedTokenData}
                onSuccess={() => setSelectedTokenData(null)}
                onCancel={() => setSelectedTokenData(null)}
              />
            ) : (
              <PledgedTokens onOfferLoan={(token) => setSelectedTokenData(token)} />
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  // FARMER VIEW (default)
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              
              <div className="px-4 lg:px-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">My eNWR Assets</h2>
                  <button
                    onClick={() => setShowLoans(!showLoans)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
                  >
                    {showLoans ? '📦 View Assets' : '💰 View Loans'}
                  </button>
                </div>
                
                {showLoans ? (
                  <div className="space-y-6">
                    <LoanOffers onAcceptSuccess={() => window.location.reload()} />
                    <ActiveLoans onRepaySuccess={() => window.location.reload()} />
                  </div>
                ) : showQRScanner ? (
                  <QRScanner
                    onScanSuccess={(data) => {
                      alert(`Scanned Token #${data.tokenId}`)
                      setShowQRScanner(false)
                    }}
                    onClose={() => setShowQRScanner(false)}
                  />
                ) : selectedTokenForSale ? (
                  <ListForSale
                    tokenId={selectedTokenForSale}
                    availableBalance={BigInt(1000)}
                    commodityName="Wheat"
                    onSuccess={() => setSelectedTokenForSale(null)}
                    onCancel={() => setSelectedTokenForSale(null)}
                  />
                ) : selectedTokenForLoan ? (
                  <PledgeCollateral
                    tokenId={selectedTokenForLoan}
                    availableBalance={BigInt(1000)}
                    commodityName="Wheat"
                    onSuccess={() => setSelectedTokenForLoan(null)}
                    onCancel={() => setSelectedTokenForLoan(null)}
                  />
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowQRScanner(true)}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700"
                    >
                      📷 Scan QR Code
                    </button>
                    <AssetList
                      onListForSale={setSelectedTokenForSale}
                      onPledgeForLoan={setSelectedTokenForLoan}
                    />
                  </div>
                )}
              </div>

              <div className="px-4 lg:px-6">
                <h2 className="text-2xl font-bold mb-4">Marketplace</h2>
                <MarketplaceListings />
              </div>

              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
