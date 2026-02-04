'use client'
import { useWeb3 } from '@/lib/web3Provider'
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { createLoanDisbursement, submitDeliveryProof } from '@/lib/finternet'

interface LoanOffer {
  offerId: bigint
  bank: string
  tokenId: bigint
  collateralAmount: bigint
  loanAmount: bigint
  interestRate: bigint
  duration: bigint
  timestamp: bigint
  expiryTime: bigint
  commodityName: string
  status: 'pending' | 'accepted' | 'expired'
}

interface LoanOffersProps {
  onAcceptSuccess?: () => void
}

export function LoanOffers({ onAcceptSuccess }: LoanOffersProps) {
  const { contracts, address, isConnected } = useWeb3()
  const [offers, setOffers] = useState<LoanOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<bigint | null>(null)

  useEffect(() => {
    if (!isConnected || !address || !contracts.lendingPool || !contracts.rangerToken) {
      setLoading(false)
      return
    }

    const fetchOffers = async () => {
      try {
        setLoading(true)
        
        // Get LoanOffered events for this farmer (farmer is indexed parameter)
        const filter = contracts.lendingPool!.filters.LoanOffered(null, null, address)
        const events = await contracts.lendingPool!.queryFilter(filter)
        
        const offerData: LoanOffer[] = []
        
        for (const event of events) {
          const [offerId, bank, farmer, tokenId, collateralAmount, loanAmount, interestRate, duration, expiryTime] = (event as any).args
          
          // Check if loan still active
          try {
            const loan = await contracts.lendingPool!.loans(offerId)
            const isActive = loan.isActive
            
            // Get commodity name from token metadata
            const uri = await contracts.rangerToken!.uri(tokenId)
            const response = await fetch(uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/'))
            const metadata = await response.json()
            
            const currentTime = Math.floor(Date.now() / 1000)
            const status = !isActive ? 'accepted' : 
                         Number(expiryTime) < currentTime ? 'expired' : 'pending'
            
            offerData.push({
              offerId,
              bank,
              tokenId,
              collateralAmount,
              loanAmount,
              interestRate,
              duration,
              timestamp: event.blockNumber ? BigInt(event.blockNumber) : BigInt(0),
              expiryTime,
              commodityName: metadata.commodityType || 'Unknown',
              status
            })
          } catch (err) {
            console.error('Error fetching loan details:', err)
          }
        }
        
        // Sort by timestamp desc
        offerData.sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
        setOffers(offerData)
      } catch (error) {
        console.error('Error fetching loan offers:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOffers()
  }, [contracts.lendingPool, contracts.rangerToken, address, isConnected])

  const handleAcceptLoan = async (offer: LoanOffer) => {
    if (!contracts.lendingPool || !address) return

    try {
      setAccepting(offer.offerId)
      
      // Create Finternet payment widget to receive disbursement
      const finternetResponse = await createLoanDisbursement(
        ethers.formatEther(offer.loanAmount),
        address, // farmer bank account
        offer.offerId.toString()
      )
      
      console.log('Finternet disbursement created:', finternetResponse)
      
      // Open Finternet payment widget for bank to confirm
      if (finternetResponse.data.paymentUrl) {
        window.open(finternetResponse.data.paymentUrl, '_blank')
        alert('Bank will confirm disbursement via Finternet. Waiting for confirmation...')
      }
      
      // Accept loan on blockchain
      const tx = await contracts.lendingPool!.acceptLoan(offer.offerId)
      console.log('Accept loan tx:', tx.hash)
      
      await tx.wait()
      alert(`Loan accepted! Transaction: ${tx.hash}`)
      
      // Submit blockchain proof to Finternet
      if (finternetResponse.data.id) {
        await submitDeliveryProof(
          finternetResponse.data.id,
          tx.hash,
          'Loan accepted on blockchain',
          address
        )
      }
      
      if (onAcceptSuccess) onAcceptSuccess()
      
      // Refresh offers
      window.location.reload()
    } catch (error: any) {
      console.error('Error accepting loan:', error)
      alert(`Error: ${error.message || 'Failed to accept loan'}`)
    } finally {
      setAccepting(null)
    }
  }

  const calculateRepayment = (loanAmount: bigint, interestRate: bigint) => {
    const interest = (loanAmount * interestRate) / BigInt(10000)
    return loanAmount + interest
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Loading loan offers...</p>
      </div>
    )
  }

  if (offers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">No loan offers received yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Loan Offers</h3>
      
      {offers.map((offer) => {
        const repaymentAmount = calculateRepayment(offer.loanAmount, offer.interestRate)
        const interestPercent = Number(offer.interestRate) / 100
        
        return (
          <div key={offer.offerId.toString()} className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Offer ID</p>
                <p className="font-semibold">#{offer.offerId.toString()}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                  offer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  offer.status === 'accepted' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {offer.status.toUpperCase()}
                </span>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Commodity</p>
                <p className="font-semibold">{offer.commodityName}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Collateral</p>
                <p className="font-semibold">{offer.collateralAmount.toString()} kg</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Loan Amount</p>
                <p className="font-semibold text-lg text-green-600">
                  {ethers.formatEther(offer.loanAmount)} ETH
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Interest Rate</p>
                <p className="font-semibold">{interestPercent}%</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold">{offer.duration.toString()} days</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Total Repayment</p>
                <p className="font-semibold text-lg text-red-600">
                  {ethers.formatEther(repaymentAmount)} ETH
                </p>
              </div>
              
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Bank Address</p>
                <p className="font-mono text-xs">{offer.bank}</p>
              </div>
            </div>
            
            {offer.status === 'pending' && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleAcceptLoan(offer)}
                  disabled={accepting === offer.offerId}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {accepting === offer.offerId ? 'Accepting...' : 'Accept Loan'}
                </button>
                
                <button
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400"
                >
                  Reject
                </button>
              </div>
            )}
            
            {offer.status === 'accepted' && (
              <div className="mt-4">
                <p className="text-green-600 font-semibold">✓ Loan accepted and disbursed</p>
              </div>
            )}
            
            {offer.status === 'expired' && (
              <div className="mt-4">
                <p className="text-red-600 font-semibold">⨯ Offer expired</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
