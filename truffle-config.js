const { readFileSync } = require('fs')
const path = require('path')
const HDWalletProvider = require('truffle-hdwallet-provider')
require('dotenv').config();

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: () => new HDWalletProvider(process.env.ROPSTEN_MNEMONIC, `https://ropsten.infura.io/${process.env.INFURA_API_KEY}`),
      network_id: 3,
      gas: 5500000,
      skipDryRun: true,
      from: '0xF07AEb54CEFfe65C11277aC4265A19B11F1E5435'
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};