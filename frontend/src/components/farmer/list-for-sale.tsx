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
      await listTx.wait()

      alert('Listed successfully! Buyers can now purchase your commodity.')
      onSuccess?.()
    } catch (error) {
      console.error('Listing failed:', error)
      alert('Transaction failed. Please try again.')
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
