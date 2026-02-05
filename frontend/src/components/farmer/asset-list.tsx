"use client"

import { useWeb3 } from '@/lib/web3Provider'
import { useEffect, useState } from 'react'
import { fetchIPFSMetadata } from '@/lib/ipfs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface TokenData {
  tokenId: bigint
  balance: bigint
  metadataUri: string
  metadata: any
  isValid: boolean
  isPledged: boolean
  pledgeAmount: bigint
}

interface AssetListProps {
  onListForSale?: (tokenId: bigint) => void
  onPledgeForLoan?: (tokenId: bigint) => void
}

export function AssetList({ onListForSale, onPledgeForLoan }: AssetListProps) {
  const { contracts, address } = useWeb3()
  const [tokens, setTokens] = useState<TokenData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchTokens = async () => {
    if (!contracts.rangerToken || !address) return

    try {
      setLoading(true)
      const ownedTokens: TokenData[] = []

      for (let tokenId = BigInt(1); tokenId <= BigInt(100); tokenId++) {
        try {
          const balance = await contracts.rangerToken.balanceOf(address, tokenId)

          if (balance > BigInt(0)) {
            const [uri, isValid, pledgeStatus] = await Promise.all([
              contracts.rangerToken.uri(tokenId),
              contracts.rangerToken.isValid(tokenId),
              contracts.rangerToken.getPledgeStatus(tokenId, address)
            ])

            // Fetch metadata with fallback
            let metadata = null
            try {
              metadata = await fetchIPFSMetadata(uri)
            } catch (metadataError) {
              console.warn(`⚠️ Failed to fetch metadata for token #${tokenId}, using fallback`)
              // Create fallback metadata
              metadata = {
                name: `eNWR Token #${tokenId}`,
                attributes: [
                  { trait_type: 'Commodity Name', value: 'Unknown' },
                  { trait_type: 'Receipt Number', value: tokenId.toString() }
                ]
              }
            }

            ownedTokens.push({
              tokenId,
              balance,
              metadataUri: uri,
              metadata,
              isValid,
              isPledged: pledgeStatus[0],
              pledgeAmount: pledgeStatus[2]
            })
          }
        } catch (tokenError) {
          // Token doesn't exist, stop searching
          break
        }
      }

      console.log(`✅ Found ${ownedTokens.length} tokens owned by ${address}`)
      setTokens(ownedTokens)
    } catch (error) {
      console.error('Failed to fetch tokens:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTokens()
  }, [contracts, address, refreshKey])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your assets...</p>
      </div>
    )
  }

  if (tokens.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600 mb-4">No eNWR tokens found</p>
        <p className="text-sm text-gray-500 mb-4">Deposit commodities at warehouse to receive tokens</p>
        <Button onClick={() => setRefreshKey(k => k + 1)} variant="outline" size="sm">
          🔄 Refresh
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600">{tokens.length} token{tokens.length !== 1 ? 's' : ''} found</p>
        <Button onClick={() => setRefreshKey(k => k + 1)} variant="outline" size="sm" disabled={loading}>
          🔄 Refresh Assets
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tokens.map((token) => {
        const commodityName = token.metadata?.attributes?.find((a: any) => a.trait_type === 'Commodity Name')?.value || 'Unknown'
        const receiptNumber = token.metadata?.attributes?.find((a: any) => a.trait_type === 'Receipt Number')?.value
        const availableBalance = token.balance - token.pledgeAmount

        return (
          <Card key={token.tokenId.toString()} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{commodityName}</CardTitle>
              <CardDescription>Receipt #{receiptNumber}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Balance:</span>
                <span className="font-semibold">{token.balance.toString()} kg</span>
              </div>
              {token.isPledged && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pledged:</span>
                  <span className="font-semibold text-orange-600">{token.pledgeAmount.toString()} kg</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available:</span>
                <span className="font-semibold text-green-600">{availableBalance.toString()} kg</span>
              </div>
              <div className="flex gap-2 flex-wrap mt-3">
                <Badge variant={token.isValid ? "outline" : "destructive"}>
                  {token.isValid ? '✓ Valid' : 'Expired'}
                </Badge>
                {token.isPledged && (
                  <Badge variant="secondary">Pledged</Badge>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button 
                size="sm"
                className="flex-1"
                disabled={!token.isValid || availableBalance === BigInt(0)}
                onClick={() => onListForSale?.(token.tokenId)}
              >
                Sell
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="flex-1"
                disabled={!token.isValid || availableBalance === BigInt(0)}
                onClick={() => onPledgeForLoan?.(token.tokenId)}
              >
                Get Loan
              </Button>
            </CardFooter>
          </Card>
        )
      })}
      </div>
    </div>
  )
}
