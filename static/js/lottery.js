let Lottery = {

    web3Inst: null,
    contractInst: {},
    coinbase: null,
    initializeEvent: null,
    contractAddress: null,
    
    newWeb3: function() {
        if (typeof web3 !== 'undefined') {
            web3 = new Web3(web3.currentProvider);
            console.log('metamask is installed')
            Lottery.web3Inst = web3
            Lottery.newContract()
        } else {
            // set the provider you want from Web3.providers
            web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
            Lottery.web3Inst = web3
            console.log('chode')
            Lottery.newContract()
        }
    },

    newContract: function() {
        $.getJSON('build/contracts/Lottery.json', function(lottery) {
            let abi = lottery.abi
            this.contractAddress = lottery.networks['5777'].address
            Lottery.contractInst.lotteryContract = Lottery.web3Inst.eth.contract(abi).at(this.contractAddress)
            Lottery.listenForEvents()
            return Lottery.setCoinbase()
        })
    },

    setCoinbase: function() {
        Lottery.coinbase = Lottery.web3Inst.eth.coinbase
        console.log('COINBASE SET')
    },

    listenForEvents: function() {
        Lottery.contractInst.lotteryContract.lottoInitialized({}, {
            fromBlock: '0',
            toBlock: 'latest'
        }).watch(function(error, event) {
            console.log(event)
        })
        Lottery.contractInst.lotteryContract.ticketPurchased({}, {
            fromBlock: '0',
            toBlock: 'latest'
        }).watch(function(error, event) {
            console.log(event)
        })
    },
    
    getData: function() {
        Lottery.contractInst.lotteryContract.getData({from: Lottery.coinbase}, function(error, result) {
            if (error) {
                console.log(error)
            } else {
                console.log(result)
            }
        })
    },

    initLotto: function() {
        //.call inspects the return value of the function 
        let soft = $('#soft').val()
        let softWei = this.web3Inst.toWei(soft, 'ether')

        let hard = $('#hard').val()
        let hardWei = this.web3Inst.toWei(hard, 'ether')

        let villaPrice = $('#villa_price').val()
        let villaPriceWei = this.web3Inst.toWei(villaPrice, 'ether')

        let ticketPrice = $('#ticket_price').val()
        let ticketPriceWei = this.web3Inst.toWei(ticketPrice, 'ether')
        
        let weeks = $('#weeks').val()
        let days = $('#days').val()
        let hours = $('#hours').val()
        let minutes = $('#minutes').val()

        let startTimeSeconds = (weeks * 604800) + (days * 86400) + (hours * 3600) + (minutes * 60)

        Lottery.contractInst.lotteryContract.initialize(softWei, hardWei, villaPriceWei, ticketPriceWei, startTimeSeconds, {from: Lottery.coinbase, gas: 180000}, function(error, result) {
            if (error) {
                console.log(error)
            } else {
                console.log(result)
            }
        })

    },


    buyTicket: function(amount) {

        scopedWeb3 = this.web3Inst

        Lottery.contractInst.lotteryContract.getTicketPrice.call({from: this.coinbase}, function(error, result) {
            if (error) {
                console.log(error)
            } else {
                let ticketPriceEther = result.c[0] / 10000
                let ticketPriceWei = scopedWeb3.toWei(ticketPriceEther, 'ether')
                let totalAmount = ticketPriceWei * amount

                Lottery.contractInst.lotteryContract.buyTicket.sendTransaction({ from: this.coinbase, value: totalAmount, gas: 180000}, function(error, result) {
                    if (error) {
                        console.log(error)
                    } else {
                        console.log(result)
                    }
                })
            }

        })

    }, 

    getBuyerPositions: function() {
        let account = this.coinbase
        Lottery.contractInst.lotteryContract.getBuyerPositions.call(account, {from: account}, function(error, result) {
            console.log(error)
            console.log(result)
        })
    },

    getBuyerPosition: function() {
        Lottery.contractInst.lotteryContract.getbuyerPosition.call({from: this.coinbase}, function(error, result) {
            if (error) {
                console.log(error)
            } else {
                console.log(result)
            }
        })
    }
}
$(document).ready(function() {
    Lottery.newWeb3()
});
