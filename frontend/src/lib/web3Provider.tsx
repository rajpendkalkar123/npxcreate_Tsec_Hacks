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
  authMethod: 'privy' | 'metamask' | null  // Track how user authenticated
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  setPrivyAuth: (walletAddress: string) => void  // For Privy embedded wallet
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
  const [authMethod, setAuthMethod] = useState<'privy' | 'metamask' | null>(null)
  const [contracts, setContracts] = useState<Web3ContextType['contracts']>({
    rangerToken: null,
    marketplace: null,
    lendingPool: null,
    roleRegistry: null
  })

  // Load auth state on mount
  useEffect(() => {
    const savedAuthMethod = localStorage.getItem('auth_method') as 'privy' | 'metamask' | null
    const savedAddress = localStorage.getItem('wallet_address')
    const isLoggingOut = localStorage.getItem('is_logging_out') === 'true'
    
    // Don't restore session if user is logging out
    if (savedAuthMethod === 'privy' && savedAddress && !isLoggingOut) {
      // Restore Privy session (backend handles crypto, user just authenticated)
      setAddress(savedAddress)
      setIsConnected(true)
      setAuthMethod('privy')
      loadManualRole()
      console.log('✅ Privy session restored')
    }
  }, [])

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

  // NEW: Set Privy authentication (no MetaMask needed)
  const setPrivyAuth = (walletAddress: string) => {
    setAddress(walletAddress)
    setIsConnected(true)
    setAuthMethod('privy')
    localStorage.setItem('auth_method', 'privy')
    localStorage.setItem('wallet_address', walletAddress)
    loadManualRole()
    console.log('✅ Privy auth set, wallet abstracted for user')
  }

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask!')
      return
    }

    try {
      setAuthMethod('metamask')
      localStorage.setItem('auth_method', 'metamask')
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
    setAuthMethod(null)
    setContracts({
      rangerToken: null,
      marketplace: null,
      lendingPool: null,
      roleRegistry: null
    })
    
    // Clear all auth data
    localStorage.removeItem('user_role_manual')
    localStorage.removeItem('auth_method')
    localStorage.removeItem('wallet_address')
    console.log('🔓 All auth data cleared')
    
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
        authMethod,
        connectWallet, 
        disconnectWallet,
        setPrivyAuth,
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
