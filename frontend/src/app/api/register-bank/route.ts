import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || ''
const RPC_URL = 'https://ethereum-hoodi-rpc.publicnode.com'
const ROLE_REGISTRY_ADDRESS = '0x4D4826DF5ebe538E24dB6D51bD2f0ffD262cdc93'

const ROLE_REGISTRY_ABI = [
  "function registerBank(address bank, string memory name, string memory swiftCode) external",
  "function banks(address) view returns (bool isActive, string memory name, string memory swiftCode, uint256 registeredAt)"
]

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json()

    if (!address || !ethers.isAddress(address)) {
      return NextResponse.json({ error: 'Invalid address' }, { status: 400 })
    }

    // Check if admin private key is configured
    if (!ADMIN_PRIVATE_KEY || ADMIN_PRIVATE_KEY === '') {
      console.error('❌ ADMIN_PRIVATE_KEY not configured in .env.local')
      return NextResponse.json({ 
        error: 'Server configuration error: ADMIN_PRIVATE_KEY not set',
        hint: 'Add ADMIN_PRIVATE_KEY to .env.local file'
      }, { status: 500 })
    }

    // Connect with admin wallet
    const provider = new ethers.JsonRpcProvider(RPC_URL)
    const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider)
    const roleRegistry = new ethers.Contract(ROLE_REGISTRY_ADDRESS, ROLE_REGISTRY_ABI, adminWallet)

    // Check if already registered
    const bankInfo = await roleRegistry.banks(address)
    
    if (bankInfo.isActive) {
      console.log(`✅ ${address} already registered as bank`)
      return NextResponse.json({ 
        success: true, 
        message: 'Already registered as bank',
        alreadyRegistered: true,
        bankInfo: {
          name: bankInfo.name,
          swiftCode: bankInfo.swiftCode
        }
      })
    }

    // Register bank
    const bankName = `Auto-Registered Bank ${address.slice(0, 6)}`
    const swiftCode = `BANK${address.slice(2, 10).toUpperCase()}`

    console.log(`🏦 Registering bank: ${address}...`)
    const tx = await roleRegistry.registerBank(
      address,
      bankName,
      swiftCode
    )
    console.log(`⏳ Transaction sent: ${tx.hash}`)
    
    const receipt = await tx.wait()
    console.log(`✅ Bank registered in block ${receipt.blockNumber}`)

    return NextResponse.json({ 
      success: true, 
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      message: 'Bank registered successfully',
      alreadyRegistered: false,
      bankInfo: {
        name: bankName,
        swiftCode
      }
    })

  } catch (error: any) {
    console.error('❌ Failed to register bank:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to register bank',
      details: error.reason || error.code || 'Unknown error'
    }, { status: 500 })
  }
}
