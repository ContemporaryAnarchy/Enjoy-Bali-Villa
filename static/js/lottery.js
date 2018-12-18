let Lottery = {

    web3Inst: null,
    contractInst: {},
    initializeEvent: null,
    contractAddress: null,
    account: null,
    
    newWeb3: function() {
        return new Promise(async function(resolve, reject) {
            if (window.ethereum) {
                window.web3 = new Web3(ethereum);
                try {
                    await ethereum.enable();
                    Lottery.web3Inst = window.web3
                    Lottery.newContract()

                    resolve('works')
                } catch (error) {
                    console.log('denied')
                }
            } else {
                window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
                Lottery.web3Inst = window.web3
                Lottery.newContract()

                resolve('works')
            }

        })
    },

    newContract: function() {
        $.getJSON('build/contracts/Lottery.json', function(lottery) {
            let abi = lottery.abi
            this.contractAddress = lottery.networks['3'].address
            Lottery.contractInst.lotteryContract = Lottery.web3Inst.eth.contract(abi).at(this.contractAddress)
            return Lottery.listenForEvents()
        })
    },

    listenForEvents: function() {
        Lottery.contractInst.lotteryContract.lottoInitialized({}, {
            toBlock: 'latest'
        }).watch(function(error, event) {
            console.log(event)
        })
        Lottery.contractInst.lotteryContract.ticketPurchased({}, {
            toBlock: 'latest'
        }).watch(function(error, event) {
            console.log(event)
        })
        Lottery.contractInst.lotteryContract.logNumberReceived({}, {
            toBlock: 'latest'
        }).watch(function(error, event) {
            console.log(event)
        })
        Lottery.contractInst.lotteryContract.logQuery({}, {
            toBlock: 'latest'
        }).watch(function(error, event) {
            console.log(event)
        })
        Lottery.contractInst.lotteryContract.winner({}, {
            toBlock: 'latest'
        }).watch(function(error, event) {
            console.log(event)
        })
    },

    initLotto: function() {
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

        Lottery.contractInst.lotteryContract.initialize(softWei, hardWei, ticketPriceWei, startTimeSeconds, {from: this.web3Inst.eth.accounts[0], gas: 180000}, function(error, result) {
            if (error) {
                console.log(error)
            } else {
                console.log(result)
            }
        })

    },

    //Use raw transaction 
    freeTicket: function(address) {
        return
    },


    buyTicket: function(amount) {
        Lottery.contractInst.lotteryContract.ticketPrice.call(function(error, result) {
            if (error) {
                console.log(error)
            } else {   
                let ticketPriceWei = result.c[0] * 1e14
                console.log(ticketPriceWei)
                let totalAmount = ticketPriceWei * amount
                console.log(totalAmount)

                Lottery.contractInst.lotteryContract.buyTicket.sendTransaction({ from: this.account, value: totalAmount, gas: 180000}, function(error, result) {
                    if (error) {
                        console.log(error)
                    } else {
                        console.log(result)
                    }
                })
            }
        })
    }, 

    drawWinner: function() {
        Lottery.contractInst.lotteryContract.drawWinner({ from: this.web3Inst.eth.accounts[0]}, function(error, result){
            if (error) {
                console.log(error)
            } else {
                console.log(result)
            }
        })
    },

    withdraw: function() {
        Lottery.contractInst.lotteryContract.withdraw({ from: this.web3Inst.eth.accounts[0]}, function(error, result) {
            if (error) {
                console.log(error)
            } else {
                console.log(result)
            }
        })
    },

    //helper functions

    ownerTicketCount: function() {
        Lottery.contractInst.lotteryContract.getTicketAmount.call(this.web3Inst.eth.accounts[0], function(error, result){
            if (error) {
                console.log(error)
            } else  {
                console.log(result.c[0])
            }
        })
    },

    getTicketPrice: function() {
        Lottery.contractInst.lotteryContract.ticketPrice.call(function(error, result){
            if (error) {
                console.log(error)
            } else {
                console.log(result.c[0] * 1e14)
            }
        })
    },

    totalTicketsPurchased: function() {
        Lottery.contractInst.lotteryContract.ticketsPurchased.call(function (error, result) {
            if (error) {
                console.log(error)
            } else {
                console.log(result.c[0])
            }
        })
    },

    getValues: function() {
        Lottery.contractInst.lotteryContract.getValues.call(function(error, result) {
            if (error) {
                console.log(error)
            } else {
                console.log(result)
            }
        })
    },

    isInitialized: function() {
        Lottery.contractInst.lotteryContract.isInitialized.call(function (error, result) {
            if (error) {
                console.log(error)
            } else {
                console.log(result)
            }
        })
    } 
}
$(document).ready(function() {
    Lottery.newWeb3().then(function(works) {
        Lottery.web3Inst.eth.getAccounts((err, response) => {
            Lottery.account = response
        })
    })
    
});
