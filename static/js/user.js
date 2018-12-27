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

    init: async () => {
        await Lottery.newWeb3()
        await Lottery.newContract()
        await Lottery.render()
        await Lottery.setBalances()
        Lottery.listenForEvents()
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

    render: async () => {
        if (Lottery.loading) {
            return
        }

        Lottery.setLoading(true)

        //set current account
        Lottery.account = web3.eth.accounts[0]
        $('#account').html(Lottery.account)

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

    retrieveValues: async () => {
        let startTimeUnix = await Lottery.startTime()

        let ticketPrice = await Lottery.getTicketPrice()
        let isInitialized = await Lottery.isInitialized()
        let totalPlayersArray = await Lottery.playerCount()
        let totalTickets = await Lottery.totalTicketsPurchased()
        let yourTickets = await Lottery.ownerTicketCount()

        Lottery.countdown(startTimeUnix, isInitialized)

        return {
            isInitialized: isInitialized,
            ticketPrice: ticketPrice,
            totalTickets: totalTickets,
            yourTickets: yourTickets,
        }

    },

    setBalances: async () => {
        const values = await Lottery.retrieveValues()
        let odds = (values.yourTickets / values.totalTickets) * 100
        let oddsPrecise = odds.toPrecision(4) 

        if (values.isInitialized) {
            if (values.yourTickets > 0) {
                $('#odds').html(oddsPrecise + " %")
            }
            $('#ticket_price').html(web3.fromWei(values.ticketPrice, 'ether'))
            $('#your_tickets').html(values.yourTickets)
            $('#lottery_active').html('True')
        }
    },

    countdown: (unix, initialized) => {
        let countDown = setInterval(() => {
            let now = new Date().getTime()
            let end = (parseInt(unix) * 1000)
            let distance = end - now
            let totalSeconds = distance / 1000

            let weeks = Math.floor(totalSeconds / 604800)
            let days = Math.floor((totalSeconds % (weeks * 604800)) / 86400)
            let hours = Math.floor((totalSeconds % (days * 86400 + weeks * 604800)) / 3600)
            let minutes = Math.floor((totalSeconds % (hours * 3600 + days * 86400 + weeks * 604800)) / 60)
            let seconds = Math.floor(totalSeconds % (minutes * 60 + hours * 3600 + days * 86400 + weeks * 604800))
            if (initialized) {
                $('#weeks_timer').html(weeks)
                $('#days_timer').html(days)
                $('#hours_timer').html(hours)
                $('#minutes_timer').html(minutes)
                $('#seconds_timer').html(seconds)
                if (distance < 0) {
                    clearInterval(countDown)
                    $('#weeks_timer').html(0)
                    $('#days_timer').html(0)
                    $('#hours').html(0)
                    $('#minutes').html(0)
                    $('#seconds').html(0)
                }
            }


        }, 1000)
    },


    // test out async await pattern here
    listenForEvents: () => {
        Lottery.contractInstance.ticketPurchased({}, {
            toBlock: 'latest'
        }).watch(function (error, event) {
            Lottery.setBalances()
        })
    },


    //Use raw transaction 
    freeTicket: function (address) {
        return
    },

    buyTicket: async (amount) => {
        const ticketPrice = await Lottery.contractInstance.ticketPrice.call()

        let ticketPriceWei = ticketPrice.c[0] * 1e14
        let totalAmount = ticketPriceWei * amount

        const txHash = await Lottery.contractInstance.buyTicket.sendTransaction({ from: Lottery.account, value: totalAmount, gas: 180000 })
    },

    //helper functions

    ownerTicketCount: async () => {
        const result = await Lottery.contractInstance.getTicketAmount.call(web3.eth.accounts[0])
        return result.c[0]
    },

    getTicketPrice: async () => {
        const result = await Lottery.contractInstance.ticketPrice()
        return result.c[0] * 1e14
    },

    totalTicketsPurchased: async () => {
        const result = await Lottery.contractInstance.ticketsPurchased()
        return result.c[0]
    },

    startTime: async () => {
        const result = await Lottery.contractInstance.startTime()
        return result
    },

    isInitialized: async () => {
        const result = await Lottery.contractInstance.isInitialized()
        return result
    },

    playerCount: async () => {
        const result = await Lottery.contractInstance.playerCount()
        return result
    },

}

