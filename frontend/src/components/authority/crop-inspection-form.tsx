"use client"

import { useState } from 'react'
import { useWeb3 } from '@/lib/web3Provider'
import { uploadJsonToPinata, createWDRAMetadata } from '@/lib/ipfs'
import QRCode from 'qrcode'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import Image from 'next/image'

export function CropInspectionForm() {
  const { contracts, address } = useWeb3()
  const [loading, setLoading] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [tokenId, setTokenId] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(false)

  // Form state
  const [farmerAddress, setFarmerAddress] = useState('')
  const [commodityName, setCommodityName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [qualityGrade, setQualityGrade] = useState('FAQ')
  const [moistureContent, setMoistureContent] = useState('')
  const [purityPercentage, setPurityPercentage] = useState('99')
  const [damagePercentage, setDamagePercentage] = useState('0')
  const [numberOfPackages, setNumberOfPackages] = useState('')
  const [stackLocation, setStackLocation] = useState('')
  const [insurancePolicyNo, setInsurancePolicyNo] = useState('')

  const handleDemoMode = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      const mockTokenId = Math.floor(Math.random() * 10000).toString()
      const qrData = JSON.stringify({
        tokenId: mockTokenId,
        farmerAddress: farmerAddress || '0x0000000000000000000000000000000000000000',
        quantity: quantity || '1000',
        commodityName: commodityName || 'Wheat',
        ipfsUri: 'ipfs://QmDemo123456789',
        timestamp: Date.now(),
        demo: true
      })

      const qrUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: { dark: '#16a34a', light: '#ffffff' }
      })

      setTokenId(mockTokenId)
      setQrCodeUrl(qrUrl)
    } catch (error) {
      console.error('Demo mode error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInspectionComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Use demo mode if enabled
    if (demoMode) {
      return handleDemoMode(e)
    }

    if (!contracts.rangerToken) {
      alert('Please connect wallet first or enable Demo Mode')
      return
    }

    try {
      setLoading(true)

      // Validate farmer address
      if (!farmerAddress.startsWith('0x') || farmerAddress.length !== 42) {
        alert('Please enter a valid Ethereum address for the farmer')
        setLoading(false)
        return
      }

      const receiptNumber = `WB/${address?.slice(2, 8).toUpperCase()}/${Date.now()}`
      const marketValue = Number(quantity) * 50

      const metadata = createWDRAMetadata({
        receiptNumber,
        wdraRegNo: "WDRA-MH-2023-123",
        depositorAccountNo: `FAR-${farmerAddress.slice(2, 10)}`,
        commodityName,
        qualityGrade,
        numberOfPackages: Number(numberOfPackages),
        quantity: Number(quantity),
        marketValue: `₹${marketValue.toLocaleString('en-IN')}`,
        stackLotNumber: stackLocation,
        warehouseLocation: "Mumbai Central Warehouse",
        insurancePolicyNo: insurancePolicyNo || `INS-${Date.now()}`,
        insuranceCompany: "National Insurance Co.",
        insuranceValidFrom: new Date().toISOString().split('T')[0],
        insuranceValidTo: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
        storageRate: "₹2.00/kg/month",
        handlingRate: "₹0.50/kg",
        issuedDate: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
        depositorName: farmerAddress,
        warehousemanName: address || ''
      })

      console.log('📤 Uploading metadata to IPFS...')
      const { ipfsUrl } = await uploadJsonToPinata(metadata, `receipt_${receiptNumber}.json`)
      console.log('✅ IPFS URL:', ipfsUrl)

      const expiryTimestamp = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60)
      
      console.log('📝 Issuing eNWR token on blockchain...')
      console.log('Parameters:', {
        to: farmerAddress,
        quantity: quantity,
        expiry: expiryTimestamp,
        uri: ipfsUrl,
        issuer: address
      })

      // Check if wallet has MINTER_ROLE before attempting
      try {
        const MINTER_ROLE = '0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6'
        const hasRole = await contracts.rangerToken.hasRole(MINTER_ROLE, address)
        console.log(`Has MINTER_ROLE: ${hasRole}`)
        
        if (!hasRole) {
          alert(`❌ Authorization Error: Your wallet ${address} does not have MINTER_ROLE.\n\nPlease contact admin or enable Demo Mode.`)
          setLoading(false)
          return
        }
      } catch (roleCheckError) {
        console.error('Role check failed:', roleCheckError)
      }

      const tx = await contracts.rangerToken.issueReceipt(
        farmerAddress,
        BigInt(quantity),
        BigInt(expiryTimestamp),
        ipfsUrl
      )
      
      console.log('⏳ Waiting for transaction confirmation...')
      const receipt = await tx.wait()
      console.log('✅ Transaction confirmed:', receipt.hash)

      const event = receipt?.logs.find((log: any) => {
        try {
          const parsed = contracts.rangerToken?.interface.parseLog(log)
          return parsed?.name === 'ReceiptIssued'
        } catch {
          return false
        }
      })

      let issuedTokenId = '1'
      if (event && contracts.rangerToken) {
        const parsed = contracts.rangerToken.interface.parseLog(event)
        issuedTokenId = parsed?.args?.tokenId?.toString() || '1'
      }

      console.log('🎫 Token ID:', issuedTokenId)

      const qrData = JSON.stringify({
        tokenId: issuedTokenId,
        farmerAddress,
        quantity,
        commodityName,
        ipfsUri: ipfsUrl,
        timestamp: Date.now()
      })

      const qrUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: { dark: '#16a34a', light: '#ffffff' }
      })

      setTokenId(issuedTokenId)
      setQrCodeUrl(qrUrl)
    } catch (error: any) {
      console.error('❌ Issuance failed:', error)
      
      // Better error messages
      if (error.code === 'CALL_EXCEPTION') {
        if (error.reason === 'Insufficient balance') {
          alert(`⚠️ Unexpected Error: "Insufficient balance"\n\nThis shouldn't happen during minting. Possible causes:\n1. The contract might be checking a balance incorrectly\n2. Try with a smaller quantity first\n3. Use Demo Mode to test the UI\n\nCurrent quantity: ${quantity} kg\nWallet: ${address}`)
        } else if (error.data && error.data.includes('e2517d3f')) {
          alert('⚠️ Authorization Error: Your wallet address does not have MINTER_ROLE.\n\nTo fix this:\n1. Open terminal in Blockchain folder\n2. Run: npx hardhat console --network hoodi\n3. Execute:\n   const RangerToken = await ethers.getContractAt("RangerToken", "0x6f2BABe73a29295d9650525bBcFF98A585b55E5b")\n   await RangerToken.grantRole(ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE")), "' + address + '")\n\nOr login with the deployer wallet.')
        } else if (error.reason) {
          alert(`Smart contract error: ${error.reason}\n\nPlease enable Demo Mode or check contract configuration.`)
        } else {
          alert('Smart contract call failed. Check that:\n- Farmer address is valid\n- You have MINTER_ROLE\n- Contract is deployed correctly\n\nTry enabling Demo Mode.')
        }
      } else {
        alert('Failed to issue eNWR. See console for details.\n\nTry enabling Demo Mode.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (qrCodeUrl) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-green-600">✅ eNWR Issued Successfully</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600">Token ID: <strong>#{tokenId}</strong></p>
          <div className="bg-white p-4 rounded-lg shadow-inner">
            <img src={qrCodeUrl} alt="Token QR Code" className="mx-auto w-[300px] h-[300px]" />
          </div>
          <p className="text-sm text-gray-700">Ask farmer to scan this QR code in their app</p>
          <Button 
            onClick={() => {
              setQrCodeUrl(null)
              setTokenId(null)
              setFarmerAddress('')
              setQuantity('')
              setCommodityName('')
            }}
            className="w-full"
          >
            Issue Another Receipt
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleInspectionComplete} className="max-w-2xl mx-auto space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Crop Inspection & eNWR Issuance</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Demo Mode</label>
          <button
            type="button"
            onClick={() => setDemoMode(!demoMode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              demoMode ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                demoMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {demoMode && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Demo Mode Enabled:</strong> Form will generate mock QR code without blockchain transaction. Perfect for UI testing!
              </p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle>Depositor Information</CardTitle></CardHeader>
        <CardContent>
          <Label htmlFor="farmer">Farmer Wallet Address {demoMode && <span className="text-gray-400">(optional in demo)</span>}</Label>
          <Input id="farmer" placeholder="0x..." value={farmerAddress} onChange={(e) => setFarmerAddress(e.target.value)} required={!demoMode} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Commodity Inspection</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Commodity Name</Label>
              <Select value={commodityName} onValueChange={setCommodityName}>
                <SelectTrigger><SelectValue placeholder="Select crop" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Wheat">Wheat</SelectItem>
                  <SelectItem value="Rice">Rice (Paddy)</SelectItem>
                  <SelectItem value="Maize">Maize</SelectItem>
                  <SelectItem value="Sorghum">Sorghum (Jowar)</SelectItem>
                  <SelectItem value="Cotton">Cotton</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Quantity (kg)</Label>
              <Input type="number" placeholder="5000" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Quality Grade</Label>
              <Select value={qualityGrade} onValueChange={setQualityGrade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FAQ">FAQ (Fair Average Quality)</SelectItem>
                  <SelectItem value="A">Grade A</SelectItem>
                  <SelectItem value="B">Grade B</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Number of Packages</Label>
              <Input type="number" placeholder="100" value={numberOfPackages} onChange={(e) => setNumberOfPackages(e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Moisture %</Label>
              <Input type="number" step="0.1" placeholder="12.5" value={moistureContent} onChange={(e) => setMoistureContent(e.target.value)} />
            </div>
            <div>
              <Label>Purity %</Label>
              <Input type="number" step="0.1" placeholder="99" value={purityPercentage} onChange={(e) => setPurityPercentage(e.target.value)} />
            </div>
            <div>
              <Label>Damage %</Label>
              <Input type="number" step="0.1" placeholder="0" value={damagePercentage} onChange={(e) => setDamagePercentage(e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Stack/Lot Number</Label>
            <Input placeholder="STACK-A-12" value={stackLocation} onChange={(e) => setStackLocation(e.target.value)} required />
          </div>

          <div>
            <Label>Insurance Policy No (Optional)</Label>
            <Input placeholder="INS-2024-XYZ" value={insurancePolicyNo} onChange={(e) => setInsurancePolicyNo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading 
          ? (demoMode ? '🎭 Generating Demo QR...' : '⏳ Issuing eNWR on Blockchain...') 
          : (demoMode ? '🎭 Generate Demo QR Code' : '✅ Issue eNWR & Generate QR')
        }
      </Button>
    </form>
  )
}
