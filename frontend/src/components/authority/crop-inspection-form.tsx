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
  const { contracts, address, authMethod } = useWeb3()
  const [loading, setLoading] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [tokenId, setTokenId] = useState<string | null>(null)

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

  const handleInspectionComplete = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if user is using Privy - they need to switch to MetaMask for blockchain
    if (authMethod === 'privy') {
      alert('⚠️ Blockchain Transactions Require MetaMask\n\n' +
            'Privy login is for browsing only. To issue eNWR tokens:\n\n' +
            '1. Logout from current session\n' +
            '2. Login again and select "MetaMask" option\n' +
            '3. Connect your MetaMask wallet\n' +
            '4. Make sure your wallet is registered as a warehouse\n\n' +
            '💡 Your wallet needs test ETH and warehouse permissions.')
      return
    }

    if (!contracts.rangerToken || !address) {
      alert('Please connect your MetaMask wallet to issue eNWR tokens')
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
      console.log('🔑 Signer address:', address)
      console.log('📋 Parameters:', {
        to: farmerAddress,
        quantity: quantity,
        expiry: expiryTimestamp,
        uri: ipfsUrl
      })

      // Check if warehouse is registered
      const isActive = await contracts.roleRegistry.isWarehouseActive(address)
      console.log('🏢 Warehouse active status:', isActive)
      
      if (!isActive) {
        alert(`❌ ERROR: Your wallet (${address}) is not registered as an active warehouse!\n\nPlease ask an admin to register your wallet address as a warehouse before issuing tokens.`)
        setLoading(false)
        return
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
        if (error.data && error.data.includes('e2517d3f')) {
          alert('⚠️ Authorization Error: Your wallet does not have MINTER_ROLE.\n\nTo fix this:\n1. Go to Admin Panel → Role Management\n2. Register your warehouse with WDRA details\n3. MINTER_ROLE will be automatically granted!\n\nOr contact the platform admin.')
        } else {
          alert('Smart contract call failed. Check that:\n- Farmer address is valid\n- You have MINTER_ROLE\n- Contract is deployed correctly')
        }
      } else {
        alert('Failed to issue eNWR. See console for details.')
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
      {/* Wallet Address Display */}
      {address && (
        <div className={`border rounded-lg p-3 mb-4 ${
          authMethod === 'metamask' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs font-semibold ${
                authMethod === 'metamask' ? 'text-green-600' : 'text-blue-600'
              }`}>
                {authMethod === 'metamask' ? '🦊 MetaMask Wallet' : '🔑 Privy Wallet (View Only)'}
              </p>
              <code className={`text-sm font-mono ${
                authMethod === 'metamask' ? 'text-green-900' : 'text-blue-900'
              }`}>
                {address}
              </code>
            </div>
            <div className="text-right">
              <p className={`text-xs ${
                authMethod === 'metamask' ? 'text-green-600' : 'text-blue-600'
              }`}>
                {authMethod === 'metamask' ? '✅ Can issue tokens' : '⚠️ Logout & use MetaMask'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Warning for Privy users */}
      {authMethod === 'privy' && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">⚠️ MetaMask Required for Blockchain Transactions</h3>
              <div className="mt-2 text-sm text-orange-700">
                <p>You're logged in with Privy (view-only mode). To issue eNWR tokens on blockchain:</p>
                <ol className="list-decimal ml-5 mt-2 space-y-1">
                  <li><strong>Logout</strong> from current session</li>
                  <li><strong>Login again</strong> and connect with <strong>MetaMask</strong></li>
                  <li>Ensure your MetaMask wallet has test ETH and warehouse permissions</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-900">Crop Inspection & eNWR Issuance</h2>

      <Card>
        <CardHeader><CardTitle>Depositor Information</CardTitle></CardHeader>
        <CardContent>
          <Label htmlFor="farmer">Farmer Wallet Address</Label>
          <Input id="farmer" placeholder="0x..." value={farmerAddress} onChange={(e) => setFarmerAddress(e.target.value)} required />
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
        {loading ? '⏳ Issuing eNWR on Blockchain...' : '✅ Issue eNWR & Generate QR'}
      </Button>
    </form>
  )
}
