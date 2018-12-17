var Lottery = artifacts.require("./Lottery.sol");

module.exports = function (deployer, network) {
    if (network !== 'ropsten') {
        deployer.deploy(Lottery, { from: web3.eth.accounts[0], value: 1e18 });
    } else {
        deployer.then(async () => {
            await deployer.deploy(Lottery, {value: 1e17})
        })
    }
};
