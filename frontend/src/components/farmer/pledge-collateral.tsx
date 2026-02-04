"use client"

import { useState, useEffect } from 'react'
import { useWeb3 } from '@/lib/web3Provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface PledgeCollateralProps {
  tokenId: bigint
  availableBalance: bigint
  commodityName: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function PledgeCollateral({ tokenId, availableBalance, commodityName, onSuccess, onCancel }: PledgeCollateralProps) {
  const { contracts } = useWeb3()
  const [banks, setBanks] = useState<string[]>([])
  const [selectedBank, setSelectedBank] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchBanks = async () => {
      if (!contracts.roleRegistry) return
      const bankList = await contracts.roleRegistry.getAllBanks()
      setBanks(bankList)
    }
    fetchBanks()
  }, [contracts])

  const handlePledge = async () => {
    if (!contracts.rangerToken) return

    try {
      setLoading(true)
      const tx = await contracts.rangerToken.pledgeCollateral(
        tokenId,
        BigInt(amount),
        selectedBank
      )
      await tx.wait()
      alert('Collateral pledged! Banks can now offer loans.')
      onSuccess?.()
    } catch (error) {
      console.error('Pledge failed:', error)
      alert('Transaction failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Pledge {commodityName} as Collateral</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Select Bank</Label>
          <Select value={selectedBank} onValueChange={setSelectedBank}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a bank" />
            </SelectTrigger>
            <SelectContent>
              {banks.map(bank => (
                <SelectItem key={bank} value={bank}>
                  {bank.slice(0, 10)}...{bank.slice(-8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Amount to Pledge (kg)</Label>
          <Input
            type="number"
            placeholder="1000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            max={availableBalance.toString()}
          />
          <p className="text-xs text-gray-500 mt-1">Available: {availableBalance.toString()} kg</p>
        </div>

        <div className="bg-blue-50 p-3 rounded">
          <p className="text-sm text-blue-900">
            💡 Once pledged, you cannot sell this quantity until the loan is repaid.
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handlePledge} disabled={loading || !selectedBank || !amount} className="flex-1">
            {loading ? 'Pledging...' : 'Pledge Collateral'}
          </Button>
          <Button onClick={onCancel} variant="outline">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
