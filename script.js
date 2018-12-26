module.exports = function (callback) {
    web3.eth.getBlock('latest').then(console.log)
}