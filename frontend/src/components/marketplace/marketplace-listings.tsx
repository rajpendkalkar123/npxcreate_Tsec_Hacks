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

export function MarketplaceListings({ refreshKey }: { refreshKey?: number }) {
  const { contracts, address } = useWeb3()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [buyingId, setBuyingId] = useState<bigint | null>(null)

  useEffect(() => {
    fetchListings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey])

  // Fetch when contracts first become available
  useEffect(() => {
    if (contracts.marketplace && contracts.rangerToken) {
      fetchListings()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contracts.marketplace, contracts.rangerToken])

  const fetchListings = async () => {
    if (!contracts.marketplace || !contracts.rangerToken) return

    try {
      setLoading(true)
      const allListings: Listing[] = []
      
      // Check listings sequentially - don't break on inactive listings
      for (let id = BigInt(1); id <= BigInt(50); id++) {
        try {
          const listing = await contracts.marketplace.getListing(id)
          
          if (listing.isActive) {
            try {
              // ✅ ADDITIONAL CHECK: Verify seller still has the tokens
              const sellerBalance = await contracts.rangerToken.balanceOf(listing.seller, listing.tokenId)
              
              // Only show listing if seller actually has enough tokens
              if (sellerBalance >= listing.quantity) {
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
              } else {
                console.log(`⚠️ Listing #${id} is active but seller has insufficient balance (${sellerBalance} < ${listing.quantity})`)
              }
            } catch (metadataError) {
              console.log(`⚠️ Failed to fetch metadata for listing #${id}`)
              // Continue to next listing even if metadata fails
            }
          }
        } catch (listingError) {
          // Listing doesn't exist - stop searching
          console.log(`ℹ️ Reached end of listings at #${id}`)
          break
        }
      }

      // ✅ DEDUPLICATE: Remove duplicate listings for same token+seller combination
      // Keep only the most recent listing (highest listingId) for each token+seller pair
      const uniqueListings = new Map<string, Listing>()
      
      for (const listing of allListings) {
        const key = `${listing.seller.toLowerCase()}-${listing.tokenId.toString()}`
        const existing = uniqueListings.get(key)
        
        // Keep the listing with the highest ID (most recent)
        if (!existing || listing.listingId > existing.listingId) {
          if (existing) {
            console.log(`🔄 Replacing duplicate: Listing #${existing.listingId} with #${listing.listingId} (same seller+token)`)
          }
          uniqueListings.set(key, listing)
        } else {
          console.log(`⚠️ Skipping duplicate: Listing #${listing.listingId} (already have #${existing.listingId})`)
        }
      }
      
      const finalListings = Array.from(uniqueListings.values())
      console.log(`✅ Loaded ${allListings.length} active listings, ${finalListings.length} unique after deduplication`)
      setListings(finalListings)
    } catch (error) {
      console.error('Failed to fetch listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBuy = async (listing: Listing) => {
    if (!contracts.marketplace || !address) return

    // Check if trying to buy own listing
    if (listing.seller.toLowerCase() === address.toLowerCase()) {
      alert('⚠️ You cannot buy your own listing!')
      return
    }

    try {
      setBuyingId(listing.listingId)

      console.log('🔍 Checking listing details...')
      console.log('Listing ID:', listing.listingId.toString())
      console.log('Buyer address:', address)
      
      // Check if listing is still active
      const currentListing = await contracts.marketplace.getListing(listing.listingId)
      console.log('Current listing state:', {
        seller: currentListing.seller,
        tokenId: currentListing.tokenId.toString(),
        quantity: currentListing.quantity.toString(),
        pricePerKg: currentListing.pricePerKg.toString(),
        isActive: currentListing.isActive
      })
      
      if (!currentListing.isActive) {
        alert('⚠️ This listing is no longer active. It may have been sold already.')
        fetchListings() // Refresh the list
        setBuyingId(null)
        return
      }

      const totalPrice = listing.quantity * listing.pricePerKg
      const ethAmount = formatEther(totalPrice)
      
      // Check buyer's ETH balance
      const balance = await window.ethereum.request({ 
        method: 'eth_getBalance', 
        params: [address, 'latest'] 
      })
      const balanceInEth = formatEther(BigInt(balance))
      
      console.log('💰 Purchase details:', {
        totalPrice: ethAmount + ' ETH',
        buyerBalance: balanceInEth + ' ETH',
        hasEnoughBalance: Number(balanceInEth) >= Number(ethAmount)
      })
      
      if (Number(balanceInEth) < Number(ethAmount)) {
        alert(`⚠️ Insufficient ETH balance!\n\nRequired: ${ethAmount} ETH\nYour balance: ${balanceInEth} ETH\n\nPlease add ETH to your wallet.`)
        setBuyingId(null)
        return
      }
      
      const usdAmount = (Number(ethAmount) * 2500).toFixed(2) // ETH to USD conversion

      console.log('💰 Creating Finternet payment:', {
        ethAmount,
        usdAmount,
        tokenId: listing.tokenId.toString(),
        listingId: listing.listingId.toString()
      })

      // Create Finternet payment intent
      const paymentIntent = await createMarketplacePayment(
        usdAmount,
        'USD',
        {
          tokenId: listing.tokenId.toString(),
          listingId: listing.listingId.toString(),
          quantity: listing.quantity.toString(),
          seller: listing.seller,
          buyer: address,
          ethPrice: ethAmount
        }
      )

      console.log('✅ Payment intent created:', paymentIntent.data.id)

      // Open Finternet checkout in new window
      if (paymentIntent.data.paymentUrl) {
        const paymentWindow = window.open(paymentIntent.data.paymentUrl, '_blank', 'width=600,height=800')
        
        // Show user message
        alert(`✅ Finternet Payment Initiated!\n\nAmount: $${usdAmount} USD (${ethAmount} ETH)\nPayment ID: ${paymentIntent.data.id}\n\nPlease complete payment in the new window.\n\nNote: In production, blockchain transfer would happen automatically after payment confirmation.\n\nFor demo: Click OK to execute blockchain transaction now.`)
      }

      // Execute blockchain transaction
      console.log('🔗 Executing blockchain transaction...')
      console.log('Calling buyToken with:', {
        listingId: listing.listingId.toString(),
        quantity: listing.quantity.toString(),
        value: ethAmount + ' ETH'
      })
      
      const tx = await contracts.marketplace.buyToken(
        listing.listingId,
        listing.quantity,
        { value: totalPrice }
      )
      
      console.log('⏳ Waiting for confirmation...')
      const receipt = await tx.wait()
      console.log('✅ Blockchain tx confirmed:', receipt.hash)

      // Try to submit delivery proof (may fail on test API)
      try {
        await submitDeliveryProof(
          paymentIntent.data.id,
          receipt.hash,
          `https://hoodi.etherscan.io/tx/${receipt.hash}`,
          address!
        )
        console.log('✅ Delivery proof submitted')
      } catch (proofError) {
        console.log('⚠️  Delivery proof endpoint not available (expected on test API)')
        // This is fine - the test API doesn't support this endpoint
      }

      alert(`🎉 Purchase Successful!\n\nToken #${listing.tokenId} transferred!\nTransaction: ${receipt.hash}\n\nFinternet Payment: ${paymentIntent.data.id}\n\nRefreshing page to update balances...`)
      
      // Refresh the page to update all balances
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error: any) {
      console.error('❌ Purchase failed:', error)
      
      if (error.reason === 'Listing not active') {
        alert('⚠️ This listing is no longer active. It may have been sold already.\n\nRefreshing marketplace...')
        fetchListings()
      } else if (error.code === 'ACTION_REJECTED') {
        alert('❌ Transaction cancelled by user.')
      } else if (error.code === 'INSUFFICIENT_FUNDS') {
        alert('❌ Insufficient ETH balance for this purchase.')
      } else if (error.message.includes('missing revert data')) {
        alert(`❌ Transaction failed - the smart contract reverted.\n\nPossible reasons:\n• Listing already sold\n• Insufficient ETH balance\n• Contract paused\n\nCheck browser console for details.`)
        fetchListings()
      } else {
        alert(`❌ Transaction failed: ${error.reason || error.message || 'Unknown error'}\n\nCheck browser console for details.`)
      }
    } finally {
      setBuyingId(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading marketplace...</div>
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <p className="text-gray-600 mb-4">No active listings</p>
        <Button onClick={fetchListings} variant="outline">
          🔄 Refresh Marketplace
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600">{listings.length} active listing{listings.length !== 1 ? 's' : ''}</p>
        <Button onClick={fetchListings} variant="outline" size="sm" disabled={loading}>
          🔄 Refresh
        </Button>
      </div>
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
    </div>
  )
}
