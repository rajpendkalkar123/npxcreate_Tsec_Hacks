require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    // Hoodi Testnet configuration
    hoodi: {
      url: process.env.HOODI_RPC_URL || "https://ethereum-hoodi-rpc.publicnode.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: parseInt(process.env.CHAIN_ID || "560048"),
      gasPrice: "auto",
    },
  },
  etherscan: {
    apiKey: {
      hoodi: process.env.ETHERSCAN_API_KEY || "not-required",
    },
    customChains: [
      {
        network: "hoodi",
        chainId: parseInt(process.env.CHAIN_ID || "560048"),
        urls: {
          apiURL: process.env.BLOCK_EXPLORER_API || "https://hoodi.etherscan.io/api",
          browserURL: process.env.BLOCK_EXPLORER_URL || "https://hoodi.etherscan.io",
        },
      },
    ],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};
