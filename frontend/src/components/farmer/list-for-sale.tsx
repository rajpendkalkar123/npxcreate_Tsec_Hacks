"use client"

import { useState } from 'react'
import { useWeb3 } from '@/lib/web3Provider'
import { parseEther } from 'ethers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface ListForSaleProps {
  tokenId: bigint
  availableBalance: bigint
  commodityName: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ListForSale({ tokenId, availableBalance, commodityName, onSuccess, onCancel }: ListForSaleProps) {
  const { contracts, address } = useWeb3()
  const [quantity, setQuantity] = useState('')
  const [pricePerKg, setPricePerKg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleList = async () => {
    if (!contracts.marketplace || !contracts.rangerToken || !address) return

    try {
      setLoading(true)

      // Check pledge status first
      const pledgeStatus = await contracts.rangerToken.getPledgeStatus(tokenId, address)
      const isPledged = pledgeStatus[0]
      const pledgedAmount = pledgeStatus[2]
      const actualAvailableBalance = availableBalance - pledgedAmount

      console.log('📊 Token status:', {
        totalBalance: availableBalance.toString(),
        isPledged,
        pledgedAmount: pledgedAmount.toString(),
        availableToSell: actualAvailableBalance.toString(),
        tryingToSell: quantity
      })

      if (isPledged && BigInt(quantity) > actualAvailableBalance) {
        alert(`⚠️ Insufficient unpledged balance!\n\nTotal balance: ${availableBalance} kg\nPledged as loan collateral: ${pledgedAmount} kg\nAvailable to sell: ${actualAvailableBalance} kg\n\nYou're trying to sell: ${quantity} kg\n\nPlease reduce the quantity or repay your loan first.`)
        setLoading(false)
        return
      }

      if (actualAvailableBalance === BigInt(0)) {
        alert(`⚠️ Cannot list this token!\n\nAll ${availableBalance} kg are pledged as loan collateral.\n\nPlease repay your loan to unlock these tokens.`)
        setLoading(false)
        return
      }

      // ✅ NEW: Check if this token is already listed
      console.log('🔍 Checking for existing listings...')
      let alreadyListed = false
      for (let listingId = 1; listingId <= 50; listingId++) {
        try {
          const listing = await contracts.marketplace.getListing(BigInt(listingId))
          
          // Check if this seller already has an active listing for this token
          if (
            listing.isActive && 
            listing.seller.toLowerCase() === address.toLowerCase() && 
            listing.tokenId === tokenId
          ) {
            alreadyListed = true
            console.log(`⚠️ Found existing listing #${listingId} for this token`)
            break
          }
        } catch {
          // Listing doesn't exist, stop checking
          break
        }
      }
      
      if (alreadyListed) {
        alert(`⚠️ You already have an active listing for this token!\n\nPlease cancel your existing listing first, or wait for it to be purchased.\n\nNote: You cannot create multiple listings for the same token.`)
        setLoading(false)
        return
      }

      // Step 1: Approve marketplace
      const marketplaceAddress = await contracts.marketplace.getAddress()
      const isApproved = await contracts.rangerToken.isApprovedForAll(
        address,
        marketplaceAddress
      )

      if (!isApproved) {
        const approveTx = await contracts.rangerToken.setApprovalForAll(
          marketplaceAddress,
          true
        )
        await approveTx.wait()
      }

      // Step 2: Create listing
      const listTx = await contracts.marketplace.listForSale(
        tokenId,
        BigInt(quantity),
        parseEther(pricePerKg)
      )
      const receipt = await listTx.wait()

      console.log('✅ Listed successfully! Transaction:', receipt.hash)
      alert(`✅ Listed successfully!\n\nYour token is now on the marketplace.\nTransaction: ${receipt.hash}\n\nRefreshing to update your balance...`)
      
      // Call success callback THEN refresh page
      onSuccess?.()
      
      // Force page reload to update all balances
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      console.error('Listing failed:', error)
      
      if (error.reason === 'Insufficient unpledged balance') {
        alert(`❌ Listing failed: Insufficient unpledged balance\n\nThis token is pledged as loan collateral.\nYou can only sell the unpledged portion.\n\nPlease reduce the quantity or repay your loan.`)
      } else {
        alert(`❌ Transaction failed: ${error.reason || error.message || 'Unknown error'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>List {commodityName} for Sale</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Quantity to Sell (kg)</Label>
          <Input
            type="number"
            placeholder="1000"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            max={availableBalance.toString()}
          />
          <p className="text-xs text-gray-500 mt-1">Available: {availableBalance.toString()} kg</p>
        </div>

        <div>
          <Label>Price per kg (ETH)</Label>
          <Input
            type="number"
            placeholder="0.001"
            value={pricePerKg}
            onChange={(e) => setPricePerKg(e.target.value)}
            step="0.001"
          />
        </div>

        {quantity && pricePerKg && (
          <div className="bg-green-50 p-3 rounded">
            <p className="text-sm font-semibold">Total Price</p>
            <p className="text-2xl font-bold text-green-600">
              {(Number(quantity) * Number(pricePerKg)).toFixed(4)} ETH
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleList} disabled={loading || !quantity || !pricePerKg} className="flex-1">
            {loading ? 'Listing...' : 'List for Sale'}
          </Button>
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
