const Lottery = artifacts.require('./Lottery.sol');
require('dotenv').config();
const hdWalletProvider = require('truffle-hdwallet-provider')
const Web3 = require('web3')
const provider = new hdWalletProvider(process.env.GANACHE_MNEMONIC, 'http://127.0.0.1:8545')
const web = new Web3(provider)

contract('Lottery', (accounts) => {
    it("Initializes the test value", async () => {
        const lottery = await Lottery.deployed()
        const value = await lottery.testValue()

        assert.equal(value, 1)
    })

    it("Initializes the lottery", async () => {
        const lottery = await Lottery.deployed()
        const txHash = await lottery.initialize(1, 1, 100000000000, 1)

        const softCap = await lottery.softCap()
        const hardCap = await lottery.hardCap()
        const ticketPrice = await lottery.ticketPrice()
        const startTime = await lottery.startTime()

        assert.equal(softCap, 1)
        assert.equal(hardCap, 1)
        assert.equal(ticketPrice, 100000000000)
        assert.isAtLeast(parseInt(startTime), 1)

    })

    it("Buys tickets", async () => {
        const lottery = await Lottery.deployed()
        const txHash = await lottery.buyTicket({from: accounts[0], value: 1e18})
        const amount = await lottery.getTicketAmount(accounts[0])

        assert.isAtLeast(parseInt(amount), 1)
    })

    it('Sends Oraclize query', async () => {
        const lottery = await Lottery.deployed()
        const receipt = await lottery.drawWinner()
        
        assert.equal(receipt.logs[0].args.description, 'Oraclize query was sent. Standing by for response.')
    })

})