"use client"

import { useState } from "react"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import RoleRegistryABI from "@/lib/abis/RoleRegistry.json"
import { CONTRACT_ADDRESSES } from "@/lib/contracts"

interface EntityStatus {
  address: string
  isActive: boolean | null
  details?: any
}

export function RoleManagement() {
  const [warehouseAddress, setWarehouseAddress] = useState("")
  const [wdraRegNo, setWdraRegNo] = useState("")
  const [warehouseLocation, setWarehouseLocation] = useState("")
  const [bankAddress, setBankAddress] = useState("")
  const [bankName, setBankName] = useState("")
  const [bankLicenseNo, setBankLicenseNo] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  
  // Status checking
  const [checkAddress, setCheckAddress] = useState("")
  const [warehouseStatus, setWarehouseStatus] = useState<EntityStatus | null>(null)
  const [bankStatus, setBankStatus] = useState<EntityStatus | null>(null)

  const getProvider = () => {
    if (!window.ethereum) {
      throw new Error("MetaMask not installed")
    }
    return new ethers.BrowserProvider(window.ethereum)
  }

  const registerWarehouse = async () => {
    if (!warehouseAddress || !wdraRegNo || !warehouseLocation) {
      setMessage({ type: "error", text: "Please fill in all warehouse fields" })
      return
    }

    if (!ethers.isAddress(warehouseAddress)) {
      setMessage({ type: "error", text: "Invalid Ethereum address" })
      return
    }

    try {
      setIsLoading(true)
      setMessage(null)

      const provider = getProvider()
      const signer = await provider.getSigner()
      const roleRegistry = new ethers.Contract(CONTRACT_ADDRESSES.RoleRegistry, RoleRegistryABI.abi, signer)

      console.log("Registering warehouse:", warehouseAddress, wdraRegNo, warehouseLocation)
      const tx = await roleRegistry.registerWarehouse(warehouseAddress, wdraRegNo, warehouseLocation)
      
      setMessage({ type: "success", text: "Transaction sent! Waiting for confirmation..." })
      
      await tx.wait()
      
      setMessage({ type: "success", text: `✅ Warehouse ${warehouseAddress.slice(0, 6)}...${warehouseAddress.slice(-4)} registered successfully!` })
      setWarehouseAddress("")
      setWdraRegNo("")
      setWarehouseLocation("")
    } catch (error: any) {
      console.error("Failed to register warehouse:", error)
      setMessage({ 
        type: "error", 
        text: error.reason || error.message || "Failed to register warehouse" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const registerBank = async () => {
    if (!bankAddress || !bankName || !bankLicenseNo) {
      setMessage({ type: "error", text: "Please fill in all bank fields" })
      return
    }

    if (!ethers.isAddress(bankAddress)) {
      setMessage({ type: "error", text: "Invalid Ethereum address" })
      return
    }

    try {
      setIsLoading(true)
      setMessage(null)

      const provider = getProvider()
      const signer = await provider.getSigner()
      const roleRegistry = new ethers.Contract(CONTRACT_ADDRESSES.RoleRegistry, RoleRegistryABI.abi, signer)

      console.log("Registering bank:", bankAddress, bankName, bankLicenseNo)
      const tx = await roleRegistry.registerBank(bankAddress, bankName, bankLicenseNo)
      
      setMessage({ type: "success", text: "Transaction sent! Waiting for confirmation..." })
      
      await tx.wait()
      
      setMessage({ type: "success", text: `✅ Bank ${bankAddress.slice(0, 6)}...${bankAddress.slice(-4)} registered successfully!` })
      setBankAddress("")
      setBankName("")
      setBankLicenseNo("")
    } catch (error: any) {
      console.error("Failed to register bank:", error)
      setMessage({ 
        type: "error", 
        text: error.reason || error.message || "Failed to register bank" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const checkWarehouseStatus = async () => {
    if (!checkAddress || !ethers.isAddress(checkAddress)) {
      setMessage({ type: "error", text: "Please enter a valid address" })
      return
    }

    try {
      setIsLoading(true)
      const provider = getProvider()
      const roleRegistry = new ethers.Contract(CONTRACT_ADDRESSES.RoleRegistry, RoleRegistryABI.abi, provider)
      
      const isActive = await roleRegistry.isWarehouseActive(checkAddress)
      const details = await roleRegistry.warehouses(checkAddress)
      
      setWarehouseStatus({
        address: checkAddress,
        isActive,
        details: {
          wdraRegNo: details.wdraRegNo,
          location: details.location,
          registrationDate: details.registrationDate ? new Date(Number(details.registrationDate) * 1000).toLocaleDateString() : 'N/A'
        }
      })
      setBankStatus(null)
      setMessage({ 
        type: isActive ? "success" : "error", 
        text: isActive ? "✅ Warehouse is active and registered" : "❌ Warehouse is not active or not registered" 
      })
    } catch (error: any) {
      console.error("Failed to check warehouse status:", error)
      setMessage({ type: "error", text: "Failed to check status" })
    } finally {
      setIsLoading(false)
    }
  }

  const checkBankStatus = async () => {
    if (!checkAddress || !ethers.isAddress(checkAddress)) {
      setMessage({ type: "error", text: "Please enter a valid address" })
      return
    }

    try {
      setIsLoading(true)
      const provider = getProvider()
      const roleRegistry = new ethers.Contract(CONTRACT_ADDRESSES.RoleRegistry, RoleRegistryABI.abi, provider)
      
      const isActive = await roleRegistry.isBankActive(checkAddress)
      const details = await roleRegistry.banks(checkAddress)
      
      setBankStatus({
        address: checkAddress,
        isActive,
        details: {
          name: details.name,
          licenseNo: details.licenseNo,
          registrationDate: details.registrationDate ? new Date(Number(details.registrationDate) * 1000).toLocaleDateString() : 'N/A'
        }
      })
      setWarehouseStatus(null)
      setMessage({ 
        type: isActive ? "success" : "error", 
        text: isActive ? "✅ Bank is active and registered" : "❌ Bank is not active or not registered" 
      })
    } catch (error: any) {
      console.error("Failed to check bank status:", error)
      setMessage({ type: "error", text: "Failed to check status" })
    } finally {
      setIsLoading(false)
    }
  }

  const deactivateWarehouse = async () => {
    if (!warehouseStatus?.address) return

    try {
      setIsLoading(true)
      setMessage(null)

      const provider = getProvider()
      const signer = await provider.getSigner()
      const roleRegistry = new ethers.Contract(CONTRACT_ADDRESSES.RoleRegistry, RoleRegistryABI.abi, signer)

      const tx = await roleRegistry.deactivateWarehouse(warehouseStatus.address)
      setMessage({ type: "success", text: "Transaction sent! Waiting for confirmation..." })
      
      await tx.wait()
      
      setMessage({ type: "success", text: `✅ Warehouse deactivated successfully!` })
      await checkWarehouseStatus() // Refresh status
    } catch (error: any) {
      console.error("Failed to deactivate warehouse:", error)
      setMessage({ 
        type: "error", 
        text: error.reason || error.message || "Failed to deactivate warehouse" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const deactivateBank = async () => {
    if (!bankStatus?.address) return

    try {
      setIsLoading(true)
      setMessage(null)

      const provider = getProvider()
      const signer = await provider.getSigner()
      const roleRegistry = new ethers.Contract(CONTRACT_ADDRESSES.RoleRegistry, RoleRegistryABI.abi, signer)

      const tx = await roleRegistry.deactivateBank(bankStatus.address)
      setMessage({ type: "success", text: "Transaction sent! Waiting for confirmation..." })
      
      await tx.wait()
      
      setMessage({ type: "success", text: `✅ Bank deactivated successfully!` })
      await checkBankStatus() // Refresh status
    } catch (error: any) {
      console.error("Failed to deactivate bank:", error)
      setMessage({ 
        type: "error", 
        text: error.reason || error.message || "Failed to deactivate bank" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const reactivateWarehouse = async () => {
    if (!warehouseStatus?.address || !warehouseStatus.details) return

    try {
      setIsLoading(true)
      setMessage(null)

      const provider = getProvider()
      const signer = await provider.getSigner()
      const roleRegistry = new ethers.Contract(CONTRACT_ADDRESSES.RoleRegistry, RoleRegistryABI.abi, signer)

      // Re-register with existing details
      const tx = await roleRegistry.registerWarehouse(
        warehouseStatus.address,
        warehouseStatus.details.wdraRegNo,
        warehouseStatus.details.location
      )
      setMessage({ type: "success", text: "Transaction sent! Waiting for confirmation..." })
      
      await tx.wait()
      
      setMessage({ type: "success", text: `✅ Warehouse reactivated successfully!` })
      await checkWarehouseStatus() // Refresh status
    } catch (error: any) {
      console.error("Failed to reactivate warehouse:", error)
      setMessage({ 
        type: "error", 
        text: error.reason || error.message || "Failed to reactivate warehouse" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const reactivateBank = async () => {
    if (!bankStatus?.address || !bankStatus.details) return

    try {
      setIsLoading(true)
      setMessage(null)

      const provider = getProvider()
      const signer = await provider.getSigner()
      const roleRegistry = new ethers.Contract(CONTRACT_ADDRESSES.RoleRegistry, RoleRegistryABI.abi, signer)

      // Re-register with existing details
      const tx = await roleRegistry.registerBank(
        bankStatus.address,
        bankStatus.details.name,
        bankStatus.details.licenseNo
      )
      setMessage({ type: "success", text: "Transaction sent! Waiting for confirmation..." })
      
      await tx.wait()
      
      setMessage({ type: "success", text: `✅ Bank reactivated successfully!` })
      await checkBankStatus() // Refresh status
    } catch (error: any) {
      console.error("Failed to reactivate bank:", error)
      setMessage({ 
        type: "error", 
        text: error.reason || error.message || "Failed to reactivate bank" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === "success" 
            ? "bg-green-50 border-green-200 text-green-800" 
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          {message.text}
        </div>
      )}

      {/* Register Warehouse */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🏢</span>
            Register Warehouse Authority
          </CardTitle>
          <CardDescription>
            Grant MINTER_ROLE to warehouse authorities to issue eNWR tokens
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="warehouse-address">Warehouse Wallet Address</Label>
            <Input
              id="warehouse-address"
              placeholder="0x..."
              value={warehouseAddress}
              onChange={(e) => setWarehouseAddress(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wdra-regno">WDRA Registration Number</Label>
            <Input
              id="wdra-regno"
              placeholder="WDRA-MH-2024-001"
              value={wdraRegNo}
              onChange={(e) => setWdraRegNo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="warehouse-location">Warehouse Location</Label>
            <Input
              id="warehouse-location"
              placeholder="Mumbai, Maharashtra"
              value={warehouseLocation}
              onChange={(e) => setWarehouseLocation(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={registerWarehouse}
              disabled={isLoading || !warehouseAddress || !wdraRegNo || !warehouseLocation}
              className="flex-1"
            >
              {isLoading ? "Processing..." : "Register Warehouse"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Register Bank */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🏦</span>
            Register Bank/Lender
          </CardTitle>
          <CardDescription>
            Grant BANK_ROLE to financial institutions to offer loans
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bank-address">Bank Wallet Address</Label>
            <Input
              id="bank-address"
              placeholder="0x..."
              value={bankAddress}
              onChange={(e) => setBankAddress(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank-name">Bank Name</Label>
            <Input
              id="bank-name"
              placeholder="State Bank of India"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bank-license">Banking License Number</Label>
            <Input
              id="bank-license"
              placeholder="RBI-LIC-2024-001"
              value={bankLicenseNo}
              onChange={(e) => setBankLicenseNo(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={registerBank}
              disabled={isLoading || !bankAddress || !bankName || !bankLicenseNo}
              className="flex-1"
            >
              {isLoading ? "Processing..." : "Register Bank"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Check & Manage Access */}
      <Card className="border-2 border-purple-200">
        <CardHeader className="bg-purple-50">
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            Check & Manage Access
          </CardTitle>
          <CardDescription>
            View entity status and activate/deactivate warehouses or banks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="check-address">Entity Wallet Address</Label>
              <Input
                id="check-address"
                placeholder="0x..."
                value={checkAddress}
                onChange={(e) => setCheckAddress(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={checkWarehouseStatus}
                disabled={isLoading || !checkAddress || !ethers.isAddress(checkAddress)}
                variant="outline"
                className="flex-1"
              >
                Check as Warehouse
              </Button>
              <Button 
                onClick={checkBankStatus}
                disabled={isLoading || !checkAddress || !ethers.isAddress(checkAddress)}
                variant="outline"
                className="flex-1"
              >
                Check as Bank
              </Button>
            </div>
          </div>

          {/* Warehouse Status Display */}
          {warehouseStatus && (
            <div className="border rounded-lg p-4 bg-slate-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏢</span>
                  <h3 className="font-semibold text-lg">Warehouse Status</h3>
                </div>
                <Badge variant={warehouseStatus.isActive ? "default" : "destructive"} className="text-sm">
                  {warehouseStatus.isActive ? "🟢 Active" : "🔴 Inactive"}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">Address:</span>
                  <code className="bg-slate-200 px-2 py-1 rounded font-mono text-xs">
                    {warehouseStatus.address.slice(0, 10)}...{warehouseStatus.address.slice(-8)}
                  </code>
                </div>
                {warehouseStatus.details?.wdraRegNo && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">WDRA Reg No:</span>
                    <span className="font-medium">{warehouseStatus.details.wdraRegNo}</span>
                  </div>
                )}
                {warehouseStatus.details?.location && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Location:</span>
                    <span className="font-medium">{warehouseStatus.details.location}</span>
                  </div>
                )}
                {warehouseStatus.details?.registrationDate && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Registered:</span>
                    <span className="font-medium">{warehouseStatus.details.registrationDate}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {warehouseStatus.isActive ? (
                  <Button 
                    onClick={deactivateWarehouse}
                    disabled={isLoading}
                    variant="destructive"
                    className="flex-1"
                  >
                    {isLoading ? "Processing..." : "🔴 Deactivate"}
                  </Button>
                ) : (
                  <Button 
                    onClick={reactivateWarehouse}
                    disabled={isLoading || !warehouseStatus.details?.wdraRegNo}
                    className="flex-1"
                  >
                    {isLoading ? "Processing..." : "🟢 Reactivate"}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Bank Status Display */}
          {bankStatus && (
            <div className="border rounded-lg p-4 bg-slate-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏦</span>
                  <h3 className="font-semibold text-lg">Bank Status</h3>
                </div>
                <Badge variant={bankStatus.isActive ? "default" : "destructive"} className="text-sm">
                  {bankStatus.isActive ? "🟢 Active" : "🔴 Inactive"}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">Address:</span>
                  <code className="bg-slate-200 px-2 py-1 rounded font-mono text-xs">
                    {bankStatus.address.slice(0, 10)}...{bankStatus.address.slice(-8)}
                  </code>
                </div>
                {bankStatus.details?.name && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Bank Name:</span>
                    <span className="font-medium">{bankStatus.details.name}</span>
                  </div>
                )}
                {bankStatus.details?.licenseNo && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">License No:</span>
                    <span className="font-medium">{bankStatus.details.licenseNo}</span>
                  </div>
                )}
                {bankStatus.details?.registrationDate && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Registered:</span>
                    <span className="font-medium">{bankStatus.details.registrationDate}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {bankStatus.isActive ? (
                  <Button 
                    onClick={deactivateBank}
                    disabled={isLoading}
                    variant="destructive"
                    className="flex-1"
                  >
                    {isLoading ? "Processing..." : "🔴 Deactivate"}
                  </Button>
                ) : (
                  <Button 
                    onClick={reactivateBank}
                    disabled={isLoading || !bankStatus.details?.name}
                    className="flex-1"
                  >
                    {isLoading ? "Processing..." : "🟢 Reactivate"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 text-lg">ℹ️ Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-800">
          <p>• Only accounts with <Badge variant="outline">ADMIN_ROLE</Badge> can register warehouses and banks</p>
          <p>• Use the "Check & Manage Access" section to view status and activate/deactivate entities</p>
          <p>• Warehouses with active (non-expired) tokens cannot be deactivated</p>
          <p>• The connected wallet must be the deployer or have admin permissions</p>
          <p>• RoleRegistry Contract: <code className="bg-blue-100 px-1 py-0.5 rounded text-xs font-mono">{CONTRACT_ADDRESSES.RoleRegistry}</code></p>
          <p>• Transactions require gas fees on Hoodi testnet</p>
          <p>• View transactions on <a href={`https://hoodi.etherscan.io/address/${CONTRACT_ADDRESSES.RoleRegistry}`} target="_blank" rel="noopener noreferrer" className="underline font-semibold">Hoodi Explorer</a></p>
        </CardContent>
      </Card>
    </div>
  )
}

