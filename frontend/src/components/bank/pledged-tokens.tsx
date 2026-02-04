"use client"

import { useWeb3 } from '@/lib/web3Provider'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface PledgedToken {
  tokenId: bigint
  farmer: string
  amount: bigint
  commodityName: string
}

interface PledgedTokensProps {
  onOfferLoan?: (token: PledgedToken) => void
}

export function PledgedTokens({ onOfferLoan }: PledgedTokensProps) {
  const { contracts, address } = useWeb3()
  const [pledgedTokens, setPledgedTokens] = useState<PledgedToken[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPledgedTokens()
  }, [contracts, address])

  const fetchPledgedTokens = async () => {
    if (!contracts.rangerToken || !address) return

    try {
      const filter = contracts.rangerToken.filters.CollateralPledged(null, null, address)
      const events = await contracts.rangerToken.queryFilter(filter)

      const tokens: PledgedToken[] = []
      for (const event of events) {
        const args = (event as any).args
        if (args) {
          const uri = await contracts.rangerToken.uri(args.tokenId)
          const metadata = await fetch(uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')).then(r => r.json())
          const commodityName = metadata?.attributes?.find((a: any) => a.trait_type === 'Commodity Name')?.value || 'Unknown'

          tokens.push({
            tokenId: args.tokenId,
            farmer: args.farmer,
            amount: args.amount,
            commodityName
          })
        }
      }

      setPledgedTokens(tokens)
    } catch (error) {
      console.error('Failed to fetch pledged tokens:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading pledged assets...</div>
  }

  if (pledgedTokens.length === 0) {
    return <div className="text-center py-12 bg-gray-50 rounded-lg">No pledged collateral</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {pledgedTokens.map((token, idx) => (
        <Card key={idx}>
          <CardHeader>
            <CardTitle>{token.commodityName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Token ID:</span>
              <span className="font-mono">#{token.tokenId.toString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Farmer:</span>
              <span className="font-mono">{token.farmer.slice(0, 10)}...</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pledged Amount:</span>
              <span className="font-semibold">{token.amount.toString()} kg</span>
            </div>
            <Button onClick={() => onOfferLoan?.(token)} className="w-full mt-4">
              Offer Loan
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
