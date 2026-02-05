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
 * Create Payment Intent for Marketplace Purchase (DVP Escrow)
 */
export async function createMarketplacePayment(
  amount: string,
  currency: string = 'USD',
  metadata?: any
): Promise<PaymentIntentResponse> {
  const payload = {
    amount,
    currency,
    type: 'DELIVERY_VS_PAYMENT',
    settlementMethod: 'OFF_RAMP_MOCK',
    settlementDestination: 'bank_account_farmer',
    description: `Marketplace purchase - Token #${metadata?.tokenId || 'Unknown'}`,
    metadata: {
      releaseType: 'AUTO_RELEASE',
      deliveryPeriod: '24h',
      autoRelease: true,
      ...metadata
    }
  }
  
  console.log('📤 Sending to Finternet API:', payload)
  
  const response = await finternetClient.post('/payment-intents', payload)
  
  console.log('📥 Finternet response:', response.data)
  
  return response.data
}

/**
 * Create Payment Intent for Loan Disbursement
 */
export async function createLoanDisbursement(
  amount: string,
  farmerBankAccount: string,
  loanId: string
): Promise<PaymentIntentResponse> {
  const response = await finternetClient.post('/payment-intents', {
    amount,
    currency: 'USD',
    type: 'CONSENTED_PULL',
    settlementMethod: 'OFF_RAMP_TO_RTP',
    settlementDestination: farmerBankAccount,
    description: `Loan disbursement - ${loanId}`,
    metadata: {
      loanId,
      purpose: 'AGRICULTURAL_LOAN'
    }
  })
  return response.data
}

/**
 * Create Payment Intent for Loan Repayment
 */
export async function createLoanRepayment(
  amount: string,
  loanId: string
): Promise<PaymentIntentResponse> {
  const response = await finternetClient.post('/payment-intents', {
    amount,
    currency: 'USD',
    type: 'CONSENTED_PULL',
    description: `Loan repayment - ${loanId}`,
    metadata: {
      loanId,
      purpose: 'LOAN_REPAYMENT'
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
 * Submit Delivery Proof (Note: May not be available on test API)
 */
export async function submitDeliveryProof(
  intentId: string,
  proofHash: string,
  proofURI: string,
  submittedBy: string
) {
  try {
    const response = await finternetClient.post(
      `/payment-intents/${intentId}/escrow/delivery-proof`,
      {
        proofHash,
        proofURI,
        submittedBy
      }
    )
    return response.data
  } catch (error: any) {
    // Endpoint may not exist on test API - log but don't throw
    console.warn('Delivery proof endpoint not available:', error.message)
    throw error // Re-throw so caller can handle
  }
}

export default finternetClient