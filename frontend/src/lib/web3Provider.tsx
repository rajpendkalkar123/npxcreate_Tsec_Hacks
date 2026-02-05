"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { BrowserProvider, Contract, JsonRpcSigner } from 'ethers'
import { CONTRACT_ADDRESSES, HOODI_CONFIG } from './contracts'

// Import ABIs
import RangerTokenABI from './abis/RangerToken.json'
import MarketplaceABI from './abis/Marketplace.json'
import LendingPoolABI from './abis/LendingPool.json'
import RoleRegistryABI from './abis/RoleRegistry.json'

interface Web3ContextType {
  provider: BrowserProvider | null
  signer: JsonRpcSigner | null
  address: string | null
  role: 'farmer' | 'bank' | 'authority' | null
  isConnected: boolean
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  contracts: {
    rangerToken: Contract | null
    marketplace: Contract | null
    lendingPool: Contract | null
    roleRegistry: Contract | null
  }
}

const Web3Context = createContext<Web3ContextType>({} as Web3ContextType)

export function Web3Provider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<BrowserProvider | null>(null)
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [role, setRole] = useState<'farmer' | 'bank' | 'authority' | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [contracts, setContracts] = useState<Web3ContextType['contracts']>({
    rangerToken: null,
    marketplace: null,
    lendingPool: null,
    roleRegistry: null
  })

  // ✅ SIMPLIFIED: Only use manual role selection from localStorage (NO blockchain detection)
  const loadManualRole = () => {
    const manualRole = localStorage.getItem('user_role_manual')
    if (manualRole && (manualRole === 'farmer' || manualRole === 'bank' || manualRole === 'authority')) {
      console.log('✅ Using manually selected role:', manualRole)
      setRole(manualRole as 'farmer' | 'bank' | 'authority')
    } else {
      console.log('⚠️ No role selected yet')
      setRole(null)
    }
  }

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask!')
      return
    }

    try {
      const browserProvider = new BrowserProvider(window.ethereum)
      
      // Request account access
      await browserProvider.send("eth_requestAccounts", [])

      // Switch to Hoodi network
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: `0x${HOODI_CONFIG.chainId.toString(16)}` }],
        })
      } catch (switchError: any) {
        // Network doesn't exist, add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${HOODI_CONFIG.chainId.toString(16)}`,
              chainName: HOODI_CONFIG.chainName,
              rpcUrls: [HOODI_CONFIG.rpcUrl],
              blockExplorerUrls: [HOODI_CONFIG.blockExplorer],
              nativeCurrency: HOODI_CONFIG.nativeCurrency
            }],
          })
        }
      }

      const signerInstance = await browserProvider.getSigner()
      const userAddress = await signerInstance.getAddress()

      // Initialize contracts
      const rangerToken = new Contract(
        CONTRACT_ADDRESSES.RangerToken,
        RangerTokenABI.abi,
        signerInstance
      )
      const marketplace = new Contract(
        CONTRACT_ADDRESSES.Marketplace,
        MarketplaceABI.abi,
        signerInstance
      )
      const lendingPool = new Contract(
        CONTRACT_ADDRESSES.LendingPool,
        LendingPoolABI.abi,
        signerInstance
      )
      const roleRegistry = new Contract(
        CONTRACT_ADDRESSES.RoleRegistry,
        RoleRegistryABI.abi,
        signerInstance
      )

      setProvider(browserProvider)
      setSigner(signerInstance)
      setAddress(userAddress)
      setContracts({ rangerToken, marketplace, lendingPool, roleRegistry })
      setIsConnected(true)

      // ✅ Load role from localStorage (user's manual selection)
      loadManualRole()

      // Store in cookie for middleware
      document.cookie = `wallet_address=${userAddress}; path=/`
      document.cookie = "finternet_auth=true; path=/"

      // 🔑 Auto-grant MINTER_ROLE if user selected 'authority'
      const selectedRole = localStorage.getItem('user_role_manual')
      if (selectedRole === 'authority') {
        console.log('🏢 Setting up warehouse authority permissions...')
        
        try {
          // Step 1: Register as warehouse in RoleRegistry
          console.log('🏢 Step 1: Registering warehouse...')
          const registerResponse = await fetch('/api/register-warehouse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: userAddress })
          })
          const registerData = await registerResponse.json()
          
          if (registerData.success) {
            if (registerData.alreadyRegistered) {
              console.log('✅ Already registered as warehouse:', registerData.warehouseInfo.name)
            } else {
              console.log('✅ Warehouse registered! Tx:', registerData.txHash)
              console.log('📋 Warehouse Info:', registerData.warehouseInfo)
            }
          } else {
            console.warn('⚠️ Failed to register warehouse:', registerData.error)
          }

          // Step 2: Grant MINTER_ROLE
          console.log('🔑 Step 2: Granting MINTER_ROLE...')
          const roleResponse = await fetch('/api/grant-minter-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: userAddress })
          })
          const roleData = await roleResponse.json()
          
          if (roleData.success) {
            if (roleData.alreadyGranted) {
              console.log('✅ Already has MINTER_ROLE')
            } else {
              console.log('✅ MINTER_ROLE granted! Tx:', roleData.txHash)
            }
          } else {
            console.warn('⚠️ Failed to grant MINTER_ROLE:', roleData.error)
          }

          console.log('🎉 Warehouse authority setup complete!')
          
        } catch (error) {
          console.error('❌ Failed to setup warehouse authority:', error)
        }
      }

      // 🏦 Auto-register if user selected 'bank'
      if (selectedRole === 'bank') {
        console.log('🏦 Setting up bank permissions...')
        
        try {
          const registerResponse = await fetch('/api/register-bank', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: userAddress })
          })
          const registerData = await registerResponse.json()
          
          if (registerData.success) {
            if (registerData.alreadyRegistered) {
              console.log('✅ Already registered as bank:', registerData.bankInfo.name)
            } else {
              console.log('✅ Bank registered! Tx:', registerData.txHash)
              console.log('📋 Bank Info:', registerData.bankInfo)
            }
            console.log('🎉 Bank setup complete!')
          } else {
            console.warn('⚠️ Failed to register bank:', registerData.error)
          }
          
        } catch (error) {
          console.error('❌ Failed to setup bank:', error)
        }
      }
      
    } catch (error) {
      console.error('Wallet connection failed:', error)
      alert('Failed to connect wallet. Please try again.')
    }
  }

  const disconnectWallet = () => {
    setProvider(null)
    setSigner(null)
    setAddress(null)
    setRole(null)
    setIsConnected(false)
    setContracts({
      rangerToken: null,
      marketplace: null,
      lendingPool: null,
      roleRegistry: null
    })
    
    // ✅ CRITICAL: Clear manual role selection on disconnect
    localStorage.removeItem('user_role_manual')
    console.log('🔓 Manual role selection cleared')
    
    document.cookie = "wallet_address=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = "finternet_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
  }

  // Listen for account changes
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet()
        } else {
          connectWallet()
        }
      })

      window.ethereum.on('chainChanged', () => {
        window.location.reload()
      })
    }

    return () => {
      if (typeof window.ethereum !== 'undefined') {
        window.ethereum.removeAllListeners('accountsChanged')
        window.ethereum.removeAllListeners('chainChanged')
      }
    }
  }, [])

  return (
    <Web3Context.Provider 
      value={{ 
        provider, 
        signer, 
        address, 
        role, 
        isConnected, 
        connectWallet, 
        disconnectWallet,
        contracts 
      }}
    >
      {children}
    </Web3Context.Provider>
  )
}

export const useWeb3 = () => {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error('useWeb3 must be used within Web3Provider')
  }
  return context
}

// Type declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any
  }
}
