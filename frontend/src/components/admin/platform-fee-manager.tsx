"use client"

import { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import LendingPoolABI from "@/lib/abis/LendingPool.json"
import MarketplaceABI from "@/lib/abis/Marketplace.json"
import { CONTRACT_ADDRESSES } from "@/lib/contracts"

export function PlatformFeeManager() {
  const [lendingFees, setLendingFees] = useState<string>("0")
  const [marketplaceFees, setMarketplaceFees] = useState<string>("0")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const getProvider = () => {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed")
    }
    return new ethers.BrowserProvider(window.ethereum)
  }

  const loadFees = async () => {
    try {
      const provider = getProvider()
      
      const lendingPool = new ethers.Contract(CONTRACT_ADDRESSES.LendingPool, LendingPoolABI.abi, provider)
      const marketplace = new ethers.Contract(CONTRACT_ADDRESSES.Marketplace, MarketplaceABI.abi, provider)

      const lendingCollected = await lendingPool.collectedFees()
      const marketplaceCollected = await marketplace.collectedFees()

      setLendingFees(ethers.formatEther(lendingCollected))
      setMarketplaceFees(ethers.formatEther(marketplaceCollected))
    } catch (error: any) {
      console.error("Failed to load fees:", error)
    }
  }

  useEffect(() => {
    loadFees()
    const interval = setInterval(loadFees, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const withdrawLendingFees = async () => {
    try {
      setIsLoading(true)
      setMessage(null)

      const provider = getProvider()
      const signer = await provider.getSigner()
      const lendingPool = new ethers.Contract(CONTRACT_ADDRESSES.LendingPool, LendingPoolABI.abi, signer)

      console.log("Withdrawing lending fees...")
      const tx = await lendingPool.withdrawPlatformFees()
      
      setMessage({ type: "success", text: "Transaction sent! Waiting for confirmation..." })
      
      await tx.wait()
      
      setMessage({ type: "success", text: `✅ Successfully withdrew ${lendingFees} ETH from LendingPool!` })
      await loadFees() // Refresh fees
    } catch (error: any) {
      console.error("Failed to withdraw lending fees:", error)
      setMessage({ 
        type: "error", 
        text: error.reason || error.message || "Failed to withdraw fees" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const withdrawMarketplaceFees = async () => {
    try {
      setIsLoading(true)
      setMessage(null)

      const provider = getProvider()
      const signer = await provider.getSigner()
      const marketplace = new ethers.Contract(CONTRACT_ADDRESSES.Marketplace, MarketplaceABI.abi, signer)

      console.log("Withdrawing marketplace fees...")
      const tx = await marketplace.withdrawPlatformFees()
      
      setMessage({ type: "success", text: "Transaction sent! Waiting for confirmation..." })
      
      await tx.wait()
      
      setMessage({ type: "success", text: `✅ Successfully withdrew ${marketplaceFees} ETH from Marketplace!` })
      await loadFees() // Refresh fees
    } catch (error: any) {
      console.error("Failed to withdraw marketplace fees:", error)
      setMessage({ 
        type: "error", 
        text: error.reason || error.message || "Failed to withdraw fees" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const withdrawAllFees = async () => {
    try {
      setIsLoading(true)
      setMessage(null)

      const provider = getProvider()
      const signer = await provider.getSigner()
      
      const lendingPool = new ethers.Contract(CONTRACT_ADDRESSES.LendingPool, LendingPoolABI.abi, signer)
      const marketplace = new ethers.Contract(CONTRACT_ADDRESSES.Marketplace, MarketplaceABI.abi, signer)

      setMessage({ type: "success", text: "Withdrawing from both contracts..." })

      // Withdraw from lending pool if there are fees
      if (parseFloat(lendingFees) > 0) {
        const tx1 = await lendingPool.withdrawPlatformFees()
        await tx1.wait()
      }

      // Withdraw from marketplace if there are fees
      if (parseFloat(marketplaceFees) > 0) {
        const tx2 = await marketplace.withdrawPlatformFees()
        await tx2.wait()
      }

      const totalWithdrawn = (parseFloat(lendingFees) + parseFloat(marketplaceFees)).toFixed(4)
      setMessage({ type: "success", text: `✅ Successfully withdrew ${totalWithdrawn} ETH total!` })
      await loadFees()
    } catch (error: any) {
      console.error("Failed to withdraw all fees:", error)
      setMessage({ 
        type: "error", 
        text: error.reason || error.message || "Failed to withdraw fees" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const totalFees = (parseFloat(lendingFees) + parseFloat(marketplaceFees)).toFixed(4)

  return (
    <div className="space-y-6">
      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === "success" 
            ? "bg-green-50 border-green-200 text-green-800" 
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {message.text}
        </div>
      )}

      {/* Fee Overview */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <span className="text-3xl">💰</span>
            Platform Revenue Dashboard
          </CardTitle>
          <CardDescription className="text-green-700">
            Collected fees from lending interest and marketplace trades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Lending Pool Fees */}
            <div className="bg-white p-6 rounded-xl border border-green-200 shadow-sm">
              <div className="text-sm text-gray-600 mb-2">Lending Pool Fees</div>
              <div className="text-3xl font-bold text-green-600 mb-1">{lendingFees} ETH</div>
              <div className="text-xs text-gray-500">5% of interest earned</div>
            </div>

            {/* Marketplace Fees */}
            <div className="bg-white p-6 rounded-xl border border-green-200 shadow-sm">
              <div className="text-sm text-gray-600 mb-2">Marketplace Fees</div>
              <div className="text-3xl font-bold text-blue-600 mb-1">{marketplaceFees} ETH</div>
              <div className="text-xs text-gray-500">2.5% of sale price</div>
            </div>

            {/* Total */}
            <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-6 rounded-xl border border-green-700 shadow-lg text-white">
              <div className="text-sm opacity-90 mb-2">Total Available</div>
              <div className="text-3xl font-bold mb-1">{totalFees} ETH</div>
              <div className="text-xs opacity-80">Ready to withdraw</div>
            </div>
          </div>

          {/* Withdrawal Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-green-200">
            <Button 
              onClick={withdrawLendingFees}
              disabled={isLoading || parseFloat(lendingFees) === 0}
              variant="outline"
              className="h-14"
            >
              Withdraw Lending Fees
            </Button>
            <Button 
              onClick={withdrawMarketplaceFees}
              disabled={isLoading || parseFloat(marketplaceFees) === 0}
              variant="outline"
              className="h-14"
            >
              Withdraw Marketplace Fees
            </Button>
            <Button 
              onClick={withdrawAllFees}
              disabled={isLoading || parseFloat(totalFees) === 0}
              className="h-14 bg-green-600 hover:bg-green-700 text-white font-bold"
            >
              {isLoading ? "Processing..." : "Withdraw All Fees"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900 text-lg">💸 Revenue Streams</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-800">
            <p>• <strong>Lending:</strong> 5% of interest paid by borrowers</p>
            <p>• <strong>Marketplace:</strong> 2.5% of each trade</p>
            <p>• <strong>Permissionless:</strong> Anyone can lend/trade</p>
            <p>• <strong>Automatic:</strong> Fees collected on every transaction</p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-900 text-lg">ℹ️ Important Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-amber-800">
            <p>• Only the platform admin can withdraw fees</p>
            <p>• Fees are locked in smart contracts until withdrawn</p>
            <p>• All transactions are transparent on blockchain</p>
            <p>• View on <a href={`https://hoodi.etherscan.io/address/${CONTRACT_ADDRESSES.LendingPool}`} target="_blank" rel="noopener noreferrer" className="underline font-semibold">Hoodi Explorer</a></p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

