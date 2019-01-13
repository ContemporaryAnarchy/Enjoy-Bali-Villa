var Lottery = artifacts.require("./Lottery.sol");

module.exports = (deployer) => {
    deployer.deploy(Lottery, {value: 1e17})
    // web3.eth.getAccounts().then((acc) => {
    //     deployer.deploy(Lottery, {from: acc[0], value: 1e17})
    // })
};