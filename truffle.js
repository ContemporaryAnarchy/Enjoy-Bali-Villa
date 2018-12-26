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
      provider: function() {
        return new HDWalletProvider(process.env.ROPSTEN_MNEMONIC, `https://ropsten.infura.io/${process.env.INFURA_API_KEY}`, 0, 10)
      },
      network_id: 3,
      gasPrice: 25000000000
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};