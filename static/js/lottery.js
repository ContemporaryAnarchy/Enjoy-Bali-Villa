$(document).ready(function () {
    Lottery.init()
});

let Lottery = {
    contracts: {},
    loading: false,
    contractInstance: null,
    account: null,
    unixStartTime: null,
    timerRunning: false,
    stopTimer: false,
    lottoId: null,

    
    init: async() => {
        await Lottery.newWeb3()
        await Lottery.newContract()
        await Lottery.render()
        await Lottery.setBalances()
        
        const isActive = await Lottery.isInitialized()
        if (isActive) {
            Lottery.countdown()
        }

        Lottery.listenForEvents()
    },

    newWeb3: async () => {
        if (window.ethereum) {
            window.web3 = new Web3(ethereum);
            try {
                await ethereum.enable();
            } catch (error) {
                console.log('User denied authorization')
            }
        } else {
            window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
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

        Lottery.account = web3.eth.accounts[0]
        $('#account').html(Lottery.account)

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
        Lottery.unixStartTime = parseInt(startTimeUnix.c[0]) * 1000

        let ticketPrice = await Lottery.getTicketPrice()
        let isInitialized = await Lottery.isInitialized()
        let totalPlayersArray = await Lottery.playerCount()
        let totalPlayers = totalPlayersArray.c[0]
        let totalTickets = await Lottery.totalTicketsPurchased()
        let yourTickets = await Lottery.ownerTicketCount()
        let ownerBalance = await Lottery.getOwnerBalance()
        
        return {
                isInitialized: isInitialized,
                softCap: softCap,
                hardCap: hardCap,
                ticketPrice: ticketPrice,
                totalTickets: totalTickets,
                totalPlayers: totalPlayers,
                yourTickets: yourTickets,
                ownerBalance: ownerBalance
            }  
        
    },

    countdown: () => {
        let end = Lottery.unixStartTime

        let countDown = setInterval(() => {
            
            Lottery.timerRunning = true
            if (Lottery.stopTimer) {
                $('#weeks_timer').html(0)
                $('#days_timer').html(0)
                $('#hours_timer').html(0)
                $('#minutes_timer').html(0)
                $('#seconds_timer').html(0)
                clearInterval(countDown)
            } else {
                let now = new Date().getTime()
                let distance = (end - now)
                let totalSeconds = Math.floor(distance / 1000)
                let newDate = new Date(totalSeconds * 1000)

                let weeks = Math.floor(totalSeconds / 604800)
                let days = 0
                
                if (weeks === 0) {
                    days = Math.floor(totalSeconds / 86400)
                } else {
                    days = Math.floor((totalSeconds % (weeks * 604800)) / 86400)
                }
                
                let hours = 0 

                if (days == 0 && weeks == 0) {
                    hours = Math.floor(totalSeconds / 3600)
                } else if (days == 0 && weeks != 0) {
                    let remainderA = totalSeconds % 604800
                    hours = Math.floor(remainderA / 3600)
                } else if (weeks == 0 && days != 0) {
                    let remainderB = totalSeconds % 86400
                    hours = Math.floor(remainderB / 3600)
                } else if (weeks != 0 && days != 0) {
                    let remainderC = totalSeconds % 604800
                    let remainderD = remainderC % 86400
                    hours = Math.floor(remainderD / 3600)
                }

                let minutes = newDate.getMinutes()
                let seconds = newDate.getSeconds()
    
                $('#weeks_timer').html(weeks)
                $('#days_timer').html(days)
                $('#hours_timer').html(hours)
                $('#minutes_timer').html(minutes)
                $('#seconds_timer').html(seconds)
            }
        }, 1000)
    },

    setBalances: async () => {
        const values = await Lottery.retrieveValues()
        let odds = (values.yourTickets / values.totalTickets) * 100
        let oddsPrecise = odds.toPrecision(4) 

        $('#balance').html(values.ownerBalance)
        if (values.isInitialized) {
            if (values.yourTickets > 0) {
                $('#odds').html(oddsPrecise + " %")
            }
            $('#soft_cap').html(values.softCap)
            $('#hard_cap').html(values.hardCap)
            $('#ticket_price').html(web3.fromWei(values.ticketPrice, 'ether'))
            $('#tickets_purchased').html(values.totalTickets)
            $('#total_players').html(values.totalPlayers)
            $('#your_tickets').html(values.yourTickets)
            $('#lottery_active').html('True')
        } else {
            $('#soft_cap').html('-')
            $('#hard_cap').html('-')
            $('#ticket_price').html('-')
            $('#tickets_purchased').html('-')
            $('#total_players').html('-')
            $('#your_tickets').html('-')
            $('#lottery_active').html('False')
        }
    },

    


    // test out async await pattern here
    listenForEvents: () => {
        Lottery.contractInstance.ticketPurchased({}, {
            toBlock: 'latest'
        }).watch(function(error, event) {
            Lottery.setBalances()
            $('#buy_tickets_loader').css('visibility', 'hidden')
        })

        Lottery.contractInstance.balancesReset({}, {
            toBlock: 'latest'
        }).watch(async(error, event) => {
            await Lottery.setBalances()
            Lottery.stopTimer = true
            Lottery.timerRunning = false
            $('#winner_loader').css('visibility', 'hidden')
        })

        Lottery.contractInstance.lottoInitialized({}, {
            toBlock: 'latest'
        }).watch(async(error, event) => {
            Lottery.stopTimer = false
            Lottery.lottoId = event.args.id
            await Lottery.setBalances()
            
            $('#init_loader').css('visibility', 'hidden')
            $('#winner_address').html('-')

            if (!Lottery.timerRunning) {
                Lottery.countdown()
            }
        })

        Lottery.contractInstance.winner({}, {
            toBlock: 'latest'
        }).watch((error, event) => {
            $('#winner_address').html(event.args.winner)
            $('#winner_loader').css('visibility', 'hidden')
            Lottery.stopTimer = true

        })
        

        Lottery.contractInstance.deposit({}, {
            toBlock: 'latest'
        }).watch(async(error, event) => {
            await Lottery.setBalances()
            $('#deposit_loader').css('visibility', 'hidden')
        })

        Lottery.contractInstance.withdraw({}, {
            toBlock: 'latest'
        }).watch(async(error, event) => {
            await Lottery.setBalances()
            $('#withdraw_loader').css('visibility', 'hidden')
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

        if (weeks == 0) {
            weeks = ''
        }
        if (days == 0) {
            days = ''
        }
        if (hours == 0) {
            hours = ''
        }
        if (minutes == 0) {
            minutes = ''
        }
        let startTimeSeconds = (weeks * 604800) + (days * 86400) + (hours * 3600) + (minutes * 60) 

        $('#init_loader').css('visibility', 'visible')
        try {
            await Lottery.contractInstance.initialize(softWei, hardWei, ticketPriceWei, startTimeSeconds, {from: Lottery.account})
        } catch {
            $('#init_loader').css('visibility', 'hidden')
        }

    },

    //Use raw transaction 
    freeTicket: function(address) {
        return
    },


    buyTicket: async (amount) => {
        const ticketPrice = await Lottery.contractInstance.ticketPrice.call()

        let ticketPriceWei = ticketPrice.c[0] * 1e14
        let totalAmount = ticketPriceWei * amount

        $('#buy_tickets_loader').css('visibility', 'visible')
        try {
            await Lottery.contractInstance.buyTicket.sendTransaction({ from: Lottery.account, value: totalAmount, gas: 180000 })
        } catch {
            $('#buy_tickets_loader').css('visibility', 'hidden')
        }
    }, 

    drawWinner: async() => {
        $('#winner_loader').css('visibility', 'visible')
        try {
            await Lottery.contractInstance.drawWinner({from: web3.eth.accounts[0]})
        } catch {
            $('#winner_loader').css('visibility', 'hidden')
        }
    },

    withdraw: async() => {
        $('#withdraw_loader').css('visibility', 'visible')
        try {
            await Lottery.contractInstance.withdrawOwnerBalance({from: web3.eth.accounts[0]})
        } catch {
            $('#withdraw_loader').css('visibility', 'hidden')
        }
    },

    deposit: async(amount) => {
        $('#deposit_loader').css('visibility', 'visible')
        try {
            await Lottery.contractInstance.sendTransaction({from: web3.eth.accounts[0], value: amount})
        } catch {
            $('#deposit_loader').css('visibility', 'hidden')
        }
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
        return result.c[0] / 1e4
    },
    
    hardCap: async() => {
        const result = await Lottery.contractInstance.hardCap()
        return result.c[0] / 1e4
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

    getOwnerBalance: async() => {
        const result = await Lottery.contractInstance.getOwnerBalance()
        return result.c[0] / 1e4
    }
}

