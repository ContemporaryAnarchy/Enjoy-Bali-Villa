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
        await Lottery.retrieveValues()
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
        let softCap = await Lottery.softCap()
        let hardCap = await Lottery.hardCap()
        let startTimeUnix = await Lottery.startTime()

        let ticketPrice = await Lottery.getTicketPrice()
        let isInitialized = await Lottery.isInitialized()
        let totalPlayersArray = await Lottery.playerCount()
        let totalPlayers = totalPlayersArray.c[0]
        let totalTickets = await Lottery.totalTicketsPurchased()
        let yourTickets = await Lottery.ownerTicketCount()
        let contractBalance = await Lottery.contractBalance()

        Lottery.countdown(startTimeUnix, isInitialized)
        
        $('#balance').html(contractBalance)
        if (isInitialized) {
            $('#soft_cap').html(softCap)
            $('#hard_cap').html(hardCap)
            $('#ticket_price').html(web3.fromWei(ticketPrice, 'ether'))
            $('#tickets_purchased').html(totalTickets)
            $('#total_players').html(totalPlayers)
            $('#your_tickets').html(yourTickets)
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
        let softWei = web3.toWei(soft, 'ether')

        let hard = $('#hard').val()
        let hardWei = web3.toWei(hard, 'ether')

        let ticketPrice = $('#ticket-price').val()
        let ticketPriceWei = web3.toWei(ticketPrice, 'ether')
        
        let weeks = $('#weeks').val()
        let days = $('#days').val()
        let hours = $('#hours').val()
        let minutes = $('#minutes').val()

        let startTimeSeconds = (weeks * 604800) + (days * 86400) + (hours * 3600) + (minutes * 60)

        const txHash = await Lottery.contractInstance.initialize(softWei, hardWei, ticketPriceWei, startTimeSeconds, {from: Lottery.account})

        const lottoInitialized = await Lottery.contractInstance.lottoInitialized({}, {
            toBlock: 'latest'
        }).watch()

        console.log(lottoInitialized)
    },

    //Use raw transaction 
    freeTicket: function(address) {
        return
    },


    buyTicket: async(amount) => {
        const ticketPrice = await Lottery.contractInstance.ticketPrice.call()

        let ticketPriceWei = ticketPrice.c[0] * 1e14
        let totalAmount = ticketPriceWei * amount

        const txHash = await Lottery.contractInstance.buyTicket.sendTransaction({from: Lottery.account, value: totalAmount, gas: 180000})
    }, 

    drawWinner: async() => {
        await Lottery.contractInstance.drawWinner({from: web3.eth.accounts[0]})
    },

    withdraw: async() => {
        await Lottery.contractInstance.withdraw({from: web3.eth.accounts[0]})
    },

    deposit: async(amount) => {
        await Lottery.contractInstance.sendTransaction({from: web3.eth.accounts[0], value: amount})
    },

    //helper functions

    ownerTicketCount: async() => {
        const result = await Lottery.contractInstance.getTicketAmount.call(web3.eth.accounts[0])
        return result.c[0]
    },

    getTicketPrice: async() => {
        const result = await Lottery.contractInstance.ticketPrice()
        return result.c[0] * 1e14
    },

    totalTicketsPurchased: async() => {
        const result = await Lottery.contractInstance.ticketsPurchased()
        return result.c[0]
    },

    softCap: async() => {
        const result = await Lottery.contractInstance.softCap()
        return result.c[0] / 1e5
    },
    
    hardCap: async() => {
        const result = await Lottery.contractInstance.hardCap()
        return result.c[0] / 1e5
    },

    startTime: async() => {
        const result = await Lottery.contractInstance.startTime()
        return result
    },

    isInitialized: async() => {
        const result = await Lottery.contractInstance.isInitialized()
        return result
    },

    playerCount: async() => {
        const result = await Lottery.contractInstance.playerCount()
        return result
    },

    contractBalance: async() => {
        const result = await Lottery.contractInstance.contractBalance()
        return result.c[0] / 1e4
    }
}

