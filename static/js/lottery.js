$(document).ready(function () {
    Lottery.init()
});

let Lottery = {

    web3Inst: null,
    contracts: {},
    loading: false,
    initializeEvent: null,
    contractInstance: null,
    account: null,
    
    init: async() => {
        await Lottery.newWeb3()
        await Lottery.newContract()
        await Lottery.render()
    },

    newWeb3: async () => {
        if (window.ethereum) {
            window.web3 = new Web3(ethereum);
            try {
                await ethereum.enable();
                Lottery.web3Inst = window.web3
            } catch (error) {
                console.log('denied')
            }
        } else {
            window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
            Lottery.web3Inst = window.web3
        }
    },
    
    newContract: async () => {
        const lottery = await $.getJSON('build/contracts/Lottery.json')
        Lottery.contracts.lotteryContract = TruffleContract(lottery)
        Lottery.contracts.lotteryContract.setProvider(web3.currentProvider)
    },

    render: async() => {
        if (Lottery.loading) {
            return
        }   

        Lottery.setLoading(true)

        //set current account
        Lottery.account = web3.eth.accounts[0]
        $('#account').html(this.account)

        //load the smart contract
        const contract = await Lottery.contracts.lotteryContract.deployed()
        Lottery.contractInstance = contract

        Lottery.setLoading(false)
    },

    setLoading: (boolean) => {
        Lottery.loading = boolean
        const loader = $('#loader')
        const content = $('#content')
        if (boolean) {
            loader.show()
            content.hide()
        } else {
            loader.hide()
            content.show()
        }
    },

    // test out async await pattern here
    listenForEvents: async () => {
        const lottoInitialized = await Lottery.contractInstance.lottoInitialized({}, {
            toBlock: 'latest'
        }).watch()
        
        console.log(lottoInitialized)

        Lottery.contractInstance.ticketPurchased({}, {
            toBlock: 'latest'
        }).watch(function(error, event) {
            console.log(event)
        })
        Lottery.contractInstance.logNumberReceived({}, {
            toBlock: 'latest'
        }).watch(function(error, event) {
            console.log(event)
        })
        Lottery.contractInstance.logQuery({}, {
            toBlock: 'latest'
        }).watch(function(error, event) {
            console.log(event)
        })
        Lottery.contractInstance.winner({}, {
            toBlock: 'latest'
        }).watch(function(error, event) {
            console.log(event)
        })
    },

    initLotto: async() => {
        //.call inspects the return value of the function 
        let soft = $('#soft').val()
        let softWei = this.web3Inst.toWei(soft, 'ether')

        let hard = $('#hard').val()
        let hardWei = this.web3Inst.toWei(hard, 'ether')

        let ticketPrice = $('#ticket_price').val()
        let ticketPriceWei = this.web3Inst.toWei(ticketPrice, 'ether')
        
        let weeks = $('#weeks').val()
        let days = $('#days').val()
        let hours = $('#hours').val()
        let minutes = $('#minutes').val()

        let startTimeSeconds = (weeks * 604800) + (days * 86400) + (hours * 3600) + (minutes * 60)

        const txHash = await Lottery.contractInstance.initialize(softWei, hardWei, ticketPriceWei, startTimeSeconds, {from: this.account})
    },

    //Use raw transaction 
    freeTicket: function(address) {
        return
    },


    buyTicket: async(amount) => {
        const ticketPrice = await Lottery.contractInstance.ticketPrice.call()

        console.log(ticketPrice)

        let ticketPriceWei = ticketPrice.c[0] * 1e14
        let totalAmount = ticketPriceWei * amount

        const txHash = await Lottery.contractInstance.buyTicket.sendTransaction({from: this.account, value: totalAmount, gas: 180000})

        console.log(txHash)
    }, 

    drawWinner: async() => {
        await Lottery.contractInstance.drawWinner({ from: this.web3Inst.eth.accounts[0]})
    },

    withdraw: async() => {
        await Lottery.contractInstance.withdraw({ from: this.web3Inst.eth.accounts[0]})
    },

    //helper functions

    ownerTicketCount: async() => {
        const result = await Lottery.contractInstance.getTicketAmount.call(this.web3Inst.eth.accounts[0])
        console.log(result.c[0])
    },

    getTicketPrice: async() => {
        const result = await Lottery.contractInstance.ticketPrice.call()
        console.log(result.c[0] * 1e14)
    },

    totalTicketsPurchased: async() => {
        const result = await Lottery.contractInstance.ticketsPurchased.call()
        console.log(result.c[0])
    },

    getValues: async() => {
        const result = await Lottery.contractInstance.getValues.call()
        console.log(result)
    },

    isInitialized: async() => {
        const result = await Lottery.contractInstance.isInitialized.call()
        console.log(result)
    } 
}

