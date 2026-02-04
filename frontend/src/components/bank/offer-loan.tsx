"use client"

import { useState } from 'react'
import { useWeb3 } from '@/lib/web3Provider'
import { parseEther } from 'ethers'
import { createLoanDisbursement } from '@/lib/finternet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface OfferLoanProps {
  tokenId: bigint
  farmer: string
  collateralAmount: bigint
  commodityName: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function OfferLoan({ tokenId, farmer, collateralAmount, commodityName, onSuccess, onCancel }: OfferLoanProps) {
  const { contracts } = useWeb3()
  const [loanAmount, setLoanAmount] = useState('')
  const [interestRate, setInterestRate] = useState('500') // 5%
  const [duration, setDuration] = useState('90') // days
  const [loading, setLoading] = useState(false)

  const handleOffer = async () => {
    if (!contracts.lendingPool) return

    try {
      setLoading(true)

      const durationSeconds = BigInt(Number(duration) * 24 * 60 * 60)
      
      // Offer loan on blockchain
      const tx = await contracts.lendingPool.offerLoan(
        farmer,
        tokenId,
        collateralAmount,
        parseEther(loanAmount),
        BigInt(interestRate),
        durationSeconds
      )
      const receipt = await tx.wait()

      // Create Finternet payment intent for disbursement
      const usdAmount = (Number(loanAmount) * 2500).toFixed(2) // ETH to USD
      await createLoanDisbursement(
        usdAmount,
        farmer, // farmer's bank account (placeholder)
        receipt.hash
      )

      alert('Loan offered! Farmer will receive notification.')
      onSuccess?.()
    } catch (error) {
      console.error('Offer failed:', error)
      alert('Transaction failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Offer Loan for {commodityName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-3 rounded space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Collateral:</span>
            <span className="font-semibold">{collateralAmount.toString()} kg</span>
          </div>
          <div className="flex justify-between">
            <span>Farmer:</span>
            <span className="font-mono">{farmer.slice(0, 10)}...</span>
          </div>
        </div>

        <div>
          <Label>Loan Amount (ETH)</Label>
          <Input
            type="number"
            placeholder="10"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            step="0.1"
          />
        </div>

        <div>
          <Label>Interest Rate (basis points)</Label>
          <Input
            type="number"
            placeholder="500"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">500 = 5%, 1000 = 10%</p>
        </div>

        <div>
          <Label>Duration (days)</Label>
          <Input
            type="number"
            placeholder="90"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>

        {loanAmount && interestRate && (
          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm font-semibold">Repayment Amount</p>
            <p className="text-xl font-bold text-blue-600">
              {(Number(loanAmount) * (1 + Number(interestRate) / 10000)).toFixed(4)} ETH
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleOffer} disabled={loading || !loanAmount} className="flex-1">
            {loading ? 'Offering...' : 'Offer Loan (Finternet)'}
          </Button>
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
