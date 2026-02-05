import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || ''
const RPC_URL = 'https://ethereum-hoodi-rpc.publicnode.com'
const RANGER_TOKEN_ADDRESS = '0x6f2BABe73a29295d9650525bBcFF98A585b55E5b'

const RANGER_TOKEN_ABI = [
  "function grantRole(bytes32 role, address account) external",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function MINTER_ROLE() view returns (bytes32)"
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
    const rangerToken = new ethers.Contract(RANGER_TOKEN_ADDRESS, RANGER_TOKEN_ABI, adminWallet)

    // Get MINTER_ROLE hash
    const MINTER_ROLE = await rangerToken.MINTER_ROLE()
    
    // Check if already has role
    const hasRole = await rangerToken.hasRole(MINTER_ROLE, address)

    if (hasRole) {
      console.log(`✅ ${address} already has MINTER_ROLE`)
      return NextResponse.json({ 
        success: true, 
        message: 'Already has MINTER_ROLE',
        alreadyGranted: true
      })
    }

    // Grant role
    console.log(`🔑 Granting MINTER_ROLE to ${address}...`)
    const tx = await rangerToken.grantRole(MINTER_ROLE, address)
    console.log(`⏳ Transaction sent: ${tx.hash}`)
    
    const receipt = await tx.wait()
    console.log(`✅ MINTER_ROLE granted in block ${receipt.blockNumber}`)

    return NextResponse.json({ 
      success: true, 
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      message: 'MINTER_ROLE granted successfully',
      alreadyGranted: false
    })

  } catch (error: any) {
    console.error('❌ Failed to grant MINTER_ROLE:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to grant role',
      details: error.reason || error.code || 'Unknown error'
    }, { status: 500 })
  }
}
