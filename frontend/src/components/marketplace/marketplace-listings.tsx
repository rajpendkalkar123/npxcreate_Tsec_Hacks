"use client"

import { useWeb3 } from '@/lib/web3Provider'
import { useEffect, useState } from 'react'
import { formatEther, parseEther } from 'ethers'
import { createMarketplacePayment, submitDeliveryProof } from '@/lib/finternet'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Listing {
  listingId: bigint
  seller: string
  tokenId: bigint
  quantity: bigint
  pricePerKg: bigint
  isActive: boolean
  commodityName: string
}

export function MarketplaceListings() {
  const { contracts, address } = useWeb3()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [buyingId, setBuyingId] = useState<bigint | null>(null)

  useEffect(() => {
    fetchListings()
  }, [contracts])

  const fetchListings = async () => {
    if (!contracts.marketplace || !contracts.rangerToken) return

    try {
      const allListings: Listing[] = []
      
      for (let id = BigInt(1); id <= BigInt(50); id++) {
        try {
          const listing = await contracts.marketplace.getListing(id)
          
          if (listing.isActive) {
            const uri = await contracts.rangerToken.uri(listing.tokenId)
            const metadata = await fetch(uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')).then(r => r.json())
            const commodityName = metadata?.attributes?.find((a: any) => a.trait_type === 'Commodity Name')?.value || 'Unknown'

            allListings.push({
              listingId: id,
              seller: listing.seller,
              tokenId: listing.tokenId,
              quantity: listing.quantity,
              pricePerKg: listing.pricePerKg,
              isActive: listing.isActive,
              commodityName
            })
          }
        } catch {
          break
        }
      }

      setListings(allListings)
    } catch (error) {
      console.error('Failed to fetch listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBuy = async (listing: Listing) => {
    if (!contracts.marketplace) return

    try {
      setBuyingId(listing.listingId)

      const totalPrice = listing.quantity * listing.pricePerKg
      const usdAmount = (Number(formatEther(totalPrice)) * 2500).toFixed(2) // ETH to USD conversion

      // Create Finternet payment intent
      const paymentIntent = await createMarketplacePayment(
        usdAmount,
        'USD',
        {
          tokenId: listing.tokenId.toString(),
          listingId: listing.listingId.toString(),
          quantity: listing.quantity.toString(),
          seller: listing.seller,
          buyer: address
        }
      )

      // Open Finternet checkout
      if (paymentIntent.data.paymentUrl) {
        window.open(paymentIntent.data.paymentUrl, '_blank')
      }

      // Execute blockchain transaction
      const tx = await contracts.marketplace.buyToken(
        listing.listingId,
        listing.quantity,
        { value: totalPrice }
      )
      const receipt = await tx.wait()

      // Submit delivery proof to Finternet
      const proofHash = receipt.hash
      await submitDeliveryProof(
        paymentIntent.data.id,
        proofHash,
        `https://hoodi.etherscan.io/tx/${receipt.hash}`,
        address!
      )

      alert('Purchase successful! Payment processed via Finternet.')
      fetchListings()
    } catch (error) {
      console.error('Purchase failed:', error)
      alert('Transaction failed.')
    } finally {
      setBuyingId(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading marketplace...</div>
  }

  if (listings.length === 0) {
    return <div className="text-center py-12 bg-gray-50 rounded-lg">No active listings</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {listings.map((listing) => {
        const totalPrice = listing.quantity * listing.pricePerKg
        const isOwnListing = listing.seller.toLowerCase() === address?.toLowerCase()

        return (
          <Card key={listing.listingId.toString()}>
            <CardHeader>
              <CardTitle>{listing.commodityName}</CardTitle>
              <CardDescription>Token #{listing.tokenId.toString()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-semibold">{listing.quantity.toString()} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price/kg:</span>
                <span className="font-semibold">{formatEther(listing.pricePerKg)} ETH</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600">Total:</span>
                <span className="font-bold text-lg">{formatEther(totalPrice)} ETH</span>
              </div>
              {isOwnListing && (
                <Badge variant="secondary">Your Listing</Badge>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full"
                disabled={isOwnListing || buyingId === listing.listingId}
                onClick={() => handleBuy(listing)}
              >
                {buyingId === listing.listingId ? 'Processing...' : 
                 isOwnListing ? 'Your Listing' : 
                 'Buy Now (Finternet)'}
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
