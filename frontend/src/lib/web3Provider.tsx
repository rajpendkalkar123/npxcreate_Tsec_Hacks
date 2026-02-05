"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { BrowserProvider, Contract, JsonRpcSigner, JsonRpcProvider } from 'ethers'
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
  role: 'farmer' | 'bank' | 'authority' | 'admin' | null
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
  const [role, setRole] = useState<'farmer' | 'bank' | 'authority' | 'admin' | null>(null)
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
      // Restore Privy session and initialize contracts
      setPrivyAuth(savedAddress)
      console.log('✅ Privy session restored')
    }
  }, [])

  // ✅ SIMPLIFIED: Only use manual role selection from localStorage (NO blockchain detection)
  const loadManualRole = () => {
    const manualRole = localStorage.getItem('user_role_manual')
    if (manualRole && (manualRole === 'farmer' || manualRole === 'bank' || manualRole === 'authority' || manualRole === 'admin')) {
      console.log('✅ Using manually selected role:', manualRole)
      setRole(manualRole as 'farmer' | 'bank' | 'authority' | 'admin')
    } else {
      console.log('⚠️ No role selected yet')
      setRole(null)
    }
  }

  // NEW: Set Privy authentication (no MetaMask needed)
  const setPrivyAuth = async (walletAddress: string) => {
    try {
      setAddress(walletAddress)
      setIsConnected(true)
      setAuthMethod('privy')
      localStorage.setItem('auth_method', 'privy')
      localStorage.setItem('wallet_address', walletAddress)
      loadManualRole()
      
      // Give Privy a moment to inject its wallet provider
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Try to use Privy's embedded wallet provider
      let signerInstance = null
      let browserProvider = null

      if (typeof window.ethereum !== 'undefined') {
        try {
          // Use the injected provider from Privy
          browserProvider = new BrowserProvider(window.ethereum)
          
          // Request accounts to trigger Privy's wallet
          const accounts = await browserProvider.send("eth_accounts", [])
          if (accounts && accounts.length > 0) {
            signerInstance = await browserProvider.getSigner()
            setProvider(browserProvider)
            setSigner(signerInstance)
            console.log('✅ Using Privy embedded wallet provider with signer')
          }
        } catch (signerError) {
          console.log('⚠️ Signer not available yet:', signerError)
        }
      }

      // If signer not available, use read-only provider for contract reading
      if (!signerInstance) {
        // Use public RPC for reading blockchain data
        const readOnlyProvider = new JsonRpcProvider(HOODI_CONFIG.rpcUrl)
        browserProvider = readOnlyProvider as any
        setProvider(browserProvider)
        console.log('✅ Using read-only provider for Privy (transactions will be handled when wallet activates)')
      }

      // Initialize contracts (with signer if available, otherwise read-only)
      const contractProvider = signerInstance || browserProvider
      
      const rangerToken = new Contract(
        CONTRACT_ADDRESSES.RangerToken,
        RangerTokenABI.abi,
        contractProvider
      )
      const marketplace = new Contract(
        CONTRACT_ADDRESSES.Marketplace,
        MarketplaceABI.abi,
        contractProvider
      )
      const lendingPool = new Contract(
        CONTRACT_ADDRESSES.LendingPool,
        LendingPoolABI.abi,
        contractProvider
      )
      const roleRegistry = new Contract(
        CONTRACT_ADDRESSES.RoleRegistry,
        RoleRegistryABI.abi,
        contractProvider
      )

      setContracts({ rangerToken, marketplace, lendingPool, roleRegistry })
      console.log('✅ Privy contracts initialized', signerInstance ? 'with signer' : 'read-only')
      
    } catch (error) {
      console.error('Error initializing Privy:', error)
      // Even if contract init fails, keep the basic auth
      console.log('⚠️ Privy auth set, but contracts initialization failed')
    }
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
