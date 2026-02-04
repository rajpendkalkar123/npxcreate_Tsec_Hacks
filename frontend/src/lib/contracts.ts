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
  RoleRegistry: '0x4D4826DF5ebe538E24dB6D51bD2f0ffD262cdc93',
  RangerToken: '0x6f2BABe73a29295d9650525bBcFF98A585b55E5b',
  Marketplace: '0xd159Cf6f961aA1e9be863Bf3542933A827c4bd8a',
  LendingPool: '0x45c4Addc4125eF21c26eAFd2BA31E4ca079DC8d0',
  MockFinternetGateway: '0x07efDf0110a170392D17eb8e42Fa5C69ce81659b'
} as const

export const PINATA_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_PINATA_API_KEY || '',
  apiSecret: process.env.NEXT_PUBLIC_PINATA_API_SECRET || '',
  jwt: process.env.NEXT_PUBLIC_PINATA_JWT || ''
}
