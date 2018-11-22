const Web3 = require('web3')
const fs = require("fs");
const Lottery = require('./../build/contracts/Lottery')

class web3Helper {
    constructor() {
        this.web3Inst = null
        this.contractInst = []
    }



    newContract() {
        let abi = Lottery.abi
        let address = Lottery.networks.address
        let name = 'lottery'
        this.contractInst[name] = this.web3Inst.eth.contract(abi).at(address)
    }



    newWeb3() {
        return new Promise((resolve, reject) => {
            if (typeof web3 !== 'undefined') {
                var web3 = new Web3(web3.currentProvider);
                this.web3Inst = web3
                this.newContract()
                resolve(this.web3Inst)
            } else {
                // set the provider you want from Web3.providers
                var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
                this.web3Inst = web3
                resolve(this.web3Inst)
            }
        })
    }

    



}
module.exports = web3Helper;