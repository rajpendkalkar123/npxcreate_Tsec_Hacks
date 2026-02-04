import axios from 'axios'
import { PINATA_CONFIG } from './contracts'

export interface WDRAMetadata {
  receiptNumber: string
  wdraRegNo: string
  depositorAccountNo: string
  commodityName: string
  qualityGrade: string
  numberOfPackages: number
  quantity: number
  marketValue: string
  stackLotNumber: string
  warehouseLocation: string
  insurancePolicyNo: string
  insuranceCompany: string
  insuranceValidFrom: string
  insuranceValidTo: string
  storageRate: string
  handlingRate: string
  issuedDate: string
  validUntil: string
  depositorName: string
  warehousemanName: string
  imageUrl?: string
}

export async function uploadJsonToPinata(
  metadata: any,
  name: string = 'metadata.json'
): Promise<{ ipfsHash: string; ipfsUrl: string }> {
  try {
    // Check if Pinata credentials are configured
    if (!PINATA_CONFIG.jwt || PINATA_CONFIG.jwt === '') {
      console.warn('⚠️ Pinata JWT not configured. Using mock IPFS hash for development.')
      const mockHash = 'Qm' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      return {
        ipfsHash: mockHash,
        ipfsUrl: `ipfs://${mockHash}`
      }
    }

    const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'

    const body = {
      pinataContent: metadata,
      pinataMetadata: { name }
    }

    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PINATA_CONFIG.jwt}`
      }
    })

    const ipfsHash = response.data.IpfsHash
    console.log('✅ Uploaded to IPFS:', ipfsHash)
    return {
      ipfsHash,
      ipfsUrl: `ipfs://${ipfsHash}`
    }
  } catch (error) {
    console.error('❌ Pinata upload error:', error)
    // Return mock data for development if Pinata fails
    const mockHash = 'Qm' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    console.warn('⚠️ Using mock IPFS hash:', mockHash)
    return {
      ipfsHash: mockHash,
      ipfsUrl: `ipfs://${mockHash}`
    }
  }
}

export function createWDRAMetadata(receiptData: WDRAMetadata) {
  return {
    name: `eNWR - ${receiptData.commodityName} Receipt #${receiptData.receiptNumber}`,
    description: `WDRA-compliant Electronic Negotiable Warehouse Receipt for ${receiptData.quantity}kg of ${receiptData.commodityName}`,
    image: receiptData.imageUrl || `ipfs://QmPlaceholder/warehouse_${receiptData.commodityName.toLowerCase()}.jpg`,
    external_url: `https://croplock.example.com/receipt/${receiptData.receiptNumber}`,
    attributes: [
      { trait_type: "Receipt Number", value: receiptData.receiptNumber },
      { trait_type: "WDRA Registration No", value: receiptData.wdraRegNo },
      { trait_type: "Depositor Account No", value: receiptData.depositorAccountNo },
      { trait_type: "Commodity Name", value: receiptData.commodityName },
      { trait_type: "Quality/Grade", value: receiptData.qualityGrade },
      { trait_type: "No. of Packages", value: receiptData.numberOfPackages },
      { trait_type: "Quantity (kg)", value: receiptData.quantity },
      { trait_type: "Market Value at Deposit", value: receiptData.marketValue },
      { trait_type: "Stack/Lot Number", value: receiptData.stackLotNumber },
      { trait_type: "Warehouse Location", value: receiptData.warehouseLocation },
      { trait_type: "Insurance Policy No", value: receiptData.insurancePolicyNo },
      { trait_type: "Insurance Company", value: receiptData.insuranceCompany },
      { trait_type: "Insurance Valid From", value: receiptData.insuranceValidFrom },
      { trait_type: "Insurance Valid To", value: receiptData.insuranceValidTo },
      { trait_type: "Storage Rate", value: receiptData.storageRate },
      { trait_type: "Handling Rate", value: receiptData.handlingRate },
      { trait_type: "Receipt Issued Date", value: receiptData.issuedDate },
      { trait_type: "Valid Until", value: receiptData.validUntil },
      { trait_type: "Depositor Name", value: receiptData.depositorName },
      { trait_type: "Warehouseman Name", value: receiptData.warehousemanName }
    ]
  }
}

export async function fetchIPFSMetadata(ipfsUrl: string): Promise<any> {
  const hash = ipfsUrl.replace('ipfs://', '')
  const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${hash}`
  
  try {
    const response = await axios.get(gatewayUrl)
    return response.data
  } catch (error) {
    console.error('Failed to fetch IPFS metadata:', error)
    return null
  }
}
