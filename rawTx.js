require('dotenv').config();
let privateWeb3 = new Web3(`https://ropsten.infura.io/${process.env.INFURA_API_KEY}`)


const fromAccount = '0xF07AEb54CEFfe65C11277aC4265A19B11F1E5435'
const fromPrivate = Buffer.from(process.env.PRIVATE_KEY, 'hex')

let contractAddress = '0x087cC225b4eEC3505b9b70491C430702C36Dc6Ca'
let newContract = new privateWeb3.eth.Contract(abi, contractAddress)

let giveFreeTicket = function(address) {
        privateWeb3.eth.getTransactionCount(fromAccount, (err, txCount) => {
            const txObject = {
                nonce: privateWeb3.utils.toHex(txCount),
                to: contractAddress,
                gasLimit: privateWeb3.utils.toHex(1000000),
                gasPrice: privateWeb3.utils.toHex(privateWeb3.utils.toWei('20', 'gwei')),
                data: newContract.methods.freeTicket(address).encodeABI(),
            }

            const tx = new Tx(txObject)
            tx.sign(fromPrivate)
            const serializedTx = tx.serialize()
            const rawTx = '0x' + serializedTx.toString('hex')

            privateWeb3.eth.sendSignedTransaction(rawTx, (err, txHash) => {
                if (err) {
                    console.log(err)
                } else {
                    console.log(txHash)
                }
            })
        })
}



