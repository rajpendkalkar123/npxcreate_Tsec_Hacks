'use client'
import { useWeb3 } from '@/lib/web3Provider'
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import { createLoanRepayment, submitDeliveryProof } from '@/lib/finternet'

interface ActiveLoan {
  loanId: bigint
  bank: string
  tokenId: bigint
  collateralAmount: bigint
  loanAmount: bigint
  interestRate: bigint
  repaymentAmount: bigint
  startTime: bigint
  endTime: bigint
  commodityName: string
  daysRemaining: number
}

interface ActiveLoansProps {
  onRepaySuccess?: () => void
}

export function ActiveLoans({ onRepaySuccess }: ActiveLoansProps) {
  const { contracts, address, isConnected } = useWeb3()
  const [loans, setLoans] = useState<ActiveLoan[]>([])
  const [loading, setLoading] = useState(true)
  const [repaying, setRepaying] = useState<bigint | null>(null)

  useEffect(() => {
    if (!isConnected || !address || !contracts.lendingPool || !contracts.rangerToken) {
      setLoading(false)
      return
    }

    const fetchActiveLoans = async () => {
      try {
        setLoading(true)
        
        // Get LoanAccepted events - only offerId is indexed, so we fetch all and filter manually
        const filter = contracts.lendingPool!.filters.LoanAccepted()
        const events = await contracts.lendingPool!.queryFilter(filter)
        
        const loanData: ActiveLoan[] = []
        
        for (const event of events) {
          const loanId = (event as any).args?.[0] as bigint
          
          try {
            // Get loan details
            const loan = await contracts.lendingPool!.loans(loanId)
            
            // Only show active loans for this farmer
            if (!loan.isActive || loan.farmer.toLowerCase() !== address.toLowerCase()) continue
            
            // Get commodity name
            const uri = await contracts.rangerToken!.uri(loan.tokenId)
            const response = await fetch(uri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/'))
            const metadata = await response.json()
            
            const currentTime = Math.floor(Date.now() / 1000)
            const daysRemaining = Math.max(0, Math.floor((Number(loan.endTime) - currentTime) / 86400))
            
            loanData.push({
              loanId,
              bank: loan.bank,
              tokenId: loan.tokenId,
              collateralAmount: loan.collateralAmount,
              loanAmount: loan.loanAmount,
              interestRate: loan.interestRate,
              repaymentAmount: loan.repaymentAmount,
              startTime: loan.startTime,
              endTime: loan.endTime,
              commodityName: metadata.commodityType || 'Unknown',
              daysRemaining
            })
          } catch (err) {
            console.error('Error fetching loan details:', err)
          }
        }
        
        // Sort by end time (most urgent first)
        loanData.sort((a, b) => Number(a.endTime) - Number(b.endTime))
        setLoans(loanData)
      } catch (error) {
        console.error('Error fetching active loans:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActiveLoans()
  }, [contracts.lendingPool, contracts.rangerToken, address, isConnected])

  const handleRepayLoan = async (loan: ActiveLoan) => {
    if (!contracts.lendingPool || !address) return

    try {
      setRepaying(loan.loanId)
      
      // Create Finternet repayment
      const finternetResponse = await createLoanRepayment(
        ethers.formatEther(loan.repaymentAmount),
        loan.loanId.toString()
      )
      
      console.log('Finternet repayment created:', finternetResponse)
      
      // Open Finternet payment widget
      if (finternetResponse.data.paymentUrl) {
        window.open(finternetResponse.data.paymentUrl, '_blank')
        alert('Complete payment via Finternet, then confirm on blockchain...')
      }
      
      // Repay loan on blockchain
      const tx = await contracts.lendingPool!.repayLoan(loan.loanId, {
        value: loan.repaymentAmount
      })
      console.log('Repay loan tx:', tx.hash)
      
      await tx.wait()
      alert(`Loan repaid! Collateral released. Transaction: ${tx.hash}`)
      
      // Submit proof to Finternet
      if (finternetResponse.data.id) {
        await submitDeliveryProof(
          finternetResponse.data.id,
          tx.hash,
          'Loan repaid and collateral released',
          address
        )
      }
      
      if (onRepaySuccess) onRepaySuccess()
      
      // Refresh loans
      window.location.reload()
    } catch (error: any) {
      console.error('Error repaying loan:', error)
      alert(`Error: ${error.message || 'Failed to repay loan'}`)
    } finally {
      setRepaying(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Loading active loans...</p>
      </div>
    )
  }

  if (loans.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">No active loans</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Active Loans</h3>
      
      {loans.map((loan) => {
        const isOverdue = loan.daysRemaining === 0
        const interestPercent = Number(loan.interestRate) / 100
        
        return (
          <div key={loan.loanId.toString()} className={`bg-white rounded-lg shadow p-6 border-l-4 ${
            isOverdue ? 'border-red-500' : 'border-green-500'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Loan ID</p>
                <p className="font-semibold">#{loan.loanId.toString()}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                  isOverdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {isOverdue ? 'OVERDUE' : 'ACTIVE'}
                </span>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Commodity</p>
                <p className="font-semibold">{loan.commodityName}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Collateral Locked</p>
                <p className="font-semibold">{loan.collateralAmount.toString()} kg</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Loan Amount</p>
                <p className="font-semibold text-lg text-blue-600">
                  {ethers.formatEther(loan.loanAmount)} ETH
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Interest Rate</p>
                <p className="font-semibold">{interestPercent}%</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Total Repayment</p>
                <p className="font-semibold text-lg text-red-600">
                  {ethers.formatEther(loan.repaymentAmount)} ETH
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Days Remaining</p>
                <p className={`font-semibold text-lg ${isOverdue ? 'text-red-600' : 'text-green-600'}`}>
                  {loan.daysRemaining} days
                </p>
              </div>
              
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Lender (Bank)</p>
                <p className="font-mono text-xs">{loan.bank}</p>
              </div>
              
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="font-semibold">
                  {new Date(Number(loan.endTime) * 1000).toLocaleDateString()}
                </p>
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={() => handleRepayLoan(loan)}
                disabled={repaying === loan.loanId}
                className={`px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                  isOverdue 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {repaying === loan.loanId ? 'Processing...' : `Repay ${ethers.formatEther(loan.repaymentAmount)} ETH`}
              </button>
              
              {isOverdue && (
                <p className="text-red-600 text-sm mt-2">
                  ⚠️ This loan is overdue! Repay immediately to unlock collateral.
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
