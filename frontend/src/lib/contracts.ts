export const HOODI_CONFIG = {
  chainId: 560048,
  chainName: 'Hoodi Testnet',
  rpcUrl: 'https://ethereum-hoodi-rpc.publicnode.com',
  blockExplorer: 'https://hoodi.etherscan.io',
  nativeCurrency: {
    name: 'ETH',
    symbol: 'ETH',
    decimals: 18
  }
} as const

export const CONTRACT_ADDRESSES = {
  RoleRegistry: '0xA7Fc01ad4b5b188A300bdBc47b1e6E2540E8DE8a',
  RangerToken: '0x5b76201EA96A3D94a7bA107514357A490f8E76FD',
  Marketplace: '0xD7751F0470D1898E47c272074413E71cEd140AC2',
  LendingPool: '0x792085c0D236ABd3C76305E9Fba605Fe1dC6F4CC',
  MockFinternetGateway: '0xC1B6C2eD61Cb818a59a734f1298DB30806646118'
} as const

export const PINATA_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_PINATA_API_KEY || '',
  apiSecret: process.env.NEXT_PUBLIC_PINATA_API_SECRET || '',
  jwt: process.env.NEXT_PUBLIC_PINATA_JWT || ''
}
