/**
 * 🏦 FINTERNET PAYMENT GATEWAY - INR Abstraction Layer
 * 
 * This module handles all payment operations through the Finternet payment rail.
 * 
 * KEY ARCHITECTURE:
 * 1. Users only see and interact with INR (₹)
 * 2. Backend automatically converts INR ↔ USD for blockchain settlements
 * 3. All crypto operations (gas fees, wallet management) are abstracted away
 * 4. Supports:
 *    - Marketplace purchases (Delivery vs Payment escrow)
 *    - Loan disbursements (to bank accounts)
 *    - Loan repayments (auto-deducted)
 * 
 * USER FLOW:
 * Privy Login (Email) → Dashboard → Pay in INR → Finternet Gateway → Blockchain Settlement
 * 
 * No MetaMask or crypto knowledge required for end users!
 */

import axios from 'axios'

const FINTERNET_API_URL = 'https://api.fmm.finternetlab.io/api/v1'
const FINTERNET_API_KEY = 'sk_hackathon_1011cf064fd64b1e5c5472ce06d55ebf'

export const finternetClient = axios.create({
  baseURL: FINTERNET_API_URL,
  headers: {
    'X-API-Key': FINTERNET_API_KEY,
    'Content-Type': 'application/json'
  }
})

export interface PaymentIntentResponse {
  object: 'payment_intent'
  data: {
    id: string
    status: 'INITIATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
    amount: string
    currency: string
    type: 'DELIVERY_VS_PAYMENT' | 'CONSENTED_PULL'
    contractAddress: string
    paymentUrl: string
    metadata?: any
  }
}

/**
 * 💰 INR to Crypto conversion (Hidden from user)
 * Exchange rate: 1 USD ≈ 83 INR (approximate)
 */
export function convertINRtoUSD(amountINR: number): string {
  const USD_TO_INR = 83
  const amountUSD = amountINR / USD_TO_INR
  return amountUSD.toFixed(2)
}

export function convertUSDtoINR(amountUSD: number): number {
  const USD_TO_INR = 83
  return Math.round(amountUSD * USD_TO_INR)
}

/**
 * Create Payment Intent for Marketplace Purchase (DVP Escrow)
 * User sees INR, backend handles crypto via Finternet
 */
export async function createMarketplacePayment(
  amountINR: number,  // User input in INR
  metadata?: any
): Promise<PaymentIntentResponse> {
  const amountUSD = convertINRtoUSD(amountINR)
  
  const response = await finternetClient.post('/payment-intents', {
    amount: amountUSD,
    currency: 'USD',  // Finternet gateway handles USD
    type: 'DELIVERY_VS_PAYMENT',
    settlementMethod: 'OFF_RAMP_MOCK',
    settlementDestination: 'bank_account_farmer',
    description: `Marketplace purchase ₹${amountINR.toLocaleString('en-IN')} - Token #${metadata?.tokenId || 'Unknown'}`,
    metadata: {
      releaseType: 'AUTO_RELEASE',
      deliveryPeriod: '24h',
      autoRelease: true,
      amountINR,  // Store original INR amount
      ...metadata
    }
  })
  return response.data
}

/**
 * Create Payment Intent for Loan Disbursement (INR input)
 */
export async function createLoanDisbursement(
  amountINR: number,
  farmerBankAccount: string,
  loanId: string
): Promise<PaymentIntentResponse> {
  const amountUSD = convertINRtoUSD(amountINR)
  
  const response = await finternetClient.post('/payment-intents', {
    amount: amountUSD,
    currency: 'USD',
    type: 'CONSENTED_PULL',
    settlementMethod: 'OFF_RAMP_TO_RTP',
    settlementDestination: farmerBankAccount,
    description: `Loan disbursement ₹${amountINR.toLocaleString('en-IN')} - ${loanId}`,
    metadata: {
      loanId,
      purpose: 'AGRICULTURAL_LOAN',
      amountINR
    }
  })
  return response.data
}

/**
 * Create Payment Intent for Loan Repayment (INR input)
 */
export async function createLoanRepayment(
  amountINR: number,
  loanId: string
): Promise<PaymentIntentResponse> {
  const amountUSD = convertINRtoUSD(amountINR)
  
  const response = await finternetClient.post('/payment-intents', {
    amount: amountUSD,
    currency: 'USD',
    type: 'CONSENTED_PULL',
    description: `Loan repayment ₹${amountINR.toLocaleString('en-IN')} - ${loanId}`,
    metadata: {
      loanId,
      purpose: 'LOAN_REPAYMENT',
      amountINR
    }
  })
  return response.data
}

/**
 * Get Escrow Details
 */
export async function getEscrowDetails(intentId: string) {
  const response = await finternetClient.get(`/payment-intents/${intentId}/escrow`)
  return response.data
}

/**
 * Submit Delivery Proof
 */
export async function submitDeliveryProof(
  intentId: string,
  proofHash: string,
  proofURI: string,
  submittedBy: string
) {
  const response = await finternetClient.post(
    `/payment-intents/${intentId}/escrow/delivery-proof`,
    {
      proofHash,
      proofURI,
      submittedBy
    }
  )
  return response.data
}

export default finternetClient