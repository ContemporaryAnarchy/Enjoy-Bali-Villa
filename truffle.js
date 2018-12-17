const { readFileSync } = require('fs')
const path = require('path')
const HDWalletProvider = require('truffle-hdwallet-provider')

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider('bargain radar abuse among segment talent floor rice jazz banana chair midnight', "https://ropsten.infura.io/92605767b61346d28be78407e0e7fc62", 0, 10)
      },
      network_id: 3,
      gasPrice: 25000000000
    }
  }
};