import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'

const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || ''
const RPC_URL = 'https://ethereum-hoodi-rpc.publicnode.com'
const ROLE_REGISTRY_ADDRESS = '0x4D4826DF5ebe538E24dB6D51bD2f0ffD262cdc93'

const ROLE_REGISTRY_ABI = [
  "function registerWarehouse(address warehouse, string memory name, string memory location, string memory licenseNumber) external",
  "function warehouses(address) view returns (bool isActive, string memory name, string memory location, string memory licenseNumber, uint256 registeredAt)"
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
    const warehouseInfo = await roleRegistry.warehouses(address)
    
    if (warehouseInfo.isActive) {
      console.log(`✅ ${address} already registered as warehouse`)
      return NextResponse.json({ 
        success: true, 
        message: 'Already registered as warehouse',
        alreadyRegistered: true,
        warehouseInfo: {
          name: warehouseInfo.name,
          location: warehouseInfo.location,
          licenseNumber: warehouseInfo.licenseNumber
        }
      })
    }

    // Register warehouse
    const warehouseName = `Auto-Registered Warehouse ${address.slice(0, 6)}`
    const location = "Mumbai Central Warehouse"
    const licenseNumber = `WH-${address.slice(2, 10).toUpperCase()}`

    console.log(`🏢 Registering warehouse: ${address}...`)
    const tx = await roleRegistry.registerWarehouse(
      address,
      warehouseName,
      location,
      licenseNumber
    )
    console.log(`⏳ Transaction sent: ${tx.hash}`)
    
    const receipt = await tx.wait()
    console.log(`✅ Warehouse registered in block ${receipt.blockNumber}`)

    return NextResponse.json({ 
      success: true, 
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      message: 'Warehouse registered successfully',
      alreadyRegistered: false,
      warehouseInfo: {
        name: warehouseName,
        location,
        licenseNumber
      }
    })

  } catch (error: any) {
    console.error('❌ Failed to register warehouse:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to register warehouse',
      details: error.reason || error.code || 'Unknown error'
    }, { status: 500 })
  }
}
